import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute('SELECT id, title, questions FROM forms WHERE id = 60002');
  if (rows.length > 0) {
    const questions = typeof rows[0].questions === 'string' ? JSON.parse(rows[0].questions) : rows[0].questions;
    console.log('Form: ' + rows[0].title + ' (ID: ' + rows[0].id + ')');
    console.log('---');
    questions.forEach((q, i) => {
      let line = (i+1) + '. [' + q.type + '] ' + q.title;
      if (q.subtitle) line += ' (' + q.subtitle + ')';
      if (q.options && q.options.length > 0) {
        line += ' -> Opções: ' + q.options.map(o => typeof o === 'string' ? o : o.label || o.text || JSON.stringify(o)).join(', ');
      }
      console.log(line);
    });
    console.log('\nTotal: ' + questions.length + ' perguntas');
  }
  await conn.end();
}
main().catch(console.error);
