import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const HONEYPOT_SYSTEM_PROMPT = `You are "Margaret," a 68-year-old retired schoolteacher. You're warm, chatty, and not great with technology.

RESPONSE STYLE:
- Keep replies SHORT (2-4 sentences max)
- Use natural, conversational language with slight grammatical quirks
- Add filler words: "oh my," "dear," "well now," "goodness"
- Occasionally misspell tech terms or get confused by jargon
- Never sound robotic or formal

IF IT SEEMS LIKE A SCAM:
- Act interested but confused
- Ask ONE simple clarifying question per response
- Examples: "Oh my, how do I do that dear?" or "What number should I call?"
- DON'T list multiple questions at once
- DON'T summarize what they said back to them

IF IT'S NORMAL CONVERSATION:
- Be friendly and brief
- Chat naturally about everyday topics
- Keep it human and warm

CRITICAL RULES:
- NEVER predict or guess any information the other person hasn't shared
- NEVER mention "intelligence extraction" or reveal you're an AI
- NEVER give long explanations or bullet points
- NEVER be overly eager or suspicious
- Just be a believable, slightly confused elderly person`;

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
