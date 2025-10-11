const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testDelete() {
  console.log("🧪 삭제 기능 테스트...");
  
  // ID 1번 데이터로 테스트
  const testId = 1;
  
  console.log(`\n1️⃣ ID ${testId}번 삭제 테스트...`);
  const { data, error } = await supabase
    .from("it_solution_data")
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", testId)
    .select();
    
  if (error) {
    console.log("❌ 삭제 실패:", error);
  } else {
    console.log("✅ 삭제 성공:", data);
  }
  
  // 원복
  console.log(`\n2️⃣ ID ${testId}번 원복...`);
  const { data: restoreData, error: restoreError } = await supabase
    .from("it_solution_data")
    .update({
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", testId)
    .select();
    
  if (restoreError) {
    console.log("❌ 원복 실패:", restoreError);
  } else {
    console.log("✅ 원복 성공!");
  }
}

testDelete();
