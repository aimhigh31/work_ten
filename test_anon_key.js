const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;  // ANON_KEY 사용

console.log("🔑 ANON_KEY로 연결 테스트...");

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testWithAnonKey() {
  try {
    console.log("1️⃣ ANON_KEY로 기본 SELECT 테스트...");
    const { data, error } = await supabase
      .from("it_solution_data")
      .select("id, title")
      .limit(3);
      
    if (error) {
      console.log("❌ ANON_KEY SELECT 실패:", error);
      console.log("  - 이것은 RLS가 여전히 활성화되어 있다는 의미입니다.");
    } else {
      console.log("✅ ANON_KEY SELECT 성공:", data?.length, "개");
      console.log("  - RLS가 올바르게 해지되었습니다!");
    }
    
    console.log("\n2️⃣ ANON_KEY로 INSERT 테스트...");
    const { data: insertData, error: insertError } = await supabase
      .from("it_solution_data")
      .insert([{
        no: 999,
        registration_date: new Date().toISOString().split("T")[0],
        code: "ANON-TEST-001",
        solution_type: "테스트",
        development_type: "테스트",
        title: "ANON_KEY 테스트",
        detail_content: "RLS 해지 테스트",
        team: "테스트팀",
        assignee: "테스트담당자",
        status: "테스트",
        created_by: "anon_test",
        updated_by: "anon_test",
        is_active: true
      }])
      .select()
      .single();
      
    if (insertError) {
      console.log("❌ ANON_KEY INSERT 실패:", insertError);
      console.log("  - RLS나 권한 정책이 여전히 활성화되어 있습니다.");
    } else {
      console.log("✅ ANON_KEY INSERT 성공! ID:", insertData?.id);
      
      // 테스트 데이터 정리
      await supabase
        .from("it_solution_data")
        .delete()
        .eq("id", insertData.id);
      console.log("✅ 테스트 데이터 정리 완료");
    }
    
  } catch (err) {
    console.error("❌ 예외:", err);
  }
}

testWithAnonKey();
