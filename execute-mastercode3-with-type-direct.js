const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL 직접 연결 설정
const client = new Client({
  connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', 'postgresql://postgres:')
    .replace('.supabase.co', '.supabase.co:5432') + '/' + process.env.NEXT_PUBLIC_SUPABASE_DB_NAME || 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeMasterCode3WithTypeDirect() {
  try {
    console.log('🔌 PostgreSQL 직접 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');

    console.log('🚀 Type 필드가 포함된 admin_mastercode3_with_type 테이블 생성 시작...');

    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('./create-admin-mastercode3-with-type.sql', 'utf8');

    console.log('📝 SQL 스크립트 실행 중...');

    // 전체 SQL을 한 번에 실행
    const result = await client.query(sqlContent);

    console.log('✅ SQL 스크립트 실행 완료!');

    // 생성된 데이터 확인
    console.log('\n📊 생성된 데이터 확인:');

    const dataQuery = `
      SELECT
        record_type,
        group_code,
        group_code_name,
        CASE
          WHEN record_type = 'group' THEN '- 그룹 정보 -'
          ELSE CONCAT(subcode, ' (', subcode_name, ')')
        END as display_name,
        CASE
          WHEN record_type = 'group' THEN group_code_order
          ELSE subcode_order
        END as sort_order,
        id
      FROM admin_mastercode3_with_type
      ORDER BY group_code_order, record_type DESC, subcode_order;
    `;

    const { rows: allData } = await client.query(dataQuery);

    // 그룹별로 데이터 정리하여 출력
    let currentGroup = null;
    let groupCount = 0;
    let subcodeCount = 0;

    allData.forEach(row => {
      if (row.record_type === 'group') {
        if (currentGroup !== row.group_code) {
          currentGroup = row.group_code;
          groupCount++;
          console.log(`\n📁 그룹: ${row.group_code} - ${row.group_code_name} (순서: ${row.sort_order})`);
        }
      } else if (row.record_type === 'subcode') {
        subcodeCount++;
        console.log(`  ├─ [${row.id}] ${row.display_name} (순서: ${row.sort_order})`);
      }
    });

    // 통계 정보
    console.log('\n📋 그룹별 요약:');
    const statsQuery = `
      SELECT
        g.group_code,
        g.group_code_name,
        COUNT(s.id) as subcode_count
      FROM
        (SELECT DISTINCT group_code, group_code_name FROM admin_mastercode3_with_type WHERE record_type = 'group') g
      LEFT JOIN
        (SELECT group_code, id FROM admin_mastercode3_with_type WHERE record_type = 'subcode') s
      ON g.group_code = s.group_code
      GROUP BY g.group_code, g.group_code_name
      ORDER BY g.group_code;
    `;

    const { rows: stats } = await client.query(statsQuery);
    stats.forEach(stat => {
      console.log(`  ${stat.group_code_name}: ${stat.subcode_count}개 서브코드`);
    });

    console.log(`\n총 ${groupCount}개 그룹 생성됨`);
    console.log(`총 ${subcodeCount}개 서브코드 생성됨`);
    console.log(`총 ${allData.length}개 레코드 생성됨`);

    console.log('\n🎉 Type 필드가 포함된 테이블 생성 및 데이터 입력 완료!');
    console.log('\n💡 새로운 구조의 장점:');
    console.log('  - record_type 필드로 그룹과 서브코드 명확히 구분');
    console.log('  - 그룹 정보는 한 번만 저장 (중복 제거)');
    console.log('  - 서브코드는 그룹 정보를 참조하여 일관성 유지');
    console.log('  - 더 효율적인 쿼리와 데이터 관리 가능');
    console.log('  - 그룹별 서브코드 관리가 훨씬 명확해짐');

  } catch (error) {
    console.error('💥 테이블 생성 실패:', error);
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

executeMasterCode3WithTypeDirect();