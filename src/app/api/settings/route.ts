import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/storage';
import { createTransporter } from '@/lib/email-service';

export async function GET() {
  const settings = getSettings();
  // Mask the password before returning to client
  const safeSettings = {
    ...settings,
    auth: {
      ...settings.auth,
      pass: settings.auth.pass ? '••••••••' : '',
    },
  };
  return NextResponse.json(safeSettings);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getSettings();

    // If password is untouched masked, keep existing
    let passToSave = body.auth?.pass;
    if (passToSave === '••••••••' || !passToSave) {
      passToSave = current.auth.pass;
    }

    const updated = saveSettings({
      ...body,
      auth: {
        user: body.auth?.user || current.auth.user,
        pass: passToSave,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
