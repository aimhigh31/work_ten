const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertSampleOplData() {
  console.log('🔍 OPL 테이블 확인 및 샘플 데이터 삽입...');

  try {
    // 기존 보안점검 데이터 조회
    const { data: inspections } = await supabase
      .from('security_inspection_data')
      .select('id, code')
      .eq('is_active', true)
      .limit(1);

    if (!inspections || inspections.length === 0) {
      console.log('ℹ️ 연결할 보안점검 데이터가 없습니다.');
      return;
    }

    const inspectionId = inspections[0].id;
    console.log('🔗 연결 대상 보안점검 ID:', inspectionId, '코드:', inspections[0].code);

    const sampleData = [
      {
        inspection_id: inspectionId,
        title: '방화벽 설정 점검',
        description: '네트워크 방화벽의 보안 정책 및 룰 점검',
        category: '네트워크',
        severity: '높음',
        check_point: '방화벽 정책 설정 상태 및 불필요한 포트 개방 여부',
        check_method: '방화벽 관리 콘솔을 통한 정책 확인 및 포트 스캔',
        expected_result: '필요한 포트만 개방되고 보안 정책이 적절히 설정됨',
        item_order: 1
      },
      {
        inspection_id: inspectionId,
        title: '웹 애플리케이션 취약점 점검',
        description: 'SQL 인젝션, XSS 등 웹 애플리케이션 보안 취약점 점검',
        category: '웹어플리케이션',
        severity: '높음',
        check_point: 'OWASP Top 10 취약점 존재 여부',
        check_method: '자동화 도구를 이용한 취약점 스캔 및 수동 점검',
        expected_result: '주요 보안 취약점이 존재하지 않음',
        item_order: 2
      },
      {
        inspection_id: inspectionId,
        title: '계정 관리 정책 점검',
        description: '사용자 계정의 비밀번호 정책 및 권한 관리 상태 점검',
        category: '시스템',
        severity: '보통',
        check_point: '비밀번호 복잡성 정책 및 계정 잠금 설정',
        check_method: '시스템 정책 설정 확인 및 계정 관리 절차 검토',
        expected_result: '강력한 비밀번호 정책이 적용되고 계정이 적절히 관리됨',
        item_order: 3
      }
    ];

    const { data, error } = await supabase
      .from('security_inspection_opl')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ 샘플 데이터 삽입 실패:', error);
    } else {
      console.log('✅ 샘플 OPL 데이터 삽입 성공:', data.length, '개 항목');
      console.log('📋 삽입된 데이터:');
      data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} (${item.category})`);
      });
    }

  } catch (err) {
    console.error('❌ 전체 프로세스 실패:', err);
  }
}

insertSampleOplData();