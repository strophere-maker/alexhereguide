
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Adds a footer watermark to each page with buyer info.
 * @param {Uint8Array|Buffer} pdfBytes - original pdf bytes
 * @param {Object} meta - { email, orderId, ts }
 * @returns {Promise<Uint8Array>}
 */
export async function addWatermark(pdfBytes, meta) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const text = `Licensed to ${meta.email} — Order ${meta.orderId} — ${new Date(meta.ts).toISOString()}`;
  const size = 10;
  const color = rgb(0.7, 0.1, 0.1);

  const pages = pdfDoc.getPages();
  pages.forEach((p) => {
    const { width } = p.getSize();
    p.drawText(text, {
      x: 24,
      y: 24,
      size,
      font: helv,
      color,
      opacity: 0.9,
      maxWidth: width - 48
    });
  });

  return await pdfDoc.save();
}
