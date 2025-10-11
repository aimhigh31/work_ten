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

async function checkIncidentReport() {
  try {
    console.log('🔍 incident_report 데이터 확인 중...\n');

    // 최근 데이터 가져오기
    const { data, error } = await supabase
      .from('security_accident_data')
      .select('id, code, main_content, incident_report')
      .order('updated_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log(`✅ ${data.length}개의 레코드를 찾았습니다.\n`);

      data.forEach((record, index) => {
        console.log(`\n📋 레코드 ${index + 1}:`);
        console.log(`  - ID: ${record.id}`);
        console.log(`  - 코드: ${record.code}`);
        console.log(`  - 사고내용: ${record.main_content}`);

        if (record.incident_report) {
          console.log('  - incident_report 데이터: ✅ 있음');
          console.log('  - 데이터 타입:', typeof record.incident_report);

          // JSON 내용 확인
          if (typeof record.incident_report === 'object') {
            console.log('  - incident_report 내용:');
            Object.keys(record.incident_report).forEach(key => {
              const value = record.incident_report[key];
              if (value) {
                console.log(`    • ${key}: ${value}`);
              }
            });
          }
        } else {
          console.log('  - incident_report 데이터: ❌ 없음');
        }
        console.log('  ---');
      });
    } else {
      console.log('⚠️ 데이터가 없습니다.');
    }

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err.message);
  }
}

// 스크립트 실행
checkIncidentReport();