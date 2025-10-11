const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInvestmentCodes() {
  console.log("🔄 투자관리 코드를 PLAN-INV-YY-XXX 형식으로 업데이트...");

  try {
    // 현재 데이터 조회
    const { data: investments, error: fetchError } = await supabase
      .from("plan_investment_data")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (fetchError) {
      console.log("❌ 데이터 조회 실패:", fetchError);
      return;
    }

    console.log(`📄 총 ${investments.length}개의 투자 데이터를 찾았습니다.`);

    // 각 투자 항목의 코드를 PLAN-INV 형식으로 업데이트
    for (const investment of investments) {
      const oldCode = investment.code;

      // 기존 코드가 이미 PLAN-INV로 시작하면 건너뜀
      if (oldCode && oldCode.startsWith('PLAN-INV')) {
        console.log(`⏭️  ID ${investment.id}: 이미 PLAN-INV 형식입니다 (${oldCode})`);
        continue;
      }

      // 새 코드 생성
      let newCode;
      if (oldCode && oldCode.startsWith('INV-')) {
        // INV-25-001 → PLAN-INV-25-001 형식으로 변환
        newCode = 'PLAN-' + oldCode;
      } else {
        // 코드가 없거나 다른 형식인 경우 새로 생성
        const year = new Date(investment.registration_date).getFullYear().toString().slice(-2);
        newCode = `PLAN-INV-${year}-${String(investment.id).padStart(3, '0')}`;
      }

      // 코드 업데이트
      const { error: updateError } = await supabase
        .from("plan_investment_data")
        .update({
          code: newCode,
          updated_at: new Date().toISOString()
        })
        .eq("id", investment.id);

      if (updateError) {
        console.log(`❌ ID ${investment.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ ID ${investment.id}: ${oldCode || '없음'} → ${newCode}`);
      }
    }

    console.log("🎉 모든 투자 코드 업데이트 완료!");

  } catch (err) {
    console.error("❌ 업데이트 실패:", err);
  }
}

updateInvestmentCodes();