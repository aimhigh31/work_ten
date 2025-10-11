const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDescriptionInAttachments() {
  console.log("🧪 attachments에 description 저장 테스트...");

  try {
    // 첫 번째 투자 데이터에 description을 attachments JSON에 포함해서 업데이트
    const testDescription = "AI 기술을 활용한 스타트업들을 대상으로 한 벤처 펀드 투자입니다. 딥러닝, 자연어처리, 컴퓨터 비전 등 다양한 AI 분야의 유망한 기업들에 분산 투자하여 높은 수익률을 기대하고 있습니다.";

    // 기존 데이터 조회
    const { data: investment, error: fetchError } = await supabase
      .from("plan_investment_data")
      .select("*")
      .eq("id", 1)
      .single();

    if (fetchError) {
      console.log("❌ 데이터 조회 실패:", fetchError);
      return;
    }

    console.log("📄 기존 attachments:", investment.attachments);

    // attachments에 description 정보 추가
    const newAttachments = {
      description: testDescription,
      files: investment.attachments || []
    };

    // 업데이트
    const { error: updateError } = await supabase
      .from("plan_investment_data")
      .update({
        attachments: newAttachments,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1);

    if (updateError) {
      console.log("❌ 업데이트 실패:", updateError);
    } else {
      console.log("✅ description이 attachments에 성공적으로 저장되었습니다!");

      // 업데이트된 데이터 확인
      const { data: updatedInvestment, error: verifyError } = await supabase
        .from("plan_investment_data")
        .select("attachments")
        .eq("id", 1)
        .single();

      if (!verifyError) {
        console.log("📄 업데이트된 attachments:", updatedInvestment.attachments);
      }
    }

  } catch (err) {
    console.error("❌ 테스트 실패:", err);
  }
}

testDescriptionInAttachments();