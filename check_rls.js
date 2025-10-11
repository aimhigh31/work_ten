const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkRLS() {
  console.log("🔐 it_solution_data 테이블 RLS 상태 확인...");
  
  try {
    // 서비스 롤은 RLS를 무시하므로 INSERT/UPDATE가 성공하지만
    // 특정 쿼리 패턴에서 문제가 발생할 수 있음
    
    console.log("1️⃣ RLS 무시 테스트 (서비스 롤)...");
    const { data, error } = await supabase
      .from("it_solution_data")
      .select("id")
      .limit(1);
      
    if (error) {
      console.log("❌ 기본 SELECT 실패:", error);
    } else {
      console.log("✅ 기본 SELECT 성공:", data?.length, "개");
    }
    
    console.log("\n2️⃣ 문제의 COUNT 쿼리 재테스트...");
    const { data: countData, error: countError } = await supabase
      .from("it_solution_data")
      .select("count(*)", { count: "exact", head: true });
      
    console.log("COUNT 결과:", { data: countData, error: countError });
    console.log("오류 타입:", typeof countError);
    console.log("오류 키:", countError ? Object.keys(countError) : "null");
    
  } catch (err) {
    console.error("❌ 예외:", err);
  }
}

checkRLS();
