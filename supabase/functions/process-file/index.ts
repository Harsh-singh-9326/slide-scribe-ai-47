import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Extract text from PDF using pdf.js (Deno-compatible)
async function extractPDFText(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Use pdf.js which works in Deno environment
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs');
    
    // Disable worker for edge function environment
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: { str?: string }) => item.str || '')
        .join(' ');
      fullText += pageText + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF content');
  }
}

// Add DOCX text extraction using mammoth
async function extractDOCXText(docxBuffer: ArrayBuffer): Promise<string> {
  try {
    const mammoth = await import('https://esm.sh/mammoth@1.6.0');
    const result = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
    return result.value;
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX content');
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File is required' }),
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

    let extractedText = '';
    const fileType = file.type;
    const fileName = file.name;

    console.log(`Processing file: ${fileName} (${fileType})`);

    // Process different file types and extract content
    if (fileType === 'text/plain') {
      extractedText = await file.text();
      console.log('Extracted text from TXT file, length:', extractedText.length);
    } else if (fileType === 'application/pdf') {
      try {
        // Convert PDF to array buffer for processing
        const pdfBuffer = await file.arrayBuffer();
        console.log('PDF buffer size:', pdfBuffer.byteLength);
        
        const pdfText = await extractPDFText(pdfBuffer);
        
        if (pdfText && pdfText.length > 0) {
          extractedText = pdfText;
          console.log('Successfully extracted text from PDF, length:', extractedText.length);
        } else {
          extractedText = `Unable to extract text from PDF: ${fileName}. The PDF may be scanned or image-based. Please try copying the text manually or use a text file.`;
        }
      } catch (error) {
        console.error('PDF extraction error:', error);
        extractedText = `Error reading PDF content from ${fileName}. Please try uploading a different PDF file or use text input instead.`;
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        // Convert DOCX to array buffer for processing
        const docxBuffer = await file.arrayBuffer();
        const docxText = await extractDOCXText(docxBuffer);
        extractedText = docxText || `Unable to extract text from DOCX: ${fileName}. Please ensure the document contains readable text.`;
        console.log('Extracted text from DOCX, length:', extractedText.length);
      } catch (error) {
        console.error('DOCX extraction error:', error);
        extractedText = `Error reading DOCX content from ${fileName}. Please try uploading a different DOCX file or use text input instead.`;
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT files.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return extracted text without storing the file
    return new Response(
      JSON.stringify({
        text: extractedText,
        fileName: fileName,
        fileType: fileType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-file:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
