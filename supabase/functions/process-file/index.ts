import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from PDF using pdf.js (Deno-compatible)
async function extractPDFText(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs: any = await import(
      "https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.mjs"
    );

    if (pdfjs?.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = "";
    }

    const getDocument = pdfjs.getDocument ?? pdfjs.default?.getDocument;
    if (!getDocument) throw new Error("pdf.js getDocument not available");

    const loadingTask = getDocument({
      data: new Uint8Array(pdfBuffer),
      disableWorker: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as any[])
        .map((item) => item?.str ?? "")
        .join(" ")
        .trim();
      if (pageText) fullText += pageText + "\n\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF content");
  }
}

// OCR for scanned PDFs using AI Vision
async function performOCR(pdfBuffer: ArrayBuffer): Promise<string> {
  const aiApiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!aiApiKey) {
    console.log('AI API key not configured, skipping OCR');
    return '';
  }

  try {
    // Convert PDF buffer to base64 for vision API
    const base64Data = btoa(
      new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract ALL text from this scanned PDF document. Return ONLY the extracted text content, preserving the original structure, paragraphs, and formatting as much as possible. Do not add any commentary or explanations.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OCR API error:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';
    console.log('OCR extracted text length:', extractedText.length);
    return extractedText;
  } catch (error) {
    console.error('OCR error:', error);
    return '';
  }
}

// Extract DOCX text using mammoth
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

    let extractedText = '';
    let usedOcr = false;
    const fileType = file.type;
    const fileName = file.name;

    console.log(`Processing file: ${fileName} (${fileType})`);

    if (fileType === 'text/plain') {
      extractedText = await file.text();
      console.log('Extracted text from TXT file, length:', extractedText.length);
    } else if (fileType === 'application/pdf') {
      try {
        const pdfBuffer = await file.arrayBuffer();
        console.log('PDF buffer size:', pdfBuffer.byteLength);
        
        // First try standard text extraction
        let pdfText = '';
        try {
          pdfText = await extractPDFText(pdfBuffer);
        } catch (e) {
          console.log('Standard PDF extraction failed, will try OCR');
        }
        
        // Check if we got meaningful text (more than just whitespace/garbage)
        const meaningfulTextLength = pdfText.replace(/\s+/g, '').length;
        console.log('Standard extraction meaningful characters:', meaningfulTextLength);
        
        if (meaningfulTextLength < 50) {
          // Try OCR for scanned/image-only PDFs
          console.log('Low text content detected, attempting OCR...');
          const ocrText = await performOCR(pdfBuffer);
          
          if (ocrText && ocrText.length > meaningfulTextLength) {
            extractedText = ocrText;
            usedOcr = true;
            console.log('Using OCR extracted text, length:', extractedText.length);
          } else if (pdfText) {
            extractedText = pdfText;
          } else {
            extractedText = `Unable to extract text from PDF: ${fileName}. The PDF appears to be scanned or image-based and OCR was unsuccessful. Please try uploading a different file.`;
          }
        } else {
          extractedText = pdfText;
          console.log('Successfully extracted text from PDF, length:', extractedText.length);
        }
      } catch (error) {
        console.error('PDF extraction error:', error);
        extractedText = `Error reading PDF content from ${fileName}. Please try uploading a different PDF file or use text input instead.`;
      }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
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

    return new Response(
      JSON.stringify({
        text: extractedText,
        fileName: fileName,
        fileType: fileType,
        usedOcr: usedOcr
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
