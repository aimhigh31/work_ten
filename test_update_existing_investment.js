const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdateExistingInvestment() {
  console.log("🧪 기존 투자 데이터에 설명 추가 테스트...");

  try {
    // 기존 데이터 조회
    const { data: investments, error: fetchError } = await supabase
      .from("plan_investment_data")
      .select("*")
      .eq("is_active", true)
      .limit(3);

    if (fetchError) {
      console.log("❌ 데이터 조회 실패:", fetchError);
      return;
    }

    console.log(`📄 총 ${investments.length}개의 투자 데이터를 찾았습니다.`);

    // 각 투자에 설명 추가
    for (let i = 0; i < investments.length; i++) {
      const investment = investments[i];

      const descriptions = [
        'AI 기술을 활용한 스타트업들을 대상으로 한 벤처 펀드 투자입니다. 딥러닝, 자연어처리, 컴퓨터 비전 등 다양한 AI 분야의 유망한 기업들에 분산 투자하여 높은 수익률을 기대하고 있습니다.',
        '부동산 투자신탁(REITs)에 대한 투자로 안정적인 임대수익과 자본 증식을 목표로 합니다. 상업용 부동산, 주거용 부동산, 물류센터 등 다양한 포트폴리오로 구성되어 있습니다.',
        '국내외 우량 기업 채권에 대한 투자입니다. 신용등급 AA 이상의 안전한 채권들로 구성되어 있으며, 안정적인 이자수익을 통해 포트폴리오의 리스크를 분산시키는 역할을 합니다.'
      ];

      const description = descriptions[i] || `투자 ID ${investment.id}에 대한 상세 설명입니다.`;

      // 기존 attachments가 배열이면 객체로 변환
      let currentAttachments = investment.attachments || [];
      let filesArray = [];

      if (Array.isArray(currentAttachments)) {
        filesArray = currentAttachments;
      } else if (currentAttachments.files) {
        filesArray = currentAttachments.files;
      }

      const newAttachments = {
        description: description,
        files: filesArray
      };

      console.log(`🔄 ID ${investment.id} 업데이트 중...`);
      const { error: updateError } = await supabase
        .from("plan_investment_data")
        .update({
          attachments: newAttachments,
          updated_at: new Date().toISOString()
        })
        .eq("id", investment.id);

      if (updateError) {
        console.log(`❌ ID ${investment.id} 업데이트 실패:`, updateError);
      } else {
        console.log(`✅ ID ${investment.id}: 설명이 성공적으로 추가되었습니다.`);
      }
    }

    console.log("\n🎉 모든 투자 데이터에 설명이 추가되었습니다!");

    // 업데이트된 데이터 확인
    console.log("\n📄 업데이트 결과 확인:");
    const { data: updatedInvestments, error: verifyError } = await supabase
      .from("plan_investment_data")
      .select("id, investment_name, attachments")
      .eq("is_active", true)
      .limit(3);

    if (!verifyError) {
      updatedInvestments.forEach(inv => {
        console.log(`ID ${inv.id} (${inv.investment_name}): ${inv.attachments?.description?.substring(0, 50)}...`);
      });
    }

  } catch (err) {
    console.error("❌ 테스트 실패:", err);
  }
}

testUpdateExistingInvestment();