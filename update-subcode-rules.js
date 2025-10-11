const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateSubCodeRules() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // 현재 서브코드들 조회 (그룹별로 정렬)
    console.log('\n📊 현재 서브코드 목록:');
    const currentSubCodes = await client.query(`
      SELECT id, group_code, subcode, subcode_name, subcode_order
      FROM admin_mastercode_data
      WHERE codetype = 'subcode'
      ORDER BY group_code, subcode_order, id;
    `);

    if (currentSubCodes.rows.length === 0) {
      console.log('❌ 서브코드 데이터가 없습니다.');
      return;
    }

    // 그룹별로 서브코드 묶기
    const groupedSubCodes = {};
    currentSubCodes.rows.forEach(subcode => {
      if (!groupedSubCodes[subcode.group_code]) {
        groupedSubCodes[subcode.group_code] = [];
      }
      groupedSubCodes[subcode.group_code].push(subcode);
    });

    // 새로운 서브코드 매핑 생성
    const subCodeMapping = {};

    Object.keys(groupedSubCodes).forEach(groupCode => {
      console.log(`\n📂 ${groupCode} 그룹:`);
      groupedSubCodes[groupCode].forEach((subcode, index) => {
        const newSubCode = `${groupCode}-SUB${(index + 1).toString().padStart(3, '0')}`;
        subCodeMapping[subcode.id] = {
          oldCode: subcode.subcode,
          newCode: newSubCode,
          groupCode: groupCode,
          name: subcode.subcode_name
        };
        console.log(`  ${subcode.subcode} → ${newSubCode} (${subcode.subcode_name})`);
      });
    });

    console.log('\n🔧 서브코드 업데이트 시작...');

    // 트랜잭션 시작
    await client.query('BEGIN');

    try {
      // 각 서브코드 업데이트
      let updateCount = 0;
      for (const [id, mapping] of Object.entries(subCodeMapping)) {
        console.log(`📝 ID ${id}: ${mapping.oldCode} → ${mapping.newCode}`);

        const updateResult = await client.query(`
          UPDATE admin_mastercode_data
          SET subcode = $1
          WHERE id = $2 AND codetype = 'subcode'
        `, [mapping.newCode, parseInt(id)]);

        if (updateResult.rowCount > 0) {
          updateCount++;
          console.log(`  ✅ 업데이트 성공`);
        } else {
          console.log(`  ❌ 업데이트 실패`);
        }
      }

      // 트랜잭션 커밋
      await client.query('COMMIT');
      console.log(`\n✅ 총 ${updateCount}개 서브코드 업데이트 완료!`);

      // 업데이트 결과 확인
      console.log('\n📊 업데이트된 서브코드 목록:');
      const updatedSubCodes = await client.query(`
        SELECT group_code, subcode, subcode_name
        FROM admin_mastercode_data
        WHERE codetype = 'subcode'
        ORDER BY group_code, subcode;
      `);

      let currentGroup = '';
      updatedSubCodes.rows.forEach((subcode, index) => {
        if (subcode.group_code !== currentGroup) {
          currentGroup = subcode.group_code;
          console.log(`\n📂 ${currentGroup}:`);
        }
        console.log(`  ${subcode.subcode} (${subcode.subcode_name})`);
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
updateSubCodeRules();