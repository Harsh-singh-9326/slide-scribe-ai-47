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
    const { slideContent, instruction, layout } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const refinementPrompts = {
      'concise': 'Make this slide content more concise and impactful. Keep only the most important points (3-4 bullets maximum). Make each point clear and direct.',
      'detailed': 'Expand this slide content with more details, examples, and explanations. Add 2-3 more bullet points with specific information.',
      'professional': 'Rewrite this slide content in a professional, corporate tone. Use formal language and business terminology.',
      'casual': 'Rewrite this slide content in a friendly, casual tone. Make it conversational and easy to understand.',
      'technical': 'Rewrite this slide content with more technical depth. Add technical terms, specifications, and detailed explanations.',
      'custom': instruction
    };

    const prompt = `Current slide content:
Title: ${slideContent.title}
Content: ${slideContent.content}

Task: ${refinementPrompts[instruction as keyof typeof refinementPrompts] || instruction}

Return ONLY valid JSON in this exact format:
{
  "title": "Refined slide title",
  "content": "• Bullet point 1\\n• Bullet point 2\\n• Bullet point 3",
  "notes": "Speaker notes for this slide"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to refine slide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const geminiResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const refinedContent = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(refinedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refine-slide:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
