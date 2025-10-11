const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvestmentTableColumns() {
  console.log("🔍 투자 테이블 컬럼 구조 확인...");

  try {
    const { data, error } = await supabase
      .from("plan_investment_data")
      .select("*")
      .limit(1);

    if (error) {
      console.error("❌ 테이블 조회 오류:", error);
      return;
    }

    if (data && data.length > 0) {
      console.log("\n✅ 테이블 컬럼 목록:");
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col}: ${typeof data[0][col]} (예시값: ${JSON.stringify(data[0][col])})`);
      });

      console.log("\n📊 투자유형 관련 컬럼:");
      if (columns.includes("investment_type")) {
        console.log("  ✅ investment_type 컬럼 존재");
      } else if (columns.includes("investmentType")) {
        console.log("  ✅ investmentType 컬럼 존재");
      } else {
        console.log("  ❌ 투자유형 컬럼을 찾을 수 없음");
      }

      console.log("\n📊 팀 관련 컬럼:");
      if (columns.includes("team")) {
        console.log("  ✅ team 컬럼 존재");
      } else {
        console.log("  ❌ team 컬럼을 찾을 수 없음");
      }
    } else {
      console.log("❌ 테이블에 데이터가 없습니다.");
    }

  } catch (err) {
    console.error("❌ 확인 실패:", err);
  }
}

checkInvestmentTableColumns();
