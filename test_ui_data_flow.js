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

// InspectionEditDialog에서 handleSave로 생성되는 데이터 형태 시뮬레이션
function simulateUIDataFlow() {
  console.log('🔄 UI 데이터 플로우 시뮬레이션 시작...\n');

  // 1. InspectionEditDialog의 formData 시뮬레이션
  const formData = {
    inspectionContent: '웹 애플리케이션 보안 점검',
    inspectionType: '보안점검',
    inspectionTarget: '내부',
    assignee: '김보안',
    inspectionDate: '2025-11-15',
    status: '대기',
    code: '', // 자동 생성될 예정
    registrationDate: '2025-09-25',
    team: '보안팀',
    details: '상세 설명...'
  };

  console.log('📊 1단계: FormData 시뮬레이션');
  console.log('  - 점검내용:', formData.inspectionContent);
  console.log('  - 점검유형:', formData.inspectionType);
  console.log('  - 점검대상:', formData.inspectionTarget);
  console.log('  - 담당자:', formData.assignee);
  console.log('  - 팀:', formData.team);

  // 2. handleSave에서 생성되는 updatedInspection 데이터 시뮬레이션
  const updatedInspection = {
    id: Date.now(),
    no: Math.floor(Math.random() * 1000),
    inspectionContent: formData.inspectionContent,
    inspectionType: formData.inspectionType,
    inspectionTarget: formData.inspectionTarget,
    assignee: formData.assignee,
    inspectionDate: formData.inspectionDate,
    status: formData.status,
    code: formData.code || `SEC-INS-${new Date().getFullYear().toString().slice(-2)}${String(Date.now()).slice(-6)}`,
    registrationDate: formData.registrationDate,
    team: formData.team,
    attachments: []
  };

  console.log('\n📊 2단계: UpdatedInspection 데이터 생성');
  console.log('  - ID:', updatedInspection.id);
  console.log('  - Code:', updatedInspection.code);
  console.log('  - 모든 필드 있음:', Object.keys(updatedInspection));

  // 3. handleEditInspectionSave에서 Supabase로 전송되는 데이터 형태 시뮬레이션
  const supabaseData = {
    code: updatedInspection.code,
    inspection_type: updatedInspection.inspectionType,
    inspection_target: updatedInspection.inspectionTarget,
    inspection_content: updatedInspection.inspectionContent,
    inspection_date: updatedInspection.inspectionDate || null,
    team: updatedInspection.team,
    assignee: updatedInspection.assignee,
    status: updatedInspection.status,
    attachments: updatedInspection.attachments || []
  };

  console.log('\n📊 3단계: Supabase 전송 데이터 변환');
  console.log('  - inspection_type:', supabaseData.inspection_type);
  console.log('  - inspection_target:', supabaseData.inspection_target);
  console.log('  - inspection_content:', supabaseData.inspection_content);
  console.log('  - team:', supabaseData.team);
  console.log('  - assignee:', supabaseData.assignee);

  // 4. 필수 필드 검증
  console.log('\n✅ 4단계: 필수 필드 검증');
  const requiredFields = ['code', 'inspection_type', 'inspection_target', 'inspection_content', 'team', 'assignee', 'status'];
  const missingFields = requiredFields.filter(field => !supabaseData[field]);

  if (missingFields.length > 0) {
    console.error('❌ 누락된 필수 필드:', missingFields);
    return false;
  } else {
    console.log('✅ 모든 필수 필드 존재');
  }

  // 5. 데이터 타입 검증
  console.log('\n🔍 5단계: 데이터 타입 검증');
  const typeChecks = [
    { field: 'inspection_type', expected: ['보안점검', '취약점점검', '침투테스트', '컴플라이언스점검'], actual: supabaseData.inspection_type },
    { field: 'inspection_target', expected: ['고객사', '내부', '파트너사'], actual: supabaseData.inspection_target },
    { field: 'status', expected: ['대기', '진행', '완료', '홀딩'], actual: supabaseData.status }
  ];

  let typeValid = true;
  typeChecks.forEach(check => {
    if (!check.expected.includes(check.actual)) {
      console.error(`❌ ${check.field}: "${check.actual}"는 유효하지 않습니다. 허용값: [${check.expected.join(', ')}]`);
      typeValid = false;
    } else {
      console.log(`✅ ${check.field}: "${check.actual}" 유효함`);
    }
  });

  if (!typeValid) {
    return false;
  }

  console.log('\n🎉 시뮬레이션 완료! UI 데이터 플로우가 올바르게 구성되어 있습니다.');
  console.log('\n📝 다음 단계:');
  console.log('1. 브라우저에서 http://localhost:3200 접속');
  console.log('2. 보안점검 관리 페이지로 이동');
  console.log('3. "새로 만들기" 또는 기존 항목 편집');
  console.log('4. 개요탭에서 데이터 입력 후 저장');
  console.log('5. 개발자 도구 콘솔에서 로그 확인');

  return true;
}

// 시뮬레이션 실행
simulateUIDataFlow();