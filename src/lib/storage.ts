import fs from 'fs';
import path from 'path';
import { CertificateTemplate, SmtpSettings } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const defaultSettings: SmtpSettings = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: '',
    pass: '',
  },
  fromName: 'Events & Certification Team',
  fromEmail: '',
  subjectTemplate: 'Your Certificate of Completion: {{eventName}}',
  bodyTemplate: `Hi {{name}},

Congratulations on completing {{eventName}}!

Attached to this email is your official Certificate of Completion. You can download and save it directly.

Flex your achievement:
- Add to LinkedIn: {{linkedInShareUrl}}
- Share on X: {{twitterShareUrl}}

Best regards,
{{organizationName}}`,
  eventName: 'Work Immersion 2026',
  organizationName: 'Elizabeth Seton School',
};

export function getSettings(): SmtpSettings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: Partial<SmtpSettings>): SmtpSettings {
  ensureDataDir();
  const current = getSettings();
  const updated = { ...current, ...settings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

export function getTemplates(): CertificateTemplate[] {
  ensureDataDir();
  if (!fs.existsSync(TEMPLATES_FILE)) {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const raw = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTemplate(template: CertificateTemplate): CertificateTemplate {
  ensureDataDir();
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === template.id);
  if (index >= 0) {
    templates[index] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    templates.push({
      ...template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
  return template;
}

export function deleteTemplate(id: string): boolean {
  ensureDataDir();
  const templates = getTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(filtered, null, 2));
  return true;
}
