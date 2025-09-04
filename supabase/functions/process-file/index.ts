import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Add PDF text extraction using PDF.js (Deno compatible)
async function extractPDFText(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import PDF.js which is more compatible with Deno
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174');
    
    // Configure PDF.js worker
    const pdfDoc = await pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    }).promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 50); pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item: any) => item.str && item.str.trim())
        .map((item: any) => item.str)
        .join(' ');
      
      if (pageText.trim()) {
        fullText += pageText + '\n\n';
      }
    }
    
    return fullText.trim() || 'No readable text found in PDF';
  } catch (error) {
    console.error('PDF parsing error:', error);
    // Fallback error message that's more helpful
    throw new Error('Unable to extract text from this PDF. The file might be image-based, password-protected, or corrupted. Please try converting it to text first or use the text input option.');
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
      console.log('Extracted text from TXT file:', extractedText.substring(0, 200) + '...');
    } else if (fileType === 'application/pdf') {
      try {
        // Convert PDF to array buffer for processing
        const pdfBuffer = await file.arrayBuffer();
        const pdfText = await extractPDFText(pdfBuffer);
        extractedText = pdfText || `Unable to extract text from PDF: ${fileName}. Please ensure the PDF contains readable text.`;
        console.log('Extracted text from PDF:', extractedText.substring(0, 200) + '...');
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
        console.log('Extracted text from DOCX:', extractedText.substring(0, 200) + '...');
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