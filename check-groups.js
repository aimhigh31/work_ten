const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkGroups() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    const result = await client.query(`
      SELECT group_code, group_code_name
      FROM admin_mastercode_data
      WHERE codetype = 'group'
      ORDER BY group_code;
    `);

    console.log('현재 그룹 목록:');
    result.rows.forEach(row => {
      console.log(`${row.group_code}: ${row.group_code_name}`);
    });
  } finally {
    await client.end();
  }
}
checkGroups();