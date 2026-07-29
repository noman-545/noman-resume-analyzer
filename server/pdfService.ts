import fs from 'fs';

function extractRawTextFromPdfBuffer(buffer: Buffer): string {
  try {
    const raw = buffer.toString('binary');

    const matches: string[] = [];
    const regex = /\(([^()\\]|\\.)*\)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(raw)) !== null) {
      const str = match[0]
        .slice(1, -1)
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
      const cleaned = combined.replace(
        /\/Font|\/CIDInit|\/ProcSet|\/Encoding|\/Type|\/Subtype/gi,
        ''
      );

      if (cleaned.trim().length > 30) {
        return cleaned.replace(/\s+/g, ' ').trim();
      }
    }
  } catch {
    // Ignore
  }

  return '';
}

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  let extractedText = '';

  // Dynamically import pdf-parse (works in both local and Render)
  try {
    const pdfModule: any = await import('pdf-parse');
    const parseFn = pdfModule.default || pdfModule;

    if (typeof parseFn === 'function') {
      const data = await parseFn(dataBuffer);

      if (data?.text && data.text.trim().length > 20) {
        extractedText = data.text.trim();
      }
    }
  } catch (err) {
    console.warn(
      'pdf-parse module error, trying raw buffer stream parser:',
      err
    );
  }

  // Fallback parser
  if (!extractedText || extractedText.length < 20) {
    const rawExtracted = extractRawTextFromPdfBuffer(dataBuffer);

    if (rawExtracted.length > 20) {
      extractedText = rawExtracted;
    }
  }

  // Final fallback
  if (!extractedText || extractedText.length < 20) {
    const fileName = filePath.split(/[\\/]/).pop() || 'resume.pdf';

    extractedText = `Resume PDF File: ${fileName}. File Size: ${dataBuffer.length} bytes. Text stream extraction produced limited plaintext (scanned or image-based PDF document).`;
  }

  return extractedText.replace(/\s+/g, ' ').trim();
}