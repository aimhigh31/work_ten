const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function checkColumns() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공\n');

    // admin_users_userprofiles 테이블의 모든 컬럼 확인
    const { rows } = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'admin_users_userprofiles'
      ORDER BY ordinal_position;
    `);

    console.log('=== admin_users_userprofiles 테이블 컬럼 목록 ===\n');
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''})`);
    });

    // 프로필 관련 컬럼 찾기
    console.log('\n=== 프로필 이미지 관련 컬럼 ===');
    const profileCols = rows.filter(row =>
      row.column_name.includes('profile') ||
      row.column_name.includes('picture') ||
      row.column_name.includes('image') ||
      row.column_name.includes('avatar') ||
      row.column_name.includes('photo')
    );

    if (profileCols.length > 0) {
      profileCols.forEach(col => {
        console.log(`✅ ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('❌ 프로필 이미지 관련 컬럼이 없습니다.');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
  }
}

checkColumns();
