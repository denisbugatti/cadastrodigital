/**
 * Generate a test PDF with grid overlay to map field positions on the PF template.
 * We'll draw a grid and labels to identify coordinates.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function main() {
  const bytes = fs.readFileSync('/home/ubuntu/upload/FICHAPF_TEMPLATE.pdf');
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(0);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  console.log(`Page: ${width} x ${height}`);
  
  // Draw horizontal grid lines every 20 points with y labels
  for (let y = 0; y <= height; y += 20) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: 0.3,
      color: rgb(1, 0, 0),
      opacity: 0.3,
    });
    page.drawText(String(Math.round(y)), {
      x: 2,
      y: y + 1,
      size: 5,
      font,
      color: rgb(1, 0, 0),
      opacity: 0.5,
    });
  }
  
  // Draw vertical grid lines every 50 points with x labels
  for (let x = 0; x <= width; x += 50) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.3,
      color: rgb(0, 0, 1),
      opacity: 0.3,
    });
    page.drawText(String(Math.round(x)), {
      x: x + 1,
      y: height - 10,
      size: 5,
      font,
      color: rgb(0, 0, 1),
      opacity: 0.5,
    });
  }
  
  const result = await doc.save();
  fs.writeFileSync('/home/ubuntu/upload/FICHAPF_GRID.pdf', result);
  console.log('Grid PDF saved to /home/ubuntu/upload/FICHAPF_GRID.pdf');
}

main().catch(console.error);
