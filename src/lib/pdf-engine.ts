import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CertificateTemplate, Participant } from '@/types';

// Helper to convert hex to pdf-lib rgb
function hexToRgb(hex: string) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

export async function generateCertificatePdf(
  template: CertificateTemplate,
  participant: Participant,
  imageBytes: Uint8Array | ArrayBuffer
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Standard fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontTimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontTimesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
  const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const getFont = (family: string, bold?: boolean) => {
    if (family === 'Times-Roman') {
      return bold ? fontTimesRomanBold : fontTimesRoman;
    }
    if (family === 'Courier') {
      return bold ? fontCourierBold : fontCourier;
    }
    return bold ? fontHelveticaBold : fontHelvetica;
  };

  // Embed image (JPEG or PNG)
  let embeddedImage;
  try {
    embeddedImage = await pdfDoc.embedPng(imageBytes);
  } catch {
    embeddedImage = await pdfDoc.embedJpg(imageBytes);
  }

  const { width, height } = embeddedImage;
  const page = pdfDoc.addPage([width, height]);

  // Draw background image
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // Draw each text field
  for (const field of template.fields) {
    let text = '';
    if (field.key === 'name') {
      text = participant.name;
    } else if (field.key === 'email') {
      text = participant.email;
    } else if (participant.customData && participant.customData[field.key]) {
      text = participant.customData[field.key];
    } else {
      text = field.name;
    }

    if (!text) continue;

    const font = getFont(field.fontFamily, field.bold);
    const boxX = (field.x / 100) * width;
    // PDF coordinate system origin is bottom-left
    const boxYFromTop = (field.y / 100) * height;
    const boxY = height - boxYFromTop;
    const boxWidth = (field.width / 100) * width;

    // Scale font size according to template resolution relative to 1000px base
    const scaleFactor = Math.min(width, height) / 800;
    let currentFontSize = Math.max(12, field.fontSize * scaleFactor);
    const minFontSize = 14;

    // Auto-shrink loop: measure width and shrink font until it fits bounding box
    let textWidth = font.widthOfTextAtSize(text, currentFontSize);
    while (textWidth > boxWidth && currentFontSize > minFontSize) {
      currentFontSize -= 1;
      textWidth = font.widthOfTextAtSize(text, currentFontSize);
    }

    // Alignment calculation
    let drawX = boxX;
    if (field.align === 'center') {
      drawX = boxX + (boxWidth - textWidth) / 2;
    } else if (field.align === 'right') {
      drawX = boxX + boxWidth - textWidth;
    }

    const color = hexToRgb(field.color || '#000000');

    // Draw the text
    page.drawText(text, {
      x: drawX,
      y: boxY - currentFontSize * 0.8, // adjust baseline
      size: currentFontSize,
      font,
      color,
    });
  }

  return await pdfDoc.save();
}
