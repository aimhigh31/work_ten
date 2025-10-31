// 솔루션 테이블 스키마 확인 스크립트
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSolutionSchema() {
  try {
    console.log('🔌 Supabase 연결 중...');
    console.log('✅ 연결 성공\n');

    // 샘플 데이터 확인
    console.log('📦 샘플 데이터 (최근 5개):');
    const { data: sampleData, error: sampleError } = await supabase
      .from('it_solution_data')
      .select('id, code, status, solution_type, development_type, team, title')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sampleError) {
      console.error('❌ 샘플 데이터 조회 오류:', sampleError.message);
    } else {
      console.table(sampleData);

      // status 값 길이 확인
      console.log('\n📏 status 값 길이 분석:');
      if (sampleData && sampleData.length > 0) {
        const statusAnalysis = sampleData.map(row => ({
          status: row.status,
          길이: row.status ? row.status.length : 0,
          solution_type_길이: row.solution_type ? row.solution_type.length : 0,
          development_type_길이: row.development_type ? row.development_type.length : 0,
          code_길이: row.code ? row.code.length : 0
        }));
        console.table(statusAnalysis);

        // 최대 길이 확인
        const maxLengths = {
          status: Math.max(...statusAnalysis.map(s => s.길이)),
          solution_type: Math.max(...statusAnalysis.map(s => s.solution_type_길이)),
          development_type: Math.max(...statusAnalysis.map(s => s.development_type_길이)),
          code: Math.max(...statusAnalysis.map(s => s.code_길이))
        };
        console.log('\n📊 최대 길이:');
        console.table(maxLengths);

        // varchar(10) 제약 위반 여부 확인
        console.log('\n⚠️  varchar(10) 제약 위반 확인:');
        const violations = [];
        if (maxLengths.status > 10) violations.push(`status: ${maxLengths.status}자 (>10)`);
        if (maxLengths.solution_type > 10) violations.push(`solution_type: ${maxLengths.solution_type}자 (>10)`);
        if (maxLengths.development_type > 10) violations.push(`development_type: ${maxLengths.development_type}자 (>10)`);
        if (maxLengths.code > 10) violations.push(`code: ${maxLengths.code}자 (>10)`);

        if (violations.length > 0) {
          console.log('❌ varchar(10) 제약 위반 컬럼:', violations.join(', '));
        } else {
          console.log('✅ 모든 컬럼이 varchar(10) 제약 내에 있습니다.');
        }
      }
    }

    // 마스터코드에서 status 값 확인
    console.log('\n📋 마스터코드 - status 값 (GROUP002):');
    const { data: statusMaster, error: statusError } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'subcode')
      .eq('is_active', true)
      .order('subcode_order', { ascending: true });

    if (statusError) {
      console.error('❌ 마스터코드 조회 오류:', statusError.message);
    } else {
      const statusMasterWithLength = statusMaster.map(row => ({
        subcode: row.subcode,
        subcode_name: row.subcode_name,
        subcode_길이: row.subcode.length
      }));
      console.table(statusMasterWithLength);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  }
}

checkSolutionSchema();
