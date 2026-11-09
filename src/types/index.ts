export interface TemplateField {
  id: string;
  name: string;
  key: string; // e.g. 'name', 'date', 'event'
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  width: number; // percentage (0 to 100)
  fontSize: number; // base pt size at native resolution
  fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier';
  color: string; // hex #000000
  align: 'center' | 'left' | 'right';
  bold?: boolean;
}

export interface CertificateTemplate {
  id: string;
  title: string;
  imageFilename: string;
  imageDataUrl?: string;
  width: number; // native px width
  height: number; // native px height
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  customData?: Record<string, string>;
  approved: boolean;
  status: 'pending' | 'generating' | 'generated' | 'sending' | 'sent' | 'failed';
  error?: string;
  pdfUrl?: string; // object URL or data URL
}

export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  fromName: string;
  fromEmail: string;
  subjectTemplate: string;
  bodyTemplate: string;
  eventName: string;
  organizationName: string;
}
