export async function generatePDFWithPDFShift(
  htmlContent: string,
  filename: string
): Promise<Buffer> {
  const apiKey = process.env.PDFSHIFT_API_KEY;

  if (!apiKey) {
    throw new Error('PDFSHIFT_API_KEY nicht konfiguriert');
  }

  const response = await fetch('https://api.pdfshift.io/v3/convert/html', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: htmlContent,
      filename: filename,
      landscape: false,
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PDFShift API error:', error);
    throw new Error(`PDFShift API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
