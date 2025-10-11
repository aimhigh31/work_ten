require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChecklistData() {
  try {
    console.log('🔍 admin_checklist_data 테이블 확인 중...\n');

    // 1. 데이터 조회
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .select('*')
      .order('id');

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      return;
    }

    console.log(`📊 총 ${data.length}개의 체크리스트가 있습니다.\n`);

    if (data.length === 0) {
      console.log('⚠️ 체크리스트가 비어있습니다. 샘플 데이터를 추가하시겠습니까?');

      // 샘플 데이터 추가
      const sampleData = [
        {
          registrationDate: new Date().toISOString().split('T')[0],
          code: 'CKL001',
          workContent: '시스템 보안 점검',
          description: '전체 시스템의 보안 취약점 점검 및 개선',
          status: '진행중',
          team: '보안팀',
          assignee: 'U001',
          department: 'SEC001'
        },
        {
          registrationDate: new Date().toISOString().split('T')[0],
          code: 'CKL002',
          workContent: '백업 시스템 구축',
          description: '데이터베이스 및 파일 시스템 백업 프로세스 구축',
          status: '대기',
          team: 'IT운영팀',
          assignee: 'U002',
          department: 'IT001'
        },
        {
          registrationDate: new Date().toISOString().split('T')[0],
          code: 'CKL003',
          workContent: '성능 모니터링 대시보드',
          description: '시스템 성능 지표를 실시간으로 모니터링하는 대시보드 구축',
          status: '완료',
          team: '개발팀',
          assignee: 'U003',
          department: 'DEV001'
        }
      ];

      console.log('\n➕ 샘플 데이터 추가 중...');
      const { data: insertedData, error: insertError } = await supabase
        .from('admin_checklist_data')
        .insert(sampleData)
        .select();

      if (insertError) {
        console.error('❌ 샘플 데이터 추가 실패:', insertError.message);
      } else {
        console.log('✅ 샘플 데이터 추가 완료!');
        insertedData.forEach(item => {
          console.log(`   - ${item.workContent} (ID: ${item.id})`);
        });
      }
    } else {
      // 기존 데이터 표시
      console.log('📋 현재 체크리스트:');
      data.forEach(item => {
        console.log(`   ID: ${item.id}`);
        console.log(`   제목: ${item.workContent}`);
        console.log(`   상태: ${item.status}`);
        console.log(`   팀: ${item.team}`);
        console.log(`   등록일: ${item.registrationDate}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

checkChecklistData();