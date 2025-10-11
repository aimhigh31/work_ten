const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRolesTableSQL() {
  try {
    console.log("역할 테이블 생성을 위한 SQL 실행 중...");

    // 직접 SQL 실행
    const { data, error } = await supabase.rpc("exec_sql", { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.admin_usersettings_role (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          role_code VARCHAR(50) UNIQUE NOT NULL,
          role_name VARCHAR(100) NOT NULL,
          role_description TEXT,
          is_active BOOLEAN DEFAULT true,
          display_order INTEGER DEFAULT 0,
          permissions JSONB DEFAULT '[]'::jsonb,
          created_by VARCHAR(100) DEFAULT 'system',
          updated_by VARCHAR(100) DEFAULT 'system'
        );
      `
    });

    if (error) {
      console.error("테이블 생성 오류:", error);
    } else {
      console.log("✅ 테이블 생성 성공");
    }

  } catch (err) {
    console.error("전체 오류:", err);
  }
}

createRolesTableSQL();
