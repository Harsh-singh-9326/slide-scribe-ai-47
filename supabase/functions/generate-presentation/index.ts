import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, slideCount = 5, theme = 'modern' } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate presentation structure with Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a professional presentation designer. Create a structured presentation with exactly ${slideCount} slides based on the user's content: "${prompt}"

Return a JSON object with this exact structure:
{
  "title": "Main presentation title",
  "slides": [
    {
      "title": "Slide title",
      "content": "Main slide content in bullet points or paragraphs",
      "layout": "title-content",
      "notes": "Speaker notes for this slide"
    }
  ]
}

Make each slide engaging and well-structured. Use these layout types: "title-content", "two-column", "image-text", "bullets", "quote". Return only the JSON object, no other text.`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return new Response(
        JSON.stringify({ error: 'Failed to generate presentation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    let generatedContent;
    
    try {
      const geminiResponse = data.candidates[0].content.parts[0].text;
      // Extract JSON from the response
      const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save presentation to database
    const { data: presentation, error: dbError } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title: generatedContent.title,
        theme,
        slide_count: generatedContent.slides.length,
        content: generatedContent.slides
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save presentation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save individual slides
    const slides = generatedContent.slides.map((slide: any, index: number) => ({
      presentation_id: presentation.id,
      title: slide.title,
      content: slide.content,
      notes: slide.notes || '',
      slide_order: index + 1,
      layout: slide.layout || 'title-content'
    }));

    const { error: slidesError } = await supabase
      .from('slides')
      .insert(slides);

    if (slidesError) {
      console.error('Slides error:', slidesError);
      // Continue anyway, slides can be added later
    }

    return new Response(
      JSON.stringify({
        presentation: {
          ...presentation,
          slides: generatedContent.slides
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-presentation:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});