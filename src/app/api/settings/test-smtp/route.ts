import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/storage';
import { createTransporter } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stored = getSettings();

    const settingsToTest = {
      ...stored,
      ...body,
      auth: {
        user: body.auth?.user || stored.auth.user,
        pass: body.auth?.pass && body.auth.pass !== '••••••••' ? body.auth.pass : stored.auth.pass,
      },
    };

    if (!settingsToTest.auth.user || !settingsToTest.auth.pass) {
      return NextResponse.json(
        { success: false, error: 'Email/Username and Password/App Password are required.' },
        { status: 400 }
      );
    }

    const transporter = createTransporter(settingsToTest);
    await transporter.verify();

    return NextResponse.json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to connect to SMTP server' },
      { status: 400 }
    );
  }
}
