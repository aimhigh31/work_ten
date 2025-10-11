const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentTables() {
  console.log("🔍 현재 테이블 상태 확인 중...\n");

  const tables = [
    "admin_checklist_management",
    "admin_checklist_editor",
    "admin_checklist_data"
  ];

  for (const tableName of tables) {
    console.log(`📋 테이블: ${tableName}`);

    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select("*", { count: "exact" })
        .limit(3);

      if (error) {
        if (error.message.includes("schema cache")) {
          console.log(`❌ 스키마 캐시 문제: ${error.message}`);
        } else if (error.message.includes("does not exist")) {
          console.log(`⚠️ 테이블이 존재하지 않음`);
        } else {
          console.log(`❌ 조회 실패: ${error.message}`);
        }
      } else {
        console.log(`✅ 조회 성공 - 총 ${count}개 행`);
        if (data && data.length > 0) {
          console.log(`   첫 번째 데이터 열: ${Object.keys(data[0]).join(", ")}`);
        }
      }
    } catch (err) {
      console.log(`❌ 오류: ${err.message}`);
    }

    console.log("");
  }

  // 현재 스키마 정보 확인
  console.log("🔧 스키마 정보 확인...");
  try {
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_schema_info');

    if (schemaError) {
      console.log("⚠️ 스키마 정보 함수가 없음");
    } else {
      console.log("✅ 스키마 정보:", schemaData);
    }
  } catch (err) {
    console.log("⚠️ 스키마 정보 확인 실패");
  }
}

checkCurrentTables();