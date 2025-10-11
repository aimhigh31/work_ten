const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroup025Data() {
  console.log("🔍 GROUP025 투자유형 데이터 확인...");

  try {
    // GROUP025가 있는지 확인
    const { data: existingGroup, error: checkError } = await supabase
      .from("admin_mastercode_data")
      .select("*")
      .eq("group_code", "GROUP025")
      .eq("codetype", "group")
      .single();

    if (existingGroup) {
      console.log("✅ GROUP025가 존재합니다:", existingGroup.group_code_name);

      // 서브코드 확인
      const { data: subcodes, error: subError } = await supabase
        .from("admin_mastercode_data")
        .select("*")
        .eq("group_code", "GROUP025")
        .eq("codetype", "subcode")
        .order("subcode_order", { ascending: true });

      if (subcodes && subcodes.length > 0) {
        console.log(`\n📄 ${subcodes.length}개의 투자유형이 있습니다:`);
        subcodes.forEach(sub => {
          console.log(`  ${sub.subcode_order}. ${sub.subcode_name} (${sub.subcode})`);
        });
      } else {
        console.log("❌ GROUP025에 서브코드가 없습니다.");
      }
    } else {
      console.log("❌ GROUP025 그룹이 존재하지 않습니다.");
    }

  } catch (err) {
    console.error("❌ 확인 실패:", err);
  }
}

checkGroup025Data();