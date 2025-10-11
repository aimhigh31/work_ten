// Admin_Systemsetting_Menu 테이블 생성
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
// Service role key를 사용해야 테이블 생성 권한이 있습니다
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTable() {
  console.log('🔨 Admin_Systemsetting_Menu 테이블 생성 시작...');
  
  try {
    // 테이블 생성 SQL
    const createTableSQL = `
      -- Admin_Systemsetting_Menu 테이블 생성
      CREATE TABLE IF NOT EXISTS "public"."Admin_Systemsetting_Menu" (
        "id" bigserial PRIMARY KEY,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "menu_level" integer NOT NULL DEFAULT 0,
        "menu_category" varchar(100) NOT NULL,
        "menu_icon" varchar(50),
        "menu_page" varchar(100) NOT NULL,
        "menu_description" text,
        "menu_url" varchar(200) NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" varchar(100) NOT NULL DEFAULT 'system',
        "updated_by" varchar(100) NOT NULL DEFAULT 'system'
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_category" ON "public"."Admin_Systemsetting_Menu"("menu_category");
      CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_level" ON "public"."Admin_Systemsetting_Menu"("menu_level");
      CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_enabled" ON "public"."Admin_Systemsetting_Menu"("is_enabled");
      CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_order" ON "public"."Admin_Systemsetting_Menu"("display_order");

      -- RLS 정책 생성 (필요한 경우)
      ALTER TABLE "public"."Admin_Systemsetting_Menu" ENABLE ROW LEVEL SECURITY;

      -- 모든 사용자가 읽기 가능
      CREATE POLICY IF NOT EXISTS "Allow read access for all users" ON "public"."Admin_Systemsetting_Menu"
        FOR SELECT USING (true);

      -- 인증된 사용자는 쓰기 가능 (필요에 따라 조정)
      CREATE POLICY IF NOT EXISTS "Allow write access for authenticated users" ON "public"."Admin_Systemsetting_Menu"
        FOR ALL USING (auth.role() = 'authenticated');
    `;

    // 테이블 생성 실행
    const { data: createResult, error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    });

    if (createError) {
      console.log('❌ 테이블 생성 오류:', createError);
      
      // 다른 방법으로 시도 - 개별 실행
      console.log('🔄 개별 쿼리로 재시도...');
      
      const simpleCreateSQL = `
        CREATE TABLE "public"."Admin_Systemsetting_Menu" (
          "id" bigserial PRIMARY KEY,
          "created_at" timestamptz DEFAULT now() NOT NULL,
          "updated_at" timestamptz DEFAULT now() NOT NULL,
          "menu_level" integer NOT NULL DEFAULT 0,
          "menu_category" varchar(100) NOT NULL,
          "menu_icon" varchar(50),
          "menu_page" varchar(100) NOT NULL,
          "menu_description" text,
          "menu_url" varchar(200) NOT NULL,
          "is_enabled" boolean NOT NULL DEFAULT true,
          "display_order" integer NOT NULL DEFAULT 0,
          "created_by" varchar(100) NOT NULL DEFAULT 'system',
          "updated_by" varchar(100) NOT NULL DEFAULT 'system'
        );
      `;
      
      const { data: simpleResult, error: simpleError } = await supabase.rpc('exec', {
        sql: simpleCreateSQL
      });
      
      if (simpleError) {
        console.log('❌ 간단한 테이블 생성도 실패:', simpleError);
        return false;
      } else {
        console.log('✅ 테이블 생성 성공 (간단 버전)');
      }
    } else {
      console.log('✅ 테이블 및 정책 생성 완료');
    }

    // 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입...');
    const sampleData = [
      {
        menu_level: 0,
        menu_category: '대시보드',
        menu_icon: 'DashboardOutlined',
        menu_page: '대시보드',
        menu_description: '메인 대시보드 페이지',
        menu_url: '/',
        is_enabled: true,
        display_order: 1
      },
      {
        menu_level: 0,
        menu_category: '시스템 설정',
        menu_icon: 'SettingsOutlined',
        menu_page: '시스템 설정',
        menu_description: '시스템 설정 메인',
        menu_url: '/admin-panel/system-settings',
        is_enabled: true,
        display_order: 2
      },
      {
        menu_level: 1,
        menu_category: '시스템 설정',
        menu_icon: 'MenuOutlined',
        menu_page: '메뉴 관리',
        menu_description: '시스템 메뉴 관리',
        menu_url: '/admin-panel/system-settings?tab=menu',
        is_enabled: true,
        display_order: 3
      }
    ];

    const { data: insertData, error: insertError } = await supabase
      .from('Admin_Systemsetting_Menu')
      .insert(sampleData);

    if (insertError) {
      console.log('⚠️ 샘플 데이터 삽입 오류:', insertError);
    } else {
      console.log('✅ 샘플 데이터 삽입 완료');
    }

    // 최종 확인
    console.log('🔍 테이블 생성 확인...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('Admin_Systemsetting_Menu')
      .select('*')
      .limit(5);

    if (verifyError) {
      console.log('❌ 테이블 확인 실패:', verifyError);
      return false;
    } else {
      console.log('✅ 테이블 생성 및 데이터 확인 완료');
      console.log('데이터:', verifyData);
      return true;
    }

  } catch (error) {
    console.log('💥 테이블 생성 중 예외 발생:', error);
    return false;
  }
}

createTable().then((success) => {
  if (success) {
    console.log('🎉 테이블 생성 작업 완료!');
  } else {
    console.log('❌ 테이블 생성 작업 실패');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('테이블 생성 실패:', error);
  process.exit(1);
});