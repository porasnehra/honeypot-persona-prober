import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ANALYSIS_PROMPT = `You are an intelligence extraction system. Analyze the conversation and extract ONLY explicitly mentioned data.

CRITICAL RULES:
- ONLY extract data that is EXPLICITLY written in the conversation
- NEVER guess, predict, or fabricate any values
- If no data is found for a field, return an empty array []
- Be conservative - when in doubt, don't include it

Return a JSON object:
{
  "isScam": boolean,
  "scamType": string or null,
  "threatLevel": "low" | "medium" | "high" | "critical",
  "confidence": number (0-100),
  "extractedData": {
    "bankAccounts": [],
    "upiIds": [],
    "phoneNumbers": [],
    "emails": [],
    "urls": [],
    "cryptoWallets": [],
    "names": [],
    "organizations": []
  },
  "indicators": [],
  "summary": string
}

EXTRACTION PATTERNS (only if explicitly present):
- Bank accounts: actual account numbers written out
- UPI IDs: format name@provider (e.g., john@upi)
- Phone numbers: actual digits provided
- Emails: actual email addresses
- URLs: actual links/domains
- Crypto wallets: actual wallet addresses

If the conversation is casual/normal with no scam indicators, set isScam to false and threatLevel to "low".`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { conversation } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const conversationText = conversation
      .map((msg: { role: string; content: string }) => `${msg.role}: ${msg.content}`)
      .join('\n\n');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: ANALYSIS_PROMPT },
          { role: 'user', content: `Analyze this conversation:\n\n${conversationText}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analysis error:', response.status, errorText);
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || '{}';
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      // If JSON parsing fails, return a default structure
      analysis = {
        isScam: false,
        scamType: null,
        threatLevel: 'low',
        confidence: 0,
        extractedData: {
          bankAccounts: [],
          upiIds: [],
          phoneNumbers: [],
          emails: [],
          urls: [],
          cryptoWallets: [],
          names: [],
          organizations: [],
        },
        indicators: [],
        summary: 'Unable to analyze conversation.',
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Intelligence analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
