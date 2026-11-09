import { NextResponse } from 'next/server';
import { generateCertificatePdf } from '@/lib/pdf-engine';
import { CertificateTemplate, Participant } from '@/types';

export async function POST(req: Request) {
  try {
    const { template, participant, imageBase64 } = (await req.json()) as {
      template: CertificateTemplate;
      participant: Participant;
      imageBase64: string;
    };

    if (!template || !participant || !imageBase64) {
      return NextResponse.json({ error: 'Missing template, participant, or image data' }, { status: 400 });
    }

    // Convert base64 data URL to bytes
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const pdfBytes = await generateCertificatePdf(template, participant, buffer);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${participant.name}_certificate.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}
