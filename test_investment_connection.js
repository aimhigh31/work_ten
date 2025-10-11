const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvestmentConnection() {
  console.log("🧪 투자관리 테이블 연결 테스트...");

  try {
    // 데이터 조회 테스트
    const { data, error } = await supabase
      .from("plan_investment_data")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("❌ 조회 실패:", error);
    } else {
      console.log("✅ 조회 성공:", data?.length, "개 투자 데이터");
      if (data && data.length > 0) {
        console.log("📄 첫 번째 데이터:", {
          id: data[0].id,
          investment_name: data[0].investment_name,
          code: data[0].code,
          status: data[0].status,
          amount: data[0].amount
        });
      }
    }

  } catch (err) {
    console.error("❌ 연결 테스트 실패:", err);
  }
}

testInvestmentConnection();