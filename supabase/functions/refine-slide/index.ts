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
    
    const aiApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!aiApiKey) {
      console.error('AI API key not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const refinementPrompts = {
      'concise': 'Make this slide content more concise and impactful. Keep only the most important points (3-4 bullets maximum). Make each point clear and direct.',
      'detailed': 'Expand this slide content with more details, examples, and explanations. Add 2-3 more bullet points with specific information.',
      'professional': 'Rewrite this slide content in a professional, corporate tone. Use formal language and business terminology.',
      'casual': 'Rewrite this slide content in a friendly, casual tone. Make it conversational and easy to understand.',
      'technical': 'Rewrite this slide content with more technical depth. Add technical terms, specifications, and detailed explanations.',
      'regenerate-bullets': 'Rewrite this slide content into exactly 4 clear, concise bullet points while keeping the original meaning intact. Each bullet should be impactful and easy to understand. Do not add or remove key ideas, just reorganize and rewrite into exactly 4 bullets.',
      'custom': instruction
    };

    const systemPrompt = `You are an expert presentation content writer. Your task is to refine slide content based on user instructions while maintaining clarity and impact.

Return ONLY valid JSON in this exact format:
{
  "title": "Refined slide title",
  "content": "• Bullet point 1\\n• Bullet point 2\\n• Bullet point 3",
  "notes": "Speaker notes for this slide"
}`;

    const userPrompt = `Current slide content:
Title: ${slideContent.title}
Content: ${slideContent.content}

Task: ${refinementPrompts[instruction as keyof typeof refinementPrompts] || instruction}`;

    const response = await fetch(
      'https://ai.gateway.lovable.dev/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to refine slide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', aiResponse);
      throw new Error('No JSON found in response');
    }

    const refinedContent = JSON.parse(jsonMatch[0]);
    console.log('Successfully refined slide:', refinedContent.title);

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
