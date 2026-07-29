import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const raw = buffer.toString('binary');
    // Match PDF text stream objects enclosed in parentheses (e.g., (John Doe) Tj) or hex streams
    const matches: string[] = [];
    const regex = /\(([^()\\]|\\.)*\)/g;
    let match: RegExpExecArray | null;
    
    while ((match = regex.exec(raw)) !== null) {
      const str = match[0].slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\([()\\])/g, '$1');
      if (str.trim().length > 1 && /[a-zA-Z0-9]/.test(str)) {
        matches.push(str.trim());
      }
    }

    if (matches.length > 5) {
      const combined = matches.join(' ');
      // Filter out PDF internal syntax commands
      const cleaned = combined.replace(/\/Font|\/CIDInit|\/ProcSet|\/Encoding|\/Type|\/Subtype/gi, '');
      if (cleaned.trim().length > 30) {
        return cleaned.replace(/\s+/g, ' ').trim();
      }
    }
  } catch (e) {
    // Fallthrough
  }
  return '';
}

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  let extractedText = '';

  // 1. Try pdf-parse module
  try {
    const pdfModule = require('pdf-parse');
    const parseFn = typeof pdfModule === 'function' ? pdfModule : (pdfModule.default || pdfModule);
    
    if (typeof parseFn === 'function') {
      const data = await parseFn(dataBuffer);
      if (data && data.text && data.text.trim().length > 20) {
        extractedText = data.text.trim();
      }
    }
  } catch (err) {
    console.warn('pdf-parse module error, trying raw buffer stream parser:', err);
  }

  // 2. Fallback to raw PDF stream parser if pdf-parse was insufficient
  if (!extractedText || extractedText.length < 20) {
    const rawExtracted = extractRawTextFromPdfBuffer(dataBuffer);
    if (rawExtracted && rawExtracted.length > 20) {
      extractedText = rawExtracted;
    }
  }

  // 3. Final fallback with file size and hash info
  if (!extractedText || extractedText.length < 20) {
    const fileName = filePath.split('/').pop() || 'resume.pdf';
    extractedText = `Resume PDF File: ${fileName}. File Size: ${dataBuffer.length} bytes. Text stream extraction produced limited plaintext (scanned or image-based PDF document).`;
  }

  return extractedText.replace(/\s+/g, ' ').trim();
}

