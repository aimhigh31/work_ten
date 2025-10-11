const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSolutionStatus() {
  console.log("🔍 it_solution_data 테이블 상태 확인...");
  
  const { data: activeData, error: activeError } = await supabase
    .from("it_solution_data")
    .select("id, code, title, is_active")
    .eq("is_active", true)
    .limit(5);
    
  const { data: inactiveData, error: inactiveError } = await supabase
    .from("it_solution_data")
    .select("id, code, title, is_active")
    .eq("is_active", false)
    .limit(5);
    
  console.log("\n✅ 활성 상태 데이터 (is_active=true):");
  console.log("  - 총 개수:", activeData?.length || 0);
  if (activeData?.length) {
    activeData.forEach(item => {
      console.log(`    [${item.id}] ${item.code} - ${item.title}`);
    });
  }
  
  console.log("\n❌ 비활성 상태 데이터 (is_active=false):");
  console.log("  - 총 개수:", inactiveData?.length || 0);
  if (inactiveData?.length) {
    inactiveData.forEach(item => {
      console.log(`    [${item.id}] ${item.code} - ${item.title}`);
    });
  }
}

checkSolutionStatus();
