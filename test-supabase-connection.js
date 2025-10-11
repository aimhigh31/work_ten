// Supabase 연결 및 테이블 존재 확인 테스트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Supabase 연결 테스트 시작...');
  
  try {
    // 1. 기본 연결 테스트
    console.log('1단계: 기본 연결 테스트');
    const { data: basicTest, error: basicError } = await supabase
      .from('_supabase_realtime')
      .select('*')
      .limit(1);
      
    if (basicError) {
      console.log('기본 연결 오류:', basicError);
    } else {
      console.log('✅ 기본 연결 성공');
    }

    // 2. Admin_Systemsetting_Menu 테이블 확인
    console.log('2단계: Admin_Systemsetting_Menu 테이블 확인');
    const { data: tableData, error: tableError } = await supabase
      .from('Admin_Systemsetting_Menu')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('=== 테이블 오류 상세 분석 ===');
      console.log('오류 객체:', tableError);
      console.log('오류 타입:', typeof tableError);
      console.log('오류 키들:', Object.keys(tableError));
      
      // 모든 속성 출력
      for (const [key, value] of Object.entries(tableError)) {
        console.log(`${key}:`, value);
      }
      
      if (tableError.code === '42P01') {
        console.log('❌ 테이블이 존재하지 않습니다.');
        
        // 3. 테이블 생성 시도
        console.log('3단계: 테이블 생성 시도');
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS Admin_Systemsetting_Menu (
            id BIGSERIAL PRIMARY KEY,
            created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
            menu_level INTEGER NOT NULL DEFAULT 0,
            menu_category VARCHAR(100) NOT NULL,
            menu_icon VARCHAR(50),
            menu_page VARCHAR(100) NOT NULL,
            menu_description TEXT,
            menu_url VARCHAR(200) NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT true,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_by VARCHAR(100) NOT NULL DEFAULT 'system',
            updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
          );
        `;
        
        const { data: createData, error: createError } = await supabase.rpc('exec', {
          sql: createTableSQL
        });
        
        if (createError) {
          console.log('테이블 생성 오류:', createError);
        } else {
          console.log('✅ 테이블 생성 성공');
        }
      }
    } else {
      console.log('✅ 테이블 존재 확인됨');
      console.log('테이블 데이터:', tableData);
    }

    // 4. 모든 테이블 목록 확인
    console.log('4단계: 모든 테이블 목록 확인');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.log('테이블 목록 조회 오류:', tablesError);
    } else {
      console.log('공개 테이블 목록:', tables?.map(t => t.table_name));
    }

  } catch (error) {
    console.log('=== 전체 테스트 예외 발생 ===');
    console.log('예외:', error);
    console.log('예외 타입:', typeof error);
    if (error && typeof error === 'object') {
      console.log('예외 속성들:');
      for (const [key, value] of Object.entries(error)) {
        console.log(`  ${key}:`, value);
      }
    }
  }
}

testConnection().then(() => {
  console.log('테스트 완료');
  process.exit(0);
}).catch(error => {
  console.error('테스트 실패:', error);
  process.exit(1);
});