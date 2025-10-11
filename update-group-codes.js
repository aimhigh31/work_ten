const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateGroupCodes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 현재 그룹 코드들 조회
    console.log('\n📊 현재 그룹 코드 목록:');
    const currentGroups = await client.query(`
      SELECT DISTINCT group_code, group_code_name
      FROM admin_mastercode_data
      WHERE codetype = 'group'
      ORDER BY group_code;
    `);

    if (currentGroups.rows.length === 0) {
      console.log('❌ 그룹 데이터가 없습니다.');
      return;
    }

    // 기존 그룹 코드와 새로운 그룹 코드 매핑
    const groupCodeMapping = {};
    currentGroups.rows.forEach((group, index) => {
      const newCode = `GROUP${(index + 1).toString().padStart(3, '0')}`;
      groupCodeMapping[group.group_code] = newCode;
      console.log(`  ${group.group_code} → ${newCode} (${group.group_code_name})`);
    });

    console.log('\n🔧 그룹 코드 업데이트 시작...');

    // 트랜잭션 시작
    await client.query('BEGIN');

    try {
      // 각 그룹 코드 업데이트
      for (const [oldCode, newCode] of Object.entries(groupCodeMapping)) {
        console.log(`\n📝 ${oldCode} → ${newCode} 업데이트 중...`);

        // 해당 그룹의 모든 레코드 (그룹 + 서브코드) 업데이트
        const updateResult = await client.query(`
          UPDATE admin_mastercode_data
          SET group_code = $1
          WHERE group_code = $2
        `, [newCode, oldCode]);

        console.log(`  ✅ ${updateResult.rowCount}개 레코드 업데이트됨`);
      }

      // 트랜잭션 커밋
      await client.query('COMMIT');
      console.log('\n✅ 모든 그룹 코드 업데이트 완료!');

      // 업데이트 결과 확인
      console.log('\n📊 업데이트된 그룹 코드 목록:');
      const updatedGroups = await client.query(`
        SELECT DISTINCT group_code, group_code_name
        FROM admin_mastercode_data
        WHERE codetype = 'group'
        ORDER BY group_code;
      `);

      updatedGroups.rows.forEach((group, index) => {
        console.log(`  ${index + 1}. ${group.group_code} (${group.group_code_name})`);
      });

    } catch (error) {
      // 트랜잭션 롤백
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
updateGroupCodes();