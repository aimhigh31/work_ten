const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartmentData() {
  console.log("🏢 부서 데이터 확인...");

  try {
    // admin_users_department 테이블 조회
    const { data: departments, error } = await supabase
      .from("admin_users_department")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.log("❌ 조회 실패:", error);
      return;
    }

    if (departments && departments.length > 0) {
      console.log(`✅ ${departments.length}개의 활성 부서를 찾았습니다:\n`);
      departments.forEach((dept, index) => {
        console.log(`  ${index + 1}. ${dept.department_name} (${dept.department_code})`);
      });
    } else {
      console.log("❌ 활성 부서가 없습니다. 샘플 데이터를 생성해야 합니다.");
    }

  } catch (err) {
    console.error("❌ 확인 실패:", err);
  }
}

checkDepartmentData();
