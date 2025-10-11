require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function executeSQL() {
  // DATABASE_URL 파싱
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
    return;
  }

  console.log('📡 연결 정보:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 PostgreSQL 연결 시도 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 각 컬럼을 개별적으로 추가
    const columns = [
      { name: 'selection_background', desc: '선정배경' },
      { name: 'impact', desc: '영향도' },
      { name: 'evaluation_criteria_s', desc: '평가기준표 S' },
      { name: 'evaluation_criteria_a', desc: '평가기준표 A' },
      { name: 'evaluation_criteria_b', desc: '평가기준표 B' },
      { name: 'evaluation_criteria_c', desc: '평가기준표 C' },
      { name: 'evaluation_criteria_d', desc: '평가기준표 D' }
    ];

    console.log(`📝 ${columns.length}개의 컬럼 추가 중...`);

    for (const col of columns) {
      const sql = `ALTER TABLE main_kpi_data ADD COLUMN IF NOT EXISTS ${col.name} TEXT;`;
      console.log(`실행 중: ${col.desc} (${col.name})`);
      try {
        await client.query(sql);
        console.log(`  ✅ ${col.desc} 추가 완료`);
      } catch (err) {
        console.log(`  ⚠️  ${col.desc} 이미 존재하거나 오류: ${err.message}`);
      }
    }

    console.log('✅ 모든 컬럼 추가 완료');

    // 결과 확인
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'main_kpi_data'
        AND column_name IN (
          'selection_background',
          'impact',
          'evaluation_criteria_s',
          'evaluation_criteria_a',
          'evaluation_criteria_b',
          'evaluation_criteria_c',
          'evaluation_criteria_d'
        )
      ORDER BY column_name;
    `);

    console.log('\n📋 추가된 컬럼 목록:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error('메시지:', error.message);
    if (error.code) console.error('코드:', error.code);
    if (error.detail) console.error('상세:', error.detail);
  } finally {
    await client.end();
    console.log('✅ PostgreSQL 연결 종료');
  }
}

executeSQL();
