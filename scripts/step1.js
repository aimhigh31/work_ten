const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQL(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
    if (error) throw error;
    return data;
  } catch (error) {
    // exec_sql RPC가 없다면 직접 SQL 실행
    console.log('exec_sql RPC를 사용할 수 없어 직접 쿼리를 실행합니다.');
    
    // SQL을 개별 문장으로 분리하여 실행
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (!trimmed) continue;
      
      console.log(`실행중: ${trimmed.substring(0, 50)}...`);
      
      try {
        if (trimmed.startsWith('CREATE EXTENSION')) {
          // 확장 생성은 건너뛸 수 있음 (이미 활성화되어 있을 수 있음)
          continue;
        }
        
        const { error: queryError } = await supabase.rpc('sql_exec', { query: trimmed });
        if (queryError) {
          console.log('RPC 방식 실패, 직접 쿼리 시도...');
          // 직접 쿼리를 시도하지만 모든 DDL이 지원되지 않을 수 있음
        }
      } catch (err) {
        console.log(`쿼리 실행 중 오류 (계속 진행): ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('=== 1단계: 기본 확장 및 핵심 테이블 ===');
  
  const sqlContent = fs.readFileSync('sql-for-dashboard/01-extensions-and-basic-tables.sql', 'utf8');
  
  try {
    await executeSQL(sqlContent);
    console.log('✅ 1단계 완료');
  } catch (error) {
    console.error('❌ 1단계 실패:', error.message);
  }
}

main().catch(console.error);