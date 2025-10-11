const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL에서 연결 정보 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 DATABASE_URL:', dbUrl ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkGroup002Data() {
  const client = await pool.connect();

  try {
    console.log('🔍 GROUP002 데이터 확인 시작...');

    // 1. GROUP002 그룹 존재 확인
    const groupCheck = await client.query(`
      SELECT * FROM admin_mastercode_data
      WHERE codetype = 'group' AND group_code = 'GROUP002'
    `);

    console.log('\n📋 GROUP002 그룹 상태:');
    if (groupCheck.rows.length > 0) {
      console.log('✅ GROUP002 그룹 존재');
      console.log('  그룹명:', groupCheck.rows[0].group_code_name);
      console.log('  설명:', groupCheck.rows[0].group_code_description);
    } else {
      console.log('❌ GROUP002 그룹이 존재하지 않음');

      // GROUP002 그룹 생성
      console.log('\n🆕 GROUP002 그룹 생성 중...');
      await client.query(`
        INSERT INTO admin_mastercode_data
        (codetype, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
         subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order,
         created_at, updated_at, is_active)
        VALUES
        ('group', 'GROUP002', '상태관리', '솔루션 관리에서 사용하는 상태 분류', 'active', 2,
         '', '', '', 'active', '', 0,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
      `);
      console.log('✅ GROUP002 그룹 생성 완료');
    }

    // 2. GROUP002 서브코드 확인
    const subcodeCheck = await client.query(`
      SELECT * FROM admin_mastercode_data
      WHERE codetype = 'subcode' AND group_code = 'GROUP002'
      ORDER BY subcode_order
    `);

    console.log('\n📋 GROUP002 서브코드 상태:');
    if (subcodeCheck.rows.length > 0) {
      console.log(`✅ ${subcodeCheck.rows.length}개 서브코드 존재:`);
      subcodeCheck.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.subcode}: ${row.subcode_name}`);
      });
    } else {
      console.log('❌ GROUP002 서브코드가 존재하지 않음');

      // 상태 서브코드 생성
      console.log('\n🆕 상태 서브코드 생성 중...');
      const statusTypes = [
        { code: 'STA001', name: '대기', desc: '작업 대기 상태', order: 1 },
        { code: 'STA002', name: '진행', desc: '작업 진행 중', order: 2 },
        { code: 'STA003', name: '완료', desc: '작업 완료', order: 3 },
        { code: 'STA004', name: '홀딩', desc: '작업 보류 상태', order: 4 }
      ];

      for (const type of statusTypes) {
        await client.query(`
          INSERT INTO admin_mastercode_data
          (codetype, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
           subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order,
           created_at, updated_at, is_active)
          VALUES
          ('subcode', 'GROUP002', '상태관리', '솔루션 관리에서 사용하는 상태 분류', 'active', 2,
           $1, $2, $3, 'active', '', $4,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        `, [type.code, type.name, type.desc, type.order]);
      }
      console.log('✅ 상태 서브코드 생성 완료');
    }

    // 3. 최종 결과 확인
    const finalCheck = await client.query(`
      SELECT codetype, group_code, group_code_name, subcode, subcode_name, subcode_order
      FROM admin_mastercode_data
      WHERE group_code = 'GROUP002'
      ORDER BY codetype DESC, subcode_order
    `);

    console.log('\n📊 최종 GROUP002 데이터:');
    finalCheck.rows.forEach(row => {
      if (row.codetype === 'group') {
        console.log(`🏷️  그룹: ${row.group_code} - ${row.group_code_name}`);
      } else {
        console.log(`   └ ${row.subcode}: ${row.subcode_name}`);
      }
    });

    console.log('\n🎉 GROUP002 데이터 확인 및 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkGroup002Data();
  } catch (error) {
    console.error('❌ 실행 실패:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}