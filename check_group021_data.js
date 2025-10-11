const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase DATABASE_URL에서 연결 정보 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 DATABASE_URL:', dbUrl ? '설정됨' : '없음');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkGroup021Data() {
  const client = await pool.connect();

  try {
    console.log('🔍 GROUP021 데이터 확인 시작...');

    // 1. GROUP021 그룹 존재 확인
    const groupCheck = await client.query(`
      SELECT * FROM admin_mastercode_data
      WHERE codetype = 'group' AND group_code = 'GROUP021'
    `);

    console.log('\n📋 GROUP021 그룹 상태:');
    if (groupCheck.rows.length > 0) {
      console.log('✅ GROUP021 그룹 존재');
      console.log('  그룹명:', groupCheck.rows[0].group_code_name);
      console.log('  설명:', groupCheck.rows[0].group_code_description);
    } else {
      console.log('❌ GROUP021 그룹이 존재하지 않음');

      // GROUP021 그룹 생성
      console.log('\n🆕 GROUP021 그룹 생성 중...');
      await client.query(`
        INSERT INTO admin_mastercode_data
        (codetype, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
         subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order,
         created_at, updated_at, is_active)
        VALUES
        ('group', 'GROUP021', '솔루션유형', '솔루션 관리에서 사용하는 솔루션 유형 분류', 'active', 21,
         '', '', '', 'active', '', 0,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
      `);
      console.log('✅ GROUP021 그룹 생성 완료');
    }

    // 2. GROUP021 서브코드 확인
    const subcodeCheck = await client.query(`
      SELECT * FROM admin_mastercode_data
      WHERE codetype = 'subcode' AND group_code = 'GROUP021'
      ORDER BY subcode_order
    `);

    console.log('\n📋 GROUP021 서브코드 상태:');
    if (subcodeCheck.rows.length > 0) {
      console.log(`✅ ${subcodeCheck.rows.length}개 서브코드 존재:`);
      subcodeCheck.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.subcode}: ${row.subcode_name}`);
      });
    } else {
      console.log('❌ GROUP021 서브코드가 존재하지 않음');

      // 솔루션유형 서브코드 생성
      console.log('\n🆕 솔루션유형 서브코드 생성 중...');
      const solutionTypes = [
        { code: 'SOL001', name: '웹개발', desc: '웹사이트 및 웹 애플리케이션 개발', order: 1 },
        { code: 'SOL002', name: '모바일앱', desc: '모바일 애플리케이션 개발', order: 2 },
        { code: 'SOL003', name: '시스템통합', desc: '시스템 통합 및 연동 작업', order: 3 },
        { code: 'SOL004', name: '데이터분석', desc: '데이터 분석 및 BI 구축', order: 4 },
        { code: 'SOL005', name: '보안강화', desc: '시스템 보안 강화 작업', order: 5 },
        { code: 'SOL006', name: '인프라구축', desc: '인프라 구축 및 운영', order: 6 }
      ];

      for (const type of solutionTypes) {
        await client.query(`
          INSERT INTO admin_mastercode_data
          (codetype, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
           subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order,
           created_at, updated_at, is_active)
          VALUES
          ('subcode', 'GROUP021', '솔루션유형', '솔루션 관리에서 사용하는 솔루션 유형 분류', 'active', 21,
           $1, $2, $3, 'active', '', $4,
           CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, true)
        `, [type.code, type.name, type.desc, type.order]);
      }
      console.log('✅ 솔루션유형 서브코드 생성 완료');
    }

    // 3. 최종 결과 확인
    const finalCheck = await client.query(`
      SELECT codetype, group_code, group_code_name, subcode, subcode_name, subcode_order
      FROM admin_mastercode_data
      WHERE group_code = 'GROUP021'
      ORDER BY codetype DESC, subcode_order
    `);

    console.log('\n📊 최종 GROUP021 데이터:');
    finalCheck.rows.forEach(row => {
      if (row.codetype === 'group') {
        console.log(`🏷️  그룹: ${row.group_code} - ${row.group_code_name}`);
      } else {
        console.log(`   └ ${row.subcode}: ${row.subcode_name}`);
      }
    });

    console.log('\n🎉 GROUP021 데이터 확인 및 설정 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkGroup021Data();
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