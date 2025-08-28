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
    const { presentationId, format = 'pptx' } = await req.json();
    
    if (!presentationId) {
      return new Response(
        JSON.stringify({ error: 'Presentation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Get presentation data
    const { data: presentation, error: presentationError } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', presentationId)
      .eq('user_id', user.id)
      .single();

    if (presentationError) {
      console.error('Presentation fetch error:', presentationError);
      return new Response(
        JSON.stringify({ 
          error: 'Presentation not found or access denied',
          details: presentationError.message 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!presentation) {
      return new Response(
        JSON.stringify({ error: 'Presentation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get slides
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('slide_order');

    if (slidesError) {
      console.error('Slides error:', slidesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch slides' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we'll create a simple HTML export that can be converted to PDF
    // In a real implementation, you'd use a library like PptxGenJS for PPTX export
    const htmlContent = generateHtmlPresentation(presentation, slides || []);
    
    if (format === 'pdf') {
      // Return HTML that can be converted to PDF on the frontend
      return new Response(
        JSON.stringify({
          format: 'html',
          content: htmlContent,
          fileName: `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.html`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For PPTX, return a structured format that the frontend can handle
    return new Response(
      JSON.stringify({
        format: 'pptx',
        presentation: {
          title: presentation.title,
          theme: presentation.theme,
          slides: slides || []
        },
        fileName: `${presentation.title.replace(/[^a-z0-9]/gi, '_')}.pptx`,
        message: 'PPTX export functionality requires additional implementation. Currently returning presentation data for frontend processing.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in export-presentation:', error);
    
    // Better error details for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateHtmlPresentation(presentation: any, slides: any[]): string {
  const slideHtml = slides.map((slide, index) => `
    <div class="slide" style="
      width: 100vw;
      height: 100vh;
      padding: 60px;
      box-sizing: border-box;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: white;
      font-family: 'Arial', sans-serif;
    ">
      <h1 style="
        font-size: 48px;
        color: #333;
        margin-bottom: 40px;
        text-align: center;
      ">${slide.title}</h1>
      <div style="
        font-size: 24px;
        line-height: 1.6;
        color: #666;
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
      ">${slide.content.replace(/\n/g, '<br>')}</div>
      ${slide.notes ? `
        <div style="
          position: absolute;
          bottom: 20px;
          left: 20px;
          font-size: 14px;
          color: #999;
          font-style: italic;
        ">Notes: ${slide.notes}</div>
      ` : ''}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${presentation.title}</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        @media print {
          .slide { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      ${slideHtml}
    </body>
    </html>
  `;
}