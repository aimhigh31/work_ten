const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertBasicRoles() {
  try {
    console.log("기본 역할 데이터 생성 중...");

    // 테이블이 없을 경우를 대비해 기본 데이터만 삽입 시도
    const basicRoles = [
      {
        role_code: "ADMIN-001",
        role_name: "시스템 관리자", 
        role_description: "시스템 전체 관리 권한을 가진 최고 관리자",
        is_active: true,
        display_order: 1
      },
      {
        role_code: "MANAGER-001",
        role_name: "프로젝트 관리자",
        role_description: "프로젝트 관리 및 팀 운영 업무 담당", 
        is_active: true,
        display_order: 2
      }
    ];

    const { data, error } = await supabase
      .from("admin_usersettings_role")
      .insert(basicRoles)
      .select();

    if (error) {
      console.error("데이터 삽입 오류:", error);
      console.log("테이블이 존재하지 않을 가능성이 있습니다.");
    } else {
      console.log("✅ 기본 역할 데이터 생성 성공:", data.length, "개");
    }

  } catch (err) {
    console.error("전체 오류:", err);
  }
}

insertBasicRoles();
