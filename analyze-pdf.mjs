import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function analyzePdf(path, label) {
  const bytes = fs.readFileSync(path);
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(0);
  const { width, height } = page.getSize();
  console.log(`\n=== ${label} ===`);
  console.log(`Page size: ${width} x ${height}`);
  
  // Check if the PDF has form fields
  const form = doc.getForm();
  const fields = form.getFields();
  console.log(`Form fields: ${fields.length}`);
  fields.forEach(f => {
    console.log(`  Field: ${f.getName()} (${f.constructor.name})`);
  });
}

const pfPath = '/home/ubuntu/upload/FICHAPF_TEMPLATE.pdf';
const pjPath = '/home/ubuntu/upload/FICHAPJ.pdf';

analyzePdf(pfPath, 'FICHA PF').then(() => analyzePdf(pjPath, 'FICHA PJ')).catch(console.error);
