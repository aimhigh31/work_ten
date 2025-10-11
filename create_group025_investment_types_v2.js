const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createGroup025InvestmentTypes() {
  console.log("🚀 GROUP025 투자유형 마스터코드 생성...");

  try {
    // 먼저 GROUP025가 있는지 확인
    const { data: existingGroup, error: checkError } = await supabase
      .from("admin_mastercode_data")
      .select("*")
      .eq("group_code", "GROUP025")
      .eq("codetype", "group")
      .single();

    if (existingGroup) {
      console.log("✅ GROUP025가 이미 존재합니다.");

      // 서브코드 확인
      const { data: subcodes, error: subError } = await supabase
        .from("admin_mastercode_data")
        .select("*")
        .eq("group_code", "GROUP025")
        .eq("codetype", "subcode")
        .order("subcode_order", { ascending: true });

      if (subcodes && subcodes.length > 0) {
        console.log(`📄 ${subcodes.length}개의 투자유형이 이미 존재합니다:`);
        subcodes.forEach(sub => {
          console.log(`  - ${sub.subcode}: ${sub.subcode_name}`);
        });
        return;
      }
    } else {
      // 그룹 순서 계산
      const { data: allGroups, error: groupOrderError } = await supabase
        .from("admin_mastercode_data")
        .select("group_code_order")
        .eq("codetype", "group")
        .order("group_code_order", { ascending: false })
        .limit(1);

      const nextGroupOrder = allGroups && allGroups.length > 0
        ? (allGroups[0].group_code_order || 0) + 1
        : 1;

      // GROUP025 메인 그룹 생성
      console.log("📝 GROUP025 메인 그룹 생성 중...");

      const mainGroup = {
        group_code: "GROUP025",
        group_code_name: "투자유형",
        group_code_description: "투자 관리 시스템의 투자유형 목록",
        group_code_order: nextGroupOrder,
        codetype: "group",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: createMainError } = await supabase
        .from("admin_mastercode_data")
        .insert([mainGroup]);

      if (createMainError) {
        console.log("❌ 메인 그룹 생성 실패:", createMainError);
        return;
      }
      console.log("✅ GROUP025 메인 그룹 생성 완료!");
    }

    // 투자유형 서브코드 데이터
    const investmentTypes = [
      { subcode: "GROUP025_001", name: "주식", description: "상장 기업의 지분 투자" },
      { subcode: "GROUP025_002", name: "채권", description: "국채, 회사채 등 채권 투자" },
      { subcode: "GROUP025_003", name: "펀드", description: "뮤추얼 펀드, ETF 등 간접 투자" },
      { subcode: "GROUP025_004", name: "부동산", description: "부동산 직접 투자 및 REITs" },
      { subcode: "GROUP025_005", name: "원자재", description: "금, 원유, 농산물 등 상품 투자" },
      { subcode: "GROUP025_006", name: "파생상품", description: "선물, 옵션 등 파생 금융상품" },
      { subcode: "GROUP025_007", name: "사모펀드", description: "비상장 기업 투자 및 PE" },
      { subcode: "GROUP025_008", name: "헤지펀드", description: "절대수익 추구형 헤지펀드" },
      { subcode: "GROUP025_009", name: "암호화폐", description: "비트코인 등 디지털 자산" },
      { subcode: "GROUP025_010", name: "인프라", description: "사회간접자본 및 인프라 투자" },
      { subcode: "GROUP025_011", name: "벤처투자", description: "스타트업 및 벤처기업 투자" },
      { subcode: "GROUP025_012", name: "기타", description: "기타 대체 투자" }
    ];

    console.log(`📝 ${investmentTypes.length}개의 투자유형 서브코드 생성 중...`);

    const subcodes = investmentTypes.map((type, index) => ({
      group_code: "GROUP025",
      group_code_name: "투자유형",
      subcode: type.subcode,
      subcode_name: type.name,
      subcode_description: type.description,
      subcode_order: index + 1,
      codetype: "subcode",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from("admin_mastercode_data")
      .insert(subcodes);

    if (insertError) {
      console.log("❌ 서브코드 생성 실패:", insertError);
      return;
    }

    console.log("✅ 모든 투자유형 서브코드가 성공적으로 생성되었습니다!");

    // 생성된 데이터 확인
    const { data: createdSubcodes, error: verifyError } = await supabase
      .from("admin_mastercode_data")
      .select("*")
      .eq("group_code", "GROUP025")
      .eq("codetype", "subcode")
      .order("subcode_order", { ascending: true });

    if (!verifyError && createdSubcodes) {
      console.log("\n📄 생성된 투자유형 목록:");
      createdSubcodes.forEach(sub => {
        console.log(`  ${sub.subcode_order}. ${sub.subcode_name} (${sub.subcode})`);
      });
    }

  } catch (err) {
    console.error("❌ 실행 실패:", err);
  }
}

createGroup025InvestmentTypes();