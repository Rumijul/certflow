import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/storage';
import { generateCertificatePdf } from '@/lib/pdf-engine';
import { sendCertificateEmail } from '@/lib/email-service';
import { CertificateTemplate, Participant } from '@/types';

export async function POST(req: Request) {
  try {
    const { template, participant, imageBase64 } = (await req.json()) as {
      template: CertificateTemplate;
      participant: Participant;
      imageBase64: string;
    };

    if (!template || !participant || !imageBase64) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const settings = getSettings();
    if (!settings.auth.user || !settings.auth.pass) {
      return NextResponse.json(
        { error: 'SMTP credentials are not configured. Please open Settings to configure email delivery.' },
        { status: 400 }
      );
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    // 1. Generate PDF
    const pdfBytes = await generateCertificatePdf(template, participant, buffer);

    // 2. Send Email
    await sendCertificateEmail(settings, participant, pdfBytes);

    return NextResponse.json({ success: true, participantId: participant.id });
  } catch (error: any) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
