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

async function testSecurityInspectionIntegration() {
  try {
    console.log('🔄 보안점검 연동 테스트 시작...\n');

    // 1. 모든 보안점검 데이터 조회 테스트
    console.log('📋 1단계: 모든 보안점검 데이터 조회');
    const { data: allInspections, error: fetchError } = await supabase
      .from('security_inspection_data')
      .select('*')
      .order('id', { ascending: false });

    if (fetchError) {
      console.error('❌ 데이터 조회 실패:', fetchError);
      return;
    }

    console.log('✅ 데이터 조회 성공:', allInspections.length, '건');
    allInspections.forEach(item => {
      console.log(`  - ID: ${item.id}, Code: ${item.code}, Type: ${item.inspection_type}, Status: ${item.status}`);
    });

    // 2. 새로운 보안점검 데이터 생성 테스트
    console.log('\n➕ 2단계: 새로운 보안점검 데이터 생성');
    const newInspectionData = {
      code: `SEC-INS-TEST-${Date.now()}`,
      inspection_type: '보안점검',
      inspection_target: '내부',
      inspection_content: '테스트용 보안점검 - UI 연동 테스트',
      inspection_date: '2025-11-01',
      team: '보안팀',
      assignee: '테스트담당자',
      status: '대기',
      progress: 0,
      attachments: []
    };

    const { data: createdInspection, error: createError } = await supabase
      .from('security_inspection_data')
      .insert([newInspectionData])
      .select()
      .single();

    if (createError) {
      console.error('❌ 생성 실패:', createError);
      return;
    }

    console.log('✅ 생성 성공:', createdInspection);

    // 3. 생성된 데이터 수정 테스트
    console.log('\n🔄 3단계: 생성된 데이터 수정');
    const updateData = {
      status: '진행',
      progress: 50,
      assignee: '수정된담당자',
      updated_at: new Date().toISOString(),
      updated_by: 'test_user'
    };

    const { data: updatedInspection, error: updateError } = await supabase
      .from('security_inspection_data')
      .update(updateData)
      .eq('id', createdInspection.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 수정 실패:', updateError);
      return;
    }

    console.log('✅ 수정 성공:', updatedInspection);

    // 4. 특정 ID로 데이터 조회 테스트
    console.log('\n🔍 4단계: 특정 ID로 데이터 조회');
    const { data: specificInspection, error: specificError } = await supabase
      .from('security_inspection_data')
      .select('*')
      .eq('id', createdInspection.id)
      .single();

    if (specificError) {
      console.error('❌ 특정 조회 실패:', specificError);
      return;
    }

    console.log('✅ 특정 조회 성공:', specificInspection);

    // 5. 데이터 변환 테스트 (Supabase → UI 형식)
    console.log('\n🔄 5단계: 데이터 변환 테스트');
    const transformedData = {
      id: specificInspection.id,
      no: specificInspection.no,
      registrationDate: specificInspection.registration_date,
      code: specificInspection.code,
      inspectionType: specificInspection.inspection_type,
      inspectionTarget: specificInspection.inspection_target,
      inspectionContent: specificInspection.inspection_content,
      team: specificInspection.team,
      assignee: specificInspection.assignee,
      status: specificInspection.status,
      inspectionDate: specificInspection.inspection_date,
      attachments: specificInspection.attachments || []
    };

    console.log('✅ UI 형식 변환 성공:');
    console.log('  - ID:', transformedData.id);
    console.log('  - 코드:', transformedData.code);
    console.log('  - 점검유형:', transformedData.inspectionType);
    console.log('  - 점검대상:', transformedData.inspectionTarget);
    console.log('  - 상태:', transformedData.status);
    console.log('  - 담당자:', transformedData.assignee);

    // 6. 통계 조회 테스트
    console.log('\n📊 6단계: 상태별 통계 조회');
    const { data: statsData, error: statsError } = await supabase
      .from('security_inspection_data')
      .select('status');

    if (statsError) {
      console.error('❌ 통계 조회 실패:', statsError);
      return;
    }

    const stats = statsData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ 통계 조회 성공:', stats);

    // 7. 테스트 데이터 정리
    console.log('\n🗑️ 7단계: 테스트 데이터 정리');
    const { error: deleteError } = await supabase
      .from('security_inspection_data')
      .delete()
      .eq('id', createdInspection.id);

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError);
      return;
    }

    console.log('✅ 테스트 데이터 삭제 완료');

    console.log('\n🎉 통합 테스트 완료! 모든 기능이 정상적으로 작동합니다.');
    console.log('\n📝 요약:');
    console.log('- ✅ security_inspection_data 테이블 생성 및 조회 완료');
    console.log('- ✅ 보안점검 데이터 CRUD 작업 완료');
    console.log('- ✅ DB ↔ UI 데이터 변환 완료');
    console.log('- ✅ 상태별 통계 조회 완료');
    console.log('- ✅ 데이터 정리 완료');

  } catch (err) {
    console.error('❌ 통합 테스트 실패:', err.message);
    console.error('전체 에러:', err);
  }
}

// 스크립트 실행
testSecurityInspectionIntegration();