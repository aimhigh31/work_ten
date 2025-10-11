const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartmentsData() {
  console.log("🔍 부서 데이터 확인...");

  try {
    // 부서 테이블 확인
    const { data: departments, error: deptError } = await supabase
      .from("admin_users_department")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (deptError) {
      console.error("❌ 부서 조회 오류:", deptError);
      return;
    }

    if (departments && departments.length > 0) {
      console.log(`✅ ${departments.length}개의 활성 부서가 있습니다:`);
      departments.forEach(dept => {
        console.log(`  ${dept.display_order}. ${dept.department_name} (${dept.department_code})`);
      });
    } else {
      console.log("❌ 활성 부서가 없습니다.");
    }

  } catch (err) {
    console.error("❌ 확인 실패:", err);
  }
}

checkDepartmentsData();