require('dotenv').config({ path: '.env.local' });

async function dropUniqueConstraint() {
  const { Client } = require('pg');

  const client = new Client({
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.ckgmqjxqoqortyfsqgqo',
    password: process.env.SUPABASE_DB_PASSWORD
  });

  try {
    await client.connect();
    console.log('🔄 Unique constraint 제거 시작...');

    // 1. 현재 제약조건 확인
    const checkQuery = `
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'admin_checklist_editor'::regclass
      AND contype = 'u';
    `;

    const checkResult = await client.query(checkQuery);
    console.log('현재 unique constraints:', checkResult.rows);

    // 2. uk_checklist_editor_checklist_no 제약조건 제거
    const dropQuery = `
      ALTER TABLE admin_checklist_editor
      DROP CONSTRAINT IF EXISTS uk_checklist_editor_checklist_no;
    `;

    await client.query(dropQuery);
    console.log('✅ Unique constraint 제거 완료');

    // 3. 대신 일반 인덱스 생성 (성능 유지)
    const indexQuery = `
      CREATE INDEX IF NOT EXISTS idx_checklist_editor_checklist_no
      ON admin_checklist_editor(checklist_id, no);
    `;

    await client.query(indexQuery);
    console.log('✅ 일반 인덱스 생성 완료');

    // 4. 제약조건 재확인
    const reCheckResult = await client.query(checkQuery);
    console.log('변경 후 unique constraints:', reCheckResult.rows);

  } catch (error) {
    console.error('💥 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await client.end();
  }
}

dropUniqueConstraint();