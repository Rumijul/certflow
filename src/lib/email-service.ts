import nodemailer from 'nodemailer';
import { SmtpSettings, Participant } from '@/types';

export function createTransporter(settings: SmtpSettings) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: {
      user: settings.auth.user,
      pass: settings.auth.pass,
    },
    // Add timeouts so it never hangs indefinitely
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });
}

export function generateSocialShareUrls(participant: Participant, eventName: string, orgName: string) {
  // LinkedIn Add to Profile URL scheme
  const linkedInParams = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: `${eventName} - Certificate of Completion`,
    organizationName: orgName,
    issueYear: new Date().getFullYear().toString(),
    issueMonth: (new Date().getMonth() + 1).toString(),
  });
  const linkedInShareUrl = `https://www.linkedin.com/profile/add?${linkedInParams.toString()}`;

  // Twitter / X Intent URL
  const tweetText = `Proud to receive my Certificate of Completion for ${eventName} from ${orgName}! 🎓✨`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return { linkedInShareUrl, twitterShareUrl };
}

export function compileEmailText(
  template: string,
  participant: Participant,
  settings: SmtpSettings,
  shareUrls: { linkedInShareUrl: string; twitterShareUrl: string }
) {
  return template
    .replace(/{{name}}/g, participant.name)
    .replace(/{{email}}/g, participant.email)
    .replace(/{{eventName}}/g, settings.eventName)
    .replace(/{{organizationName}}/g, settings.organizationName)
    .replace(/{{linkedInShareUrl}}/g, shareUrls.linkedInShareUrl)
    .replace(/{{twitterShareUrl}}/g, shareUrls.twitterShareUrl);
}

export async function sendCertificateEmail(
  settings: SmtpSettings,
  participant: Participant,
  pdfBytes: Uint8Array
) {
  const transporter = createTransporter(settings);
  const shareUrls = generateSocialShareUrls(participant, settings.eventName, settings.organizationName);

  const subject = compileEmailText(settings.subjectTemplate, participant, settings, shareUrls);
  const textBody = compileEmailText(settings.bodyTemplate, participant, settings, shareUrls);

  // Generate clean HTML format with nice buttons
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a; margin-top: 0;">Certificate of Completion</h2>
      <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${participant.name}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Congratulations on successfully completing <strong>${settings.eventName}</strong> organized by <strong>${settings.organizationName}</strong>!
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Your official certificate has been generated and is attached to this email as a PDF document.
      </p>

      <div style="margin: 32px 0; padding: 20px; background-color: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; text-align: center;">
        <p style="margin: 0 0 16px 0; font-weight: bold; color: #0f172a;">Share your accomplishment with your network:</p>
        <div style="display: inline-flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="${shareUrls.linkedInShareUrl}" target="_blank" style="display: inline-block; background-color: #0077b5; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">
            + Add to LinkedIn Profile
          </a>
          <a href="${shareUrls.twitterShareUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">
            Share on X (Twitter)
          </a>
        </div>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
        Sent via CertFlow for ${settings.organizationName}. If you received this by mistake, please ignore.
      </p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"${settings.fromName}" <${settings.fromEmail || settings.auth.user}>`,
    to: participant.email,
    subject,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        filename: `${participant.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_Certificate.pdf`,
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
      },
    ],
  });

  return info;
}
