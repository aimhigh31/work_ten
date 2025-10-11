const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function execDirectSQL() {
  console.log('🚀 직접 SQL 실행...');

  try {
    // SQL 파일 읽기
    const sqlContent = fs.readFileSync('software_table.sql', 'utf8');
    console.log('📂 SQL 파일 읽기 완료');

    // SQL 명령어를 세미콜론으로 분리
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 총 ${sqlCommands.length}개의 SQL 명령어 찾음`);

    // 각 명령어 순차 실행
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      console.log(`🔄 명령어 ${i + 1} 실행 중...`);

      const { data, error } = await supabase.rpc('exec', { sql: cmd + ';' });

      if (error) {
        console.error(`❌ 명령어 ${i + 1} 실패:`, error);
        console.error('명령어:', cmd);
      } else {
        console.log(`✅ 명령어 ${i + 1} 성공`);
        if (data && data.length > 0) {
          console.log('결과:', data);
        }
      }

      // 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 최종 확인
    console.log('🔍 최종 테이블 확인...');
    const { data: tables, error: tablesError } = await supabase.rpc('exec', {
      sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'it_software_data';`
    });

    if (tablesError) {
      console.error('❌ 테이블 확인 실패:', tablesError);
    } else {
      console.log('✅ 테이블 존재 여부:', tables);

      if (tables && tables.length > 0) {
        // 데이터 개수 확인
        const { data: count, error: countError } = await supabase.rpc('exec', {
          sql: 'SELECT COUNT(*) as count FROM it_software_data;'
        });

        if (countError) {
          console.error('❌ 데이터 개수 확인 실패:', countError);
        } else {
          console.log('✅ 데이터 개수:', count);
        }
      }
    }

  } catch (err) {
    console.error('❌ 전체 작업 실패:', err);
  }
}

execDirectSQL();