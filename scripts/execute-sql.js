const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경변수 로드
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

// Service Role 키로 Supabase 클라이언트 생성 (RLS 우회 가능)
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSqlFile(filePath) {
  console.log(`📄 SQL 파일 실행: ${filePath}`);
  
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // 주석과 빈 줄 제거
    const sqlStatements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    if (!sqlStatements.trim()) {
      console.log('⚠️  실행할 SQL 문이 없습니다.');
      return;
    }
    
    console.log('🔄 SQL 실행 중...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_text: sqlStatements
    });
    
    if (error) {
      console.error('❌ SQL 실행 오류:', error);
      throw error;
    }
    
    console.log('✅ SQL 실행 완료');
    return true;
  } catch (error) {
    console.error('❌ 파일 실행 오류:', error.message);
    throw error;
  }
}

async function main() {
  const sqlFiles = [
    'sql-for-dashboard/01-extensions-and-basic-tables.sql',
    'sql-for-dashboard/02-cost-management-tables.sql',
    'sql-for-dashboard/03-task-education-tables.sql'
  ];
  
  console.log('🚀 Supabase 데이터베이스 스키마 생성 시작');
  console.log('📍 프로젝트:', supabaseUrl);
  
  for (let i = 0; i < sqlFiles.length; i++) {
    const filePath = path.join(__dirname, '..', sqlFiles[i]);
    
    console.log(`\n=== ${i + 1}단계: ${sqlFiles[i]} ===`);
    
    try {
      await executeSqlFile(filePath);
      console.log(`✅ ${i + 1}단계 완료`);
    } catch (error) {
      console.error(`❌ ${i + 1}단계 실패:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n🎉 모든 SQL 스크립트 실행 완료!');
  console.log('📊 Supabase Dashboard에서 테이블을 확인해보세요.');
}

if (require.main === module) {
  main().catch(console.error);
}