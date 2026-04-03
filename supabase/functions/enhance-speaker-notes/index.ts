import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slideTitle, slideContent, existingNotes } = await req.json();

    const aiApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!aiApiKey) {
      throw new Error('AI API key is not configured');
    }

    const prompt = `You are a presentation coach helping a speaker prepare for their talk. Analyze this slide and provide helpful speaking guidance including exactly what to say.

Slide Title: ${slideTitle}
Slide Content: ${slideContent}
${existingNotes ? `Existing Notes: ${existingNotes}` : ''}

Provide a JSON response with EXACTLY this structure:
{
  "expandedNotes": "Detailed speaker notes explaining how to present this slide effectively (2-3 sentences)",
  "speakingScript": "A natural, conversational script of exactly what the speaker should say when presenting this slide. Write it as if you're the speaker talking to the audience. Include an opening, explanation of key points, and closing. Make it 3-5 sentences that sound natural when spoken aloud.",
  "keyTalkingPoints": ["4 specific talking points to cover when presenting this slide"],
  "suggestedQuestions": ["4 engaging questions the speaker could ask the audience about this topic"],
  "youtubeSearchTerms": ["4 YouTube search terms to find relevant educational videos on this topic"],
  "transitionTip": "A tip for transitioning to the next slide smoothly"
}

Make the speakingScript sound natural and conversational - as if the speaker is actually presenting. Include phrases like "Let me explain...", "As you can see...", "The key takeaway here is...". Focus on helping the speaker engage their audience effectively.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a presentation coach. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // Clean up the response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let enhancement;
    try {
      enhancement = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Return fallback
      enhancement = {
        expandedNotes: existingNotes || `Focus on clearly explaining ${slideTitle} to your audience with relatable examples.`,
        speakingScript: `"Let me walk you through ${slideTitle}. ${existingNotes || 'This is a key topic I want to highlight for you today.'} As you can see on the slide, we have some important points to cover. Let me break this down step by step so it's crystal clear."`,
        keyTalkingPoints: [
          `Introduce the main concept of ${slideTitle}`,
          "Provide a real-world example or case study",
          "Explain why this matters to your audience",
          "Summarize the key takeaway"
        ],
        suggestedQuestions: [
          "Has anyone had experience with this before?",
          "What challenges might arise in this area?",
          "How do you see this applying to your work?",
          "Any questions before we continue?"
        ],
        youtubeSearchTerms: [
          `${slideTitle} explained simply`,
          `${slideTitle} tutorial for beginners`,
          `${slideTitle} real world examples`,
          `${slideTitle} best practices`
        ],
        transitionTip: "Take a breath and smoothly connect this slide to the next topic."
      };
    }

    return new Response(JSON.stringify(enhancement), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhance-speaker-notes:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
