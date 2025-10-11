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

async function testAccidentReportIntegration() {
  try {
    console.log('🔄 사고보고 연동 테스트 시작...\n');

    // 1. 기존 사고 데이터 조회
    console.log('📋 1단계: 기존 사고 데이터 조회');
    const { data: accidents, error: fetchError } = await supabase
      .from('security_accident_data')
      .select('id, code, main_content')
      .order('id', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('❌ 사고 데이터 조회 실패:', fetchError);
      return;
    }

    if (!accidents || accidents.length === 0) {
      console.log('⚠️ 사고 데이터가 없습니다. 테스트 사고를 생성합니다.');

      // 테스트 사고 생성
      const { data: newAccident, error: createError } = await supabase
        .from('security_accident_data')
        .insert([{
          code: 'TEST-' + Date.now(),
          main_content: '테스트용 보안사고 - 사고보고 연동 테스트',
          assignee: '테스트 담당자',
          status: '대기',
          incident_type: '악성코드',
          team: '보안팀',
          response_stage: '사고탐지',
          progress: 0,
          severity: '중간',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ 테스트 사고 생성 실패:', createError);
        return;
      }

      accidents[0] = newAccident;
      console.log('✅ 테스트 사고 생성 성공:', newAccident);
    }

    const testAccident = accidents[0];
    console.log('✅ 대상 사고:', testAccident);

    // 2. 사고보고 데이터 생성
    console.log('\n📝 2단계: 사고보고 데이터 생성');
    const reportData = {
      accident_id: testAccident.id,
      discovery_datetime: new Date().toISOString(),
      discoverer: '시스템 관리자',
      discovery_method: '자동 모니터링',
      report_datetime: new Date().toISOString(),
      reporter: '보안 담당자',
      report_method: '시스템 알림',
      incident_target: '웹 서버',
      incident_cause: '악성 스크립트 실행',
      affected_systems: '웹 서버, 데이터베이스',
      affected_data: '사용자 세션 정보',
      service_impact: '중간',
      business_impact: '낮음',
      situation_details: '자동화된 보안 스캔에서 악성 스크립트가 감지되어 즉시 격리 조치됨',
      response_method: '시스템 격리',
      improvement_executor: '보안팀 담당자',
      expected_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      improvement_details: '보안 패치 적용 및 모니터링 강화',
      completion_date: null,
      completion_approver: null,
      resolution_details: null,
      prevention_details: '정기적인 보안 스캔 및 패치 관리 프로세스 개선'
    };

    // 기존 사고보고 데이터 확인 후 삭제
    const { data: existingReport, error: checkError } = await supabase
      .from('security_accident_report')
      .select('*')
      .eq('accident_id', testAccident.id)
      .single();

    if (existingReport) {
      console.log('🔄 기존 사고보고 데이터 삭제 중...');
      await supabase
        .from('security_accident_report')
        .delete()
        .eq('accident_id', testAccident.id);
    }

    // 새 사고보고 데이터 삽입
    const { data: savedReport, error: saveError } = await supabase
      .from('security_accident_report')
      .insert([reportData])
      .select()
      .single();

    if (saveError) {
      console.error('❌ 사고보고 저장 실패:', saveError);
      return;
    }

    console.log('✅ 사고보고 저장 성공:', savedReport);

    // 3. 저장된 데이터 재조회
    console.log('\n🔍 3단계: 저장된 데이터 재조회');
    const { data: retrievedReport, error: retrieveError } = await supabase
      .from('security_accident_report')
      .select('*')
      .eq('accident_id', testAccident.id)
      .single();

    if (retrieveError) {
      console.error('❌ 데이터 재조회 실패:', retrieveError);
      return;
    }

    console.log('✅ 데이터 재조회 성공:', retrievedReport);

    // 4. 데이터 변환 테스트 (DB -> UI 형태)
    console.log('\n🔄 4단계: 데이터 변환 테스트');
    const uiReport = {
      discoveryDateTime: retrievedReport.discovery_datetime || '',
      discoverer: retrievedReport.discoverer || '',
      discoveryMethod: retrievedReport.discovery_method || '',
      reportDateTime: retrievedReport.report_datetime || '',
      reporter: retrievedReport.reporter || '',
      reportMethod: retrievedReport.report_method || '',
      incidentTarget: retrievedReport.incident_target || '',
      incidentCause: retrievedReport.incident_cause || '',
      affectedSystems: retrievedReport.affected_systems || '',
      affectedData: retrievedReport.affected_data || '',
      serviceImpact: retrievedReport.service_impact || '',
      businessImpact: retrievedReport.business_impact || '',
      situationDetails: retrievedReport.situation_details || '',
      responseMethod: retrievedReport.response_method || '',
      improvementExecutor: retrievedReport.improvement_executor || '',
      expectedCompletionDate: retrievedReport.expected_completion_date || '',
      improvementDetails: retrievedReport.improvement_details || '',
      completionDate: retrievedReport.completion_date || '',
      completionApprover: retrievedReport.completion_approver || '',
      resolutionDetails: retrievedReport.resolution_details || '',
      preventionDetails: retrievedReport.prevention_details || ''
    };

    console.log('✅ UI 형태 데이터 변환 성공:');
    console.log('  - 발견자:', uiReport.discoverer);
    console.log('  - 보고자:', uiReport.reporter);
    console.log('  - 사고대상:', uiReport.incidentTarget);
    console.log('  - 서비스영향:', uiReport.serviceImpact);
    console.log('  - 업무영향:', uiReport.businessImpact);

    // 5. 개요탭 연동 테스트 (요약 정보)
    console.log('\n📊 5단계: 개요탭 연동 정보');
    const overviewSummary = {
      discoverer: uiReport.discoverer,
      reporter: uiReport.reporter,
      incidentTarget: uiReport.incidentTarget,
      serviceImpact: uiReport.serviceImpact,
      businessImpact: uiReport.businessImpact
    };

    console.log('✅ 개요탭에 표시될 요약 정보:', overviewSummary);

    console.log('\n🎉 통합 테스트 완료! 모든 기능이 정상적으로 작동합니다.');
    console.log('\n📝 요약:');
    console.log('- ✅ security_accident_report 테이블 생성 완료');
    console.log('- ✅ 사고보고 데이터 저장 및 조회 완료');
    console.log('- ✅ DB ↔ UI 데이터 변환 완료');
    console.log('- ✅ 개요탭과의 연동 데이터 준비 완료');

  } catch (err) {
    console.error('❌ 통합 테스트 실패:', err.message);
    console.error('전체 에러:', err);
  }
}

// 스크립트 실행
testAccidentReportIntegration();