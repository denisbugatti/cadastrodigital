import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute("SELECT questions FROM forms WHERE id = 120001");
  const raw = rows[0].questions;
  const questions = typeof raw === 'string' ? JSON.parse(raw) : raw;
  
  // Show details for key questions
  const indices = [1, 5, 10, 25, 27, 45, 50]; // acquisition type, sexo, address, sexo2, estado civil, sexo conjuge, unidades
  indices.forEach(i => {
    const q = questions[i];
    if (!q) return;
    console.log(`\n--- Question ${i}: ${q.label} (${q.type}) ---`);
    console.log(JSON.stringify(q, null, 2));
  });
  
  // Also check a sample response
  const [respRows] = await conn.execute("SELECT id, answers FROM responses WHERE form_id = 120001 LIMIT 1");
  if (respRows.length > 0) {
    const answers = typeof respRows[0].answers === 'string' ? JSON.parse(respRows[0].answers) : respRows[0].answers;
    console.log('\n\n=== SAMPLE RESPONSE ===');
    console.log(JSON.stringify(answers, null, 2).substring(0, 3000));
  }
  
  await conn.end();
}

main().catch(console.error);
