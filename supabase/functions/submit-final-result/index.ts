import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const GUVI_CALLBACK_URL = 'https://hackathon.guvi.in/api/updateHoneyPotFinalResult';

interface ExtractedIntelligence {
  bankAccounts: string[];
  upiIds: string[];
  phishingLinks: string[];
  phoneNumbers: string[];
  suspiciousKeywords: string[];
}

interface FinalResultRequest {
  sessionId: string;
  scamDetected: boolean;
  totalMessagesExchanged: number;
  extractedIntelligence: ExtractedIntelligence;
  agentNotes: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: FinalResultRequest = await req.json();
    
    console.log(`[${payload.sessionId}] Submitting final result to GUVI`);
    console.log(`[${payload.sessionId}] Scam detected: ${payload.scamDetected}`);
    console.log(`[${payload.sessionId}] Total messages: ${payload.totalMessagesExchanged}`);
    console.log(`[${payload.sessionId}] Extracted intelligence:`, payload.extractedIntelligence);

    // Submit to GUVI evaluation endpoint
    const response = await fetch(GUVI_CALLBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${payload.sessionId}] GUVI callback failed:`, response.status, errorText);
      throw new Error(`GUVI callback failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[${payload.sessionId}] GUVI callback success:`, result);

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Final result submitted to GUVI successfully',
      guviResponse: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Submit final result error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
