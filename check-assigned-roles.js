const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssignedRoles() {
  try {
    const { data, error } = await supabase
      .from("admin_users_userprofiles")
      .select("id, user_name, assigned_roles")
      .limit(5);

    if (error) {
      console.error("조회 오류:", error);
    } else {
      console.log("사용자별 할당된 역할:");
      data.forEach(user => {
        console.log(`${user.user_name}: ${user.assigned_roles || "없음"}`);
      });
    }
  } catch (err) {
    console.error("전체 오류:", err);
  }
}

checkAssignedRoles();
