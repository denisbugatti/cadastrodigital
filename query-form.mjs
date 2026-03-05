import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute("SELECT questions FROM forms WHERE id = 120001");
  const raw = rows[0].questions;
  const questions = typeof raw === 'string' ? JSON.parse(raw) : raw;
  
  questions.forEach((q, i) => {
    console.log(`\n--- Question ${i} ---`);
    console.log('type:', q.type);
    console.log('label:', q.label || q.title || q.question || '(no label)');
    if (q.fields) {
      q.fields.forEach((f, j) => {
        console.log(`  field ${j}:`, f.type, f.label || f.name || '');
        if (f.options) console.log('    options:', f.options.map(o => o.label || o.value || o).join(', '));
      });
    }
    if (q.options) {
      console.log('  options:', q.options.map(o => o.label || o.value || o).join(', '));
    }
    if (q.subQuestions) {
      q.subQuestions.forEach((sq, j) => {
        console.log(`  subQ ${j}:`, sq.type, sq.label || sq.title || '');
        if (sq.options) console.log('    options:', sq.options.map(o => o.label || o.value || o).join(', '));
      });
    }
  });
  
  await conn.end();
}

main().catch(console.error);
