const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  console.log("🧪 투자 데이터 업데이트 테스트...");

  // 간단한 업데이트 테스트
  const testData = {
    investment_name: "테스트 업데이트",
    investment_type: "설비",
    team: "경영관리팀",
    updated_at: new Date().toISOString()
  };

  console.log("📦 테스트 데이터:", testData);

  const { data, error } = await supabase
    .from("plan_investment_data")
    .update(testData)
    .eq("id", 5)
    .eq("is_active", true)
    .select();

  if (error) {
    console.error("❌ 업데이트 오류:");
    console.error("  message:", error.message);
    console.error("  details:", error.details);
    console.error("  hint:", error.hint);
    console.error("  code:", error.code);
  } else {
    console.log("✅ 업데이트 성공:", data);
  }
}

testUpdate();
