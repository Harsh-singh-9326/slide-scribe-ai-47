import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Style presets for Gamma-like design
const STYLE_PRESETS = {
  minimal: {
    background_color: "#FFFFFF",
    font_family: "Inter, sans-serif",
    font_size_title: 32,
    font_size_bullets: 20,
    primary_color: "#2D3748",
    secondary_color: "#718096",
    accent_color: "#4A5568"
  },
  vibrant: {
    background_color: "#1A202C",
    font_family: "Poppins, sans-serif",
    font_size_title: 36,
    font_size_bullets: 22,
    primary_color: "#F56565",
    secondary_color: "#48BB78",
    accent_color: "#ED8936"
  },
  corporate: {
    background_color: "#F7FAFC",
    font_family: "Lato, sans-serif",
    font_size_title: 30,
    font_size_bullets: 18,
    primary_color: "#2B6CB0",
    secondary_color: "#4A5568",
    accent_color: "#38B2AC"
  },
  dark: {
    background_color: "#111111",
    font_family: "Inter, sans-serif",
    font_size_title: 34,
    font_size_bullets: 21,
    primary_color: "#00D4FF",
    secondary_color: "#FF6B6B",
    accent_color: "#4ECDC4"
  }
};

// Semantic chunking function
function chunkText(text: string, maxTokens = 800): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const estimatedTokens = (currentChunk + sentence).split(/\s+/).length;
    if (estimatedTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence.trim();
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

// Function to search Unsplash for images
async function searchUnsplash(query: string): Promise<string | null> {
  try {
    const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!unsplashKey) return null;
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${unsplashKey}`,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (error) {
    console.error('Unsplash API error:', error);
    return null;
  }
}

// Function to generate image with Stability AI as fallback
async function generateImageWithStability(prompt: string): Promise<string | null> {
  try {
    const stabilityKey = Deno.env.get('STABILITY_API_KEY');
    if (!stabilityKey) return null;
    
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stabilityKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const base64Image = data.artifacts?.[0]?.base64;
    return base64Image ? `data:image/png;base64,${base64Image}` : null;
  } catch (error) {
    console.error('Stability AI error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { prompt, name, slideCount = 5, theme = 'minimal', stylePreset = 'minimal' } = await req.json();
    if (!prompt && name) prompt = name;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = "AIzaSyD5jNyxXaWZFDL9r3NgpTJcl-5FSujLXOY";
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get style configuration
    const styleConfig = STYLE_PRESETS[stylePreset as keyof typeof STYLE_PRESETS] || STYLE_PRESETS.minimal;

    // Semantic chunking for better processing
    const textChunks = chunkText(prompt);
    console.log(`Processing ${textChunks.length} text chunks`);

    // Enhanced Gemini prompt for structured output
    const enhancedPrompt = `You are an advanced AI presentation generator that creates Gamma-style, visually stunning presentations. 

INPUT CONTENT:
${prompt}

REQUIREMENTS:
- Create exactly ${slideCount} slides with uniform information density
- Each slide should be balanced - no overcrowding, no emptiness
- Use hierarchical information structure (Topic → Subtopic → Detail)
- Generate modern, professional, and visually appealing content
- Include design suggestions for each slide

STYLE PRESET: ${stylePreset.toUpperCase()}
Theme Colors:
- Primary: ${styleConfig.primary_color}
- Secondary: ${styleConfig.secondary_color}  
- Accent: ${styleConfig.accent_color}
- Background: ${styleConfig.background_color}

OUTPUT FORMAT (strict JSON):
{
  "title": "Compelling presentation title",
  "topic_category": "general/business/technology/education/healthcare/etc",
  "slides": [
    {
      "slide_title": "Clear, engaging slide title",
      "content_bullets": [
        "Concise bullet point 1",
        "Engaging bullet point 2", 
        "Clear bullet point 3",
        "Impactful bullet point 4"
      ],
      "design_suggestion": {
        "layout": "title+image|two-column|grid|chart|infographic|hero",
        "image_prompt": "Professional search query for relevant visuals",
        "icon_suggestions": ["icon-keyword-1", "icon-keyword-2", "icon-keyword-3"],
        "style": {
          "background_color": "${styleConfig.background_color}",
          "font_family": "${styleConfig.font_family}",
          "font_size_title": ${styleConfig.font_size_title},
          "font_size_bullets": ${styleConfig.font_size_bullets},
          "primary_color": "${styleConfig.primary_color}",
          "secondary_color": "${styleConfig.secondary_color}",
          "accent_color": "${styleConfig.accent_color}"
        }
      },
      "speaker_notes": "Detailed speaker notes for this slide"
    }
  ]
}

SLIDE DISTRIBUTION GUIDELINES:
- For 5 slides: Title + 3 main topics + conclusion
- For 10 slides: Title + intro + 7 detailed topics + conclusion  
- For 15 slides: Title + intro + 3 sections (4 slides each) + conclusion
- For 20 slides: Title + intro + 4 sections (4 slides each) + 2 conclusion slides

LAYOUT TYPES:
- "hero": Full-screen image with large title (ideal for title slide)
- "title+image": Title with supporting image on right
- "two-column": Text on left, visual on right
- "grid": 3-4 key points with icons in grid layout
- "chart": For data, statistics, comparisons
- "infographic": For processes, timelines, workflows

Return ONLY valid JSON, no additional text.`;

    // Generate presentation with enhanced Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: enhancedPrompt }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      }
    );

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

    // Enhance slides with images
    console.log('Enhancing slides with visual content...');
    const enhancedSlides = await Promise.all(
      generatedContent.slides.map(async (slide: any) => {
        let imageUrl = null;
        
        if (slide.design_suggestion?.image_prompt) {
          // Try Unsplash first
          imageUrl = await searchUnsplash(slide.design_suggestion.image_prompt);
          
          // Fallback to Stability AI if Unsplash fails
          if (!imageUrl) {
            imageUrl = await generateImageWithStability(slide.design_suggestion.image_prompt);
          }
        }
        
        return {
          ...slide,
          design_suggestion: {
            ...slide.design_suggestion,
            image_url: imageUrl
          }
        };
      })
    );

    // Auth check
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

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save enhanced presentation
    const { data: presentation, error: dbError } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title: generatedContent.title,
        theme: stylePreset,
        slide_count: enhancedSlides.length,
        content: enhancedSlides
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

    // Save enhanced slides with design data
    const slides = enhancedSlides.map((slide: any, index: number) => ({
      presentation_id: presentation.id,
      title: slide.slide_title,
      content: slide.content_bullets ? slide.content_bullets.join('\n• ') : slide.content || '',
      notes: slide.speaker_notes || '',
      slide_order: index + 1,
      layout: slide.design_suggestion?.layout || 'title-content'
    }));

    const { error: slidesError } = await supabase.from('slides').insert(slides);
    if (slidesError) {
      console.error('Slides error:', slidesError);
    }

    console.log(`Successfully generated ${enhancedSlides.length} slides with enhanced visuals`);

    return new Response(
      JSON.stringify({
        presentation: {
          ...presentation,
          slides: enhancedSlides,
          style_preset: stylePreset,
          topic_category: generatedContent.topic_category
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-presentation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
