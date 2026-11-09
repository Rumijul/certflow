import { NextResponse } from 'next/server';
import { getTemplates, saveTemplate, deleteTemplate } from '@/lib/storage';

export async function GET() {
  const templates = getTemplates();
  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  try {
    const template = await req.json();
    if (!template.title || !template.fields) {
      return NextResponse.json({ error: 'Missing title or fields' }, { status: 400 });
    }
    const saved = saveTemplate(template);
    return NextResponse.json({ success: true, template: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }
    deleteTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
