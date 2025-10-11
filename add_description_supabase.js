const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addDescriptionColumnViaSupabase() {
  console.log("📝 Supabase를 통해 description 컬럼 추가 시도...");

  try {
    // Supabase RPC를 사용해서 컬럼 추가
    const { data, error } = await supabase.rpc('add_description_column');

    if (error) {
      console.log("❌ RPC 실행 실패:", error);

      // 대안: 직접 SQL 실행 시도
      console.log("🔄 대안 방법 시도: SQL 직접 실행...");

      // 먼저 기존 데이터에 description 필드 추가해서 업데이트
      const { data: investments, error: fetchError } = await supabase
        .from("plan_investment_data")
        .select("id")
        .eq("is_active", true);

      if (fetchError) {
        console.log("❌ 데이터 조회 실패:", fetchError);
        return;
      }

      console.log(`📄 ${investments.length}개의 투자 데이터를 찾았습니다.`);
      console.log("⚠️  현재는 프론트엔드에서 description 필드를 처리하도록 구현하겠습니다.");

    } else {
      console.log("✅ description 컬럼이 성공적으로 추가되었습니다!");
    }

  } catch (err) {
    console.error("❌ 컬럼 추가 실패:", err);
    console.log("⚠️  데이터베이스 스키마 변경은 관리자 권한이 필요할 수 있습니다.");
    console.log("💡 대신 프론트엔드에서 description을 JSON 형태로 저장하겠습니다.");
  }
}

addDescriptionColumnViaSupabase();