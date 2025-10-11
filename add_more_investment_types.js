const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMoreInvestmentTypes() {
  console.log("🚀 GROUP025에 투자유형 추가...");

  try {
    // 현재 서브코드 확인
    const { data: existingSubcodes, error: checkError } = await supabase
      .from("admin_mastercode_data")
      .select("*")
      .eq("group_code", "GROUP025")
      .eq("codetype", "subcode")
      .order("subcode_order", { ascending: false })
      .limit(1);

    if (checkError) {
      console.log("❌ 조회 실패:", checkError);
      return;
    }

    const lastOrder = existingSubcodes && existingSubcodes.length > 0
      ? (existingSubcodes[0].subcode_order || 0)
      : 0;

    // 추가할 투자유형들
    const newInvestmentTypes = [
      { subcode: "GROUP025-SUB005", name: "주식", description: "상장 기업의 지분 투자" },
      { subcode: "GROUP025-SUB006", name: "채권", description: "국채, 회사채 등 채권 투자" },
      { subcode: "GROUP025-SUB007", name: "펀드", description: "뮤추얼 펀드, ETF 등 간접 투자" },
      { subcode: "GROUP025-SUB008", name: "부동산", description: "부동산 직접 투자 및 REITs" },
      { subcode: "GROUP025-SUB009", name: "원자재", description: "금, 원유, 농산물 등 상품 투자" },
      { subcode: "GROUP025-SUB010", name: "파생상품", description: "선물, 옵션 등 파생 금융상품" },
      { subcode: "GROUP025-SUB011", name: "사모펀드", description: "비상장 기업 투자 및 PE" },
      { subcode: "GROUP025-SUB012", name: "헤지펀드", description: "절대수익 추구형 헤지펀드" },
      { subcode: "GROUP025-SUB013", name: "암호화폐", description: "비트코인 등 디지털 자산" },
      { subcode: "GROUP025-SUB014", name: "인프라", description: "사회간접자본 및 인프라 투자" },
      { subcode: "GROUP025-SUB015", name: "벤처투자", description: "스타트업 및 벤처기업 투자" },
      { subcode: "GROUP025-SUB016", name: "기타", description: "기타 대체 투자" }
    ];

    console.log(`📝 ${newInvestmentTypes.length}개의 투자유형 추가 중...`);

    const subcodes = newInvestmentTypes.map((type, index) => ({
      group_code: "GROUP025",
      group_code_name: "투자유형",
      subcode: type.subcode,
      subcode_name: type.name,
      subcode_description: type.description,
      subcode_order: lastOrder + index + 1,
      codetype: "subcode",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from("admin_mastercode_data")
      .insert(subcodes);

    if (insertError) {
      console.log("❌ 서브코드 추가 실패:", insertError);
      return;
    }

    console.log("✅ 모든 투자유형이 성공적으로 추가되었습니다!");

    // 전체 데이터 확인
    const { data: allSubcodes, error: verifyError } = await supabase
      .from("admin_mastercode_data")
      .select("*")
      .eq("group_code", "GROUP025")
      .eq("codetype", "subcode")
      .order("subcode_order", { ascending: true });

    if (!verifyError && allSubcodes) {
      console.log("\n📄 GROUP025 전체 투자유형 목록:");
      allSubcodes.forEach(sub => {
        console.log(`  ${sub.subcode_order}. ${sub.subcode_name} (${sub.subcode})`);
      });
    }

  } catch (err) {
    console.error("❌ 실행 실패:", err);
  }
}

addMoreInvestmentTypes();