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

    // Convert pt (which is at native 1080p template scale) directly to PDF points
    // The template width/height is native 1920x1080.
    // In CSS preview, the font-size must match this ratio: (field.fontSize / 1080) * 100% of container height.
    const nativeHeight = template.height || 1080;
    const currentFontSize = (field.fontSize / 1080) * nativeHeight;
    const minFontSize = 14;
    let computedFontSize = currentFontSize;

    // Auto-shrink loop: measure width and shrink font until it fits bounding box
    let textWidth = font.widthOfTextAtSize(text, computedFontSize);
    while (textWidth > boxWidth && computedFontSize > minFontSize) {
      computedFontSize -= 1;
      textWidth = font.widthOfTextAtSize(text, computedFontSize);
    }

    // Alignment calculation
    let drawX = boxX;
    if (field.align === 'center') {
      drawX = boxX + (boxWidth - textWidth) / 2;
    } else if (field.align === 'right') {
      drawX = boxX + boxWidth - textWidth;
    }

    const color = hexToRgb(field.color || '#000000');

    // Draw the text - center baseline inside the box height
    // In pdf-lib, boxY is the top of the box. Baseline sits down from top.
    const baselineY = boxY - computedFontSize;

    page.drawText(text, {
      x: drawX,
      y: baselineY,
      size: computedFontSize,
      font,
      color,
    });
  }

  // Draw image overlays (signatures, logos, crests, seals)
  if (template.imageOverlays && template.imageOverlays.length > 0) {
    for (const overlay of template.imageOverlays) {
      if (!overlay.dataUrl) continue;
      try {
        const cleanBase64 = overlay.dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const overlayBuffer = Buffer.from(cleanBase64, 'base64');
        let embeddedOverlay;
        try {
          embeddedOverlay = await pdfDoc.embedPng(overlayBuffer);
        } catch {
          embeddedOverlay = await pdfDoc.embedJpg(overlayBuffer);
        }

        const overlayWidth = (overlay.width / 100) * width;
        // Calculate height keeping aspect ratio
        const overlayHeight = overlay.aspectRatio ? overlayWidth / overlay.aspectRatio : overlayWidth;
        const overlayX = (overlay.x / 100) * width;
        const overlayYFromTop = (overlay.y / 100) * height;
        // In PDF coordinate system, origin is bottom-left
        const overlayY = height - overlayYFromTop - overlayHeight;

        page.drawImage(embeddedOverlay, {
          x: overlayX,
          y: overlayY,
          width: overlayWidth,
          height: overlayHeight,
        });
      } catch (err) {
        console.error('Failed to embed overlay image:', overlay.name, err);
      }
    }
  }

  return await pdfDoc.save();
}
