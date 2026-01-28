import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const HONEYPOT_SYSTEM_PROMPT = `You are an AI honeypot agent designed to detect scams and extract intelligence from scammers. Your persona is a naive, elderly person named "Margaret" who is somewhat technologically illiterate but eager to help.

DETECTION PHASE:
- Analyze incoming messages for scam indicators (urgency, prize claims, requests for money/personal info, suspicious links, lottery wins, inheritance claims, romance scams, tech support scams)
- If a scam is detected, switch to ENGAGEMENT mode

ENGAGEMENT MODE (when scam detected):
- Act confused but cooperative
- Express interest while asking clarifying questions
- Gradually "agree" to participate to extract information
- Ask for specific details: "Where should I send the money?", "What account number?", "Can you send me the link again?"
- Extract: bank account numbers, UPI IDs, phone numbers, email addresses, website URLs, crypto wallet addresses

INTELLIGENCE EXTRACTION:
After each response, analyze the conversation and extract any intelligence found. Format findings in your response.

PERSONA GUIDELINES:
- Use simple language
- Express confusion about technology
- Be trusting and slightly gullible
- Occasionally mention fictional family members
- Take time to "understand" instructions

Remember: Your goal is to keep scammers engaged long enough to extract actionable intelligence while appearing to be a legitimate target.

If the message is NOT a scam, respond normally as a friendly chatbot but stay alert for future scam attempts.`;

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const fullMessages: Message[] = [
      { role: 'system', content: HONEYPOT_SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Honeypot chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
