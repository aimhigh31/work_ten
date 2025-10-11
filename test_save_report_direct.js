const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// useSupabaseAccidentReport 훅의 saveReport 로직과 동일한 테스트
async function testSaveReportDirect() {
  try {
    console.log('🧪 saveReport 함수 직접 테스트 시작...\n');

    // 1. 기존 사고 ID 조회
    const { data: accidents } = await supabase
      .from('security_accident_data')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (!accidents || accidents.length === 0) {
      console.error('❌ 테스트할 사고가 없습니다.');
      return;
    }

    const testAccidentId = accidents[0].id;
    console.log('📋 테스트 대상 사고 ID:', testAccidentId);

    // 2. 테스트용 사고보고 데이터
    const testReportData = {
      accident_id: testAccidentId,
      discovery_datetime: null,
      discoverer: null,
      discovery_method: null,
      report_datetime: null,
      reporter: null,
      report_method: null,
      incident_target: null,
      incident_cause: null,
      affected_systems: null,
      affected_data: null,
      service_impact: null,
      business_impact: null,
      situation_details: null,
      response_method: null,
      improvement_executor: null,
      expected_completion_date: null,
      improvement_details: null,
      completion_date: null,
      completion_approver: null,
      resolution_details: null,
      prevention_details: null
    };

    console.log('📝 저장할 데이터:', testReportData);

    // 3. saveReport 함수와 동일한 로직 수행
    console.log('🔍 기존 데이터 확인 중...');
    const { data: existingData, error: fetchError } = await supabase
      .from('security_accident_report')
      .select('*')
      .eq('accident_id', testReportData.accident_id)
      .single();

    let existing = null;
    if (!fetchError || fetchError.code !== 'PGRST116') {
      if (fetchError) {
        console.error('🔴 기존 데이터 확인 실패:', fetchError);
        console.error('🔴 에러 코드:', fetchError.code);
        console.error('🔴 에러 메시지:', fetchError.message);
        return;
      }
      existing = existingData;
    }

    console.log('📊 기존 데이터:', existing ? '있음' : '없음');

    // 4. 저장 또는 업데이트
    let result;
    if (existing) {
      console.log('🔄 기존 데이터 업데이트');
      const { data, error } = await supabase
        .from('security_accident_report')
        .update({
          ...testReportData,
          updated_at: new Date().toISOString(),
          updated_by: 'test'
        })
        .eq('accident_id', testReportData.accident_id)
        .select()
        .single();

      if (error) {
        console.error('🔴 업데이트 실패:', error);
        console.error('🔴 에러 코드:', error.code);
        console.error('🔴 에러 메시지:', error.message);
        console.error('🔴 에러 상세:', JSON.stringify(error, null, 2));
        return;
      }
      result = data;
    } else {
      console.log('➕ 새 데이터 생성');
      const { data, error } = await supabase
        .from('security_accident_report')
        .insert([{
          ...testReportData,
          created_at: new Date().toISOString(),
          created_by: 'test'
        }])
        .select()
        .single();

      if (error) {
        console.error('🔴 삽입 실패:', error);
        console.error('🔴 에러 코드:', error.code);
        console.error('🔴 에러 메시지:', error.message);
        console.error('🔴 에러 상세:', JSON.stringify(error, null, 2));
        return;
      }
      result = data;
    }

    console.log('✅ 저장 성공:', result);
    console.log('\n🎉 테스트 완료 - 모든 과정이 정상적으로 실행되었습니다.');

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
    console.error('🔴 에러 타입:', typeof err);
    console.error('🔴 에러 상세:', JSON.stringify(err, null, 2));
  }
}

testSaveReportDirect();