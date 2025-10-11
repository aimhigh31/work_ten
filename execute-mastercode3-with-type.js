const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMasterCode3WithType() {
  try {
    console.log('🚀 Type 필드가 포함된 admin_mastercode3_with_type 테이블 생성 시작...');

    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('./create-admin-mastercode3-with-type.sql', 'utf8');

    // SQL 명령어들을 분리 (세미콜론 기준)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 총 ${sqlCommands.length}개의 SQL 명령어를 실행합니다.`);

    // 각 SQL 명령어 실행
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];

      if (command.toUpperCase().includes('DROP TABLE')) {
        console.log(`🗑️  기존 테이블 삭제 중... (${i + 1}/${sqlCommands.length})`);
      } else if (command.toUpperCase().includes('CREATE TABLE')) {
        console.log(`🏗️  새 테이블 생성 중... (${i + 1}/${sqlCommands.length})`);
      } else if (command.toUpperCase().includes('CREATE INDEX')) {
        console.log(`📊 인덱스 생성 중... (${i + 1}/${sqlCommands.length})`);
      } else if (command.toUpperCase().includes('INSERT INTO')) {
        console.log(`📥 데이터 삽입 중... (${i + 1}/${sqlCommands.length})`);
      } else {
        console.log(`⚙️  SQL 실행 중... (${i + 1}/${sqlCommands.length})`);
      }

      const { error } = await supabase.rpc('execute_sql', { sql_query: command });

      if (error) {
        console.error(`❌ SQL 실행 오류 (명령어 ${i + 1}):`, error);
        // 오류가 발생해도 계속 진행 (이미 존재하는 함수 등의 경우)
      }
    }

    console.log('✅ admin_mastercode3_with_type 테이블 생성 완료!');

    // 생성된 데이터 확인
    console.log('\n📊 생성된 데이터 확인:');

    const { data: allData, error: fetchError } = await supabase
      .from('admin_mastercode3_with_type')
      .select('*')
      .order('group_code_order')
      .order('record_type', { ascending: false }) // group이 먼저 오도록
      .order('subcode_order');

    if (fetchError) {
      console.error('❌ 데이터 조회 오류:', fetchError);
      return;
    }

    // 그룹별로 데이터 정리
    const groupedData = {};
    let groupInfo = {};

    allData.forEach(row => {
      if (row.record_type === 'group') {
        groupInfo[row.group_code] = {
          name: row.group_code_name,
          description: row.group_code_description,
          order: row.group_code_order,
          subcodes: []
        };
        if (!groupedData[row.group_code]) {
          groupedData[row.group_code] = [];
        }
      } else if (row.record_type === 'subcode') {
        if (!groupedData[row.group_code]) {
          groupedData[row.group_code] = [];
        }
        groupedData[row.group_code].push(row);
      }
    });

    // 결과 출력
    Object.keys(groupInfo)
      .sort((a, b) => groupInfo[a].order - groupInfo[b].order)
      .forEach(groupCode => {
        const group = groupInfo[groupCode];
        console.log(`\n📁 그룹: ${groupCode} - ${group.name} (순서: ${group.order})`);

        const subcodes = groupedData[groupCode] || [];
        subcodes
          .sort((a, b) => a.subcode_order - b.subcode_order)
          .forEach(subcode => {
            console.log(`  ├─ [${subcode.id}] ${subcode.subcode} - ${subcode.subcode_name} (순서: ${subcode.subcode_order}, 활성: ${subcode.is_active})`);
          });
      });

    // 통계 정보
    console.log('\n📋 통계 정보:');
    const groupCount = Object.keys(groupInfo).length;
    const totalSubcodes = allData.filter(row => row.record_type === 'subcode').length;

    Object.keys(groupInfo).forEach(groupCode => {
      const subcodeCount = groupedData[groupCode] ? groupedData[groupCode].length : 0;
      console.log(`  ${groupInfo[groupCode].name}: ${subcodeCount}개 서브코드`);
    });

    console.log(`\n총 ${groupCount}개 그룹, ${totalSubcodes}개 서브코드 생성됨`);
    console.log(`총 ${allData.length}개 레코드 생성됨`);

    console.log('\n🎉 Type 필드가 포함된 테이블 생성 및 데이터 입력 완료!');
    console.log('\n💡 새로운 구조의 장점:');
    console.log('  - record_type 필드로 그룹과 서브코드 명확히 구분');
    console.log('  - 그룹 정보는 한 번만 저장 (중복 제거)');
    console.log('  - 서브코드는 그룹 정보를 참조하여 일관성 유지');
    console.log('  - 더 효율적인 쿼리와 데이터 관리 가능');

  } catch (error) {
    console.error('💥 테이블 생성 실패:', error);
  }
}

executeMasterCode3WithType();