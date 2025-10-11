const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserTable() {
  try {
    const { data, error } = await supabase
      .from("admin_users_userprofiles")
      .select("*")
      .limit(1);

    if (error) {
      console.error("테이블 조회 오류:", error);
    } else {
      console.log("사용자 테이블 컬럼:", Object.keys(data[0] || {}));
    }
  } catch (err) {
    console.error("전체 오류:", err);
  }
}

checkUserTable();
