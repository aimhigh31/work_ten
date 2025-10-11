const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableColumns() {
  console.log("🔍 투자관리 테이블 컬럼 구조 확인...");

  try {
    // 첫 번째 데이터 조회해서 컬럼 확인
    const { data, error } = await supabase
      .from("plan_investment_data")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    if (error) {
      console.log("❌ 조회 실패:", error);
    } else if (data && data.length > 0) {
      console.log("✅ 테이블 컬럼 구조:");
      const columns = Object.keys(data[0]);
      columns.forEach((column, index) => {
        console.log(`${index + 1}. ${column}: ${typeof data[0][column]} (${data[0][column]})`);
      });

      // description 컬럼 존재 여부 확인
      if (columns.includes('description')) {
        console.log("\n✅ description 컬럼이 이미 존재합니다!");
      } else {
        console.log("\n❌ description 컬럼이 없습니다. 추가가 필요합니다.");
      }
    } else {
      console.log("📄 데이터가 없습니다.");
    }

  } catch (err) {
    console.error("❌ 테이블 구조 확인 실패:", err);
  }
}

checkTableColumns();