const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGroup002Status() {
  console.log("🔍 GROUP002 상태 마스터코드 확인...");

  try {
    // GROUP002가 있는지 확인
    const { data: existingGroup, error: checkError } = await supabase
      .from("admin_mastercode_data")
      .select("*")
      .eq("group_code", "GROUP002")
      .eq("codetype", "group")
      .single();

    if (existingGroup) {
      console.log("✅ GROUP002가 존재합니다:", existingGroup.group_code_name);

      // 서브코드 확인
      const { data: subcodes, error: subError } = await supabase
        .from("admin_mastercode_data")
        .select("*")
        .eq("group_code", "GROUP002")
        .eq("codetype", "subcode")
        .order("subcode_order", { ascending: true });

      if (subcodes && subcodes.length > 0) {
        console.log(`\n📄 ${subcodes.length}개의 상태가 있습니다:`);
        subcodes.forEach(sub => {
          console.log(`  ${sub.subcode_order}. ${sub.subcode_name} (${sub.subcode})`);
        });
      } else {
        console.log("❌ GROUP002에 서브코드가 없습니다.");
      }
    } else {
      console.log("❌ GROUP002 그룹이 존재하지 않습니다.");
    }

  } catch (err) {
    console.error("❌ 확인 실패:", err);
  }
}

checkGroup002Status();
