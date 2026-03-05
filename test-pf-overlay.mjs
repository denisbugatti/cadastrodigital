/**
 * Test overlaying text on the PF PDF template to verify coordinates.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';

async function main() {
  const bytes = fs.readFileSync('/home/ubuntu/upload/FICHAPF_TEMPLATE.pdf');
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(0);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  
  const blue = rgb(0, 0, 0.8);
  const sz = 8;
  
  // Test Proponente 1 fields
  // Nome - the name field is on the same line as "PROPONENTE 1:" label
  // Looking at grid: PROPONENTE 1: label is at ~y=637, the field value area is below
  // CPF line is at y~615, value area is inside the box
  
  // Let me try placing text in the value areas (inside the boxes)
  // The boxes seem to have labels at top and values in the middle
  
  // CPF value (inside box, below label)
  page.drawText('123.456.789-00', { x: 57, y: 607, size: sz, font, color: blue });
  
  // NACIONALIDADE value
  page.drawText('Brasileira', { x: 282, y: 607, size: sz, font, color: blue });
  
  // DATA DE NASC value
  page.drawText('15/03/1990', { x: 492, y: 607, size: sz, font, color: blue });
  
  // IDENTIDADE value
  page.drawText('12.345.678-9', { x: 57, y: 582, size: sz, font, color: blue });
  
  // PROFISSÃO value
  page.drawText('Engenheiro Civil', { x: 222, y: 582, size: sz, font, color: blue });
  
  // EST. CIVIL - draw X in CASADO checkbox
  page.drawText('X', { x: 137, y: 553, size: 9, font: boldFont, color: blue });
  
  // REGIME - draw X in COMUNHÃO PARCIAL
  page.drawText('X', { x: 67, y: 528, size: 9, font: boldFont, color: blue });
  
  // RENDA MENSAL value
  page.drawText('R$ 15.000,00', { x: 57, y: 507, size: sz, font, color: blue });
  
  // CELULAR value
  page.drawText('(11) 99999-8888', { x: 422, y: 507, size: sz, font, color: blue });
  
  // ENDEREÇO value
  page.drawText('Rua das Flores, 123, Apto 45', { x: 57, y: 487, size: sz, font, color: blue });
  
  // CEP value
  page.drawText('01234-567', { x: 502, y: 487, size: sz, font, color: blue });
  
  // BAIRRO value
  page.drawText('Jardim Paulista', { x: 57, y: 467, size: sz, font, color: blue });
  
  // CIDADE value
  page.drawText('São Paulo', { x: 252, y: 467, size: sz, font, color: blue });
  
  // ESTADO value
  page.drawText('SP', { x: 462, y: 467, size: sz, font, color: blue });
  
  // E-MAIL value
  page.drawText('joao.silva@email.com', { x: 57, y: 447, size: sz, font, color: blue });
  
  // DATA DO CADASTRO
  page.drawText('05', { x: 435, y: 797, size: sz, font, color: blue });
  page.drawText('03', { x: 455, y: 797, size: sz, font, color: blue });
  page.drawText('2026', { x: 475, y: 797, size: sz, font, color: blue });
  
  const result = await doc.save();
  fs.writeFileSync('/home/ubuntu/upload/FICHAPF_TEST.pdf', result);
  console.log('Test PDF saved');
}

main().catch(console.error);
