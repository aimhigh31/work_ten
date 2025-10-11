const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectChecklistData() {
  console.log("🔍 admin_checklist_data 테이블 상세 분석...\n");

  try {
    // 전체 데이터 조회
    const { data, error } = await supabase
      .from("admin_checklist_data")
      .select("*");

    if (error) {
      console.error("❌ 조회 실패:", error);
      return;
    }

    console.log(`📊 총 ${data?.length || 0}개 행 발견`);

    if (data && data.length > 0) {
      console.log("\n📋 첫 번째 데이터:");
      console.log(JSON.stringify(data[0], null, 2));

      console.log("\n🔧 컬럼 구조:");
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        const value = data[0][col];
        const type = typeof value;
        console.log(`  ${index + 1}. ${col}: ${type} - ${value}`);
      });

      // 예상되는 flat structure 컬럼들이 있는지 확인
      const expectedColumns = [
        'checklist_id', 'data_type', 'item_no', 'field_name', 'field_value'
      ];

      console.log("\n🎯 Flat Structure 컬럼 확인:");
      expectedColumns.forEach(col => {
        const exists = columns.includes(col);
        console.log(`  ${col}: ${exists ? '✅ 존재' : '❌ 없음'}`);
      });
    }

  } catch (error) {
    console.error("❌ 오류 발생:", error);
  }
}

inspectChecklistData();