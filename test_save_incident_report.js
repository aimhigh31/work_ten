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

async function testSaveIncidentReport() {
  try {
    console.log('🔍 사고보고 데이터 저장 테스트...\n');

    // 테스트용 사고보고 데이터
    const testIncidentReport = {
      discoveryDateTime: '2025-09-24T10:00',
      discoverer: '테스트 발견자',
      discoveryMethod: '시스템 자동탐지',
      reportDateTime: '2025-09-24T11:00',
      reporter: '테스트 보고자',
      reportMethod: '이메일',
      incidentTarget: '테스트 대상',
      incidentCause: '테스트 원인',
      affectedSystems: '테스트 시스템',
      affectedData: '테스트 데이터',
      serviceImpact: '중간',
      businessImpact: '낮음',
      situationDetails: '테스트 상황 상세',
      responseMethod: '격리',
      improvementExecutor: '테스트 담당자',
      expectedCompletionDate: '2025-09-30',
      improvementDetails: '테스트 개선 상세',
      completionDate: '2025-09-25',
      completionApprover: '테스트 승인자',
      resolutionDetails: '테스트 해결 상세',
      preventionDetails: '테스트 예방 상세'
    };

    // 가장 최근 레코드 조회
    const { data: records, error: fetchError } = await supabase
      .from('security_accident_data')
      .select('id, code, main_content')
      .order('id', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('❌ 레코드 조회 실패:', fetchError);
      return;
    }

    if (!records || records.length === 0) {
      console.log('⚠️ 레코드가 없습니다.');
      return;
    }

    const targetRecord = records[0];
    console.log('📋 대상 레코드:', targetRecord);

    // incident_report 업데이트
    const { data: updateData, error: updateError } = await supabase
      .from('security_accident_data')
      .update({
        incident_report: testIncidentReport,
        response_stage: '사고탐지',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetRecord.id)
      .select();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      console.error('에러 상세:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ 업데이트 성공!');
      console.log('저장된 데이터:', updateData[0]);

      // 저장된 데이터 확인
      if (updateData[0].incident_report) {
        console.log('\n📊 incident_report 내용:');
        Object.keys(updateData[0].incident_report).forEach(key => {
          console.log(`  - ${key}: ${updateData[0].incident_report[key]}`);
        });
      }
    }

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err.message);
  }
}

// 스크립트 실행
testSaveIncidentReport();