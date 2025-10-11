const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvestmentDescriptionSave() {
  console.log("🧪 투자 설명 저장 기능 테스트...");

  try {
    // 새로운 투자 데이터 생성 테스트
    const newInvestmentData = {
      no: 0,
      registration_date: new Date().toISOString().split('T')[0],
      code: 'PLAN-INV-25-006',
      investment_type: '주식',
      investment_name: '테스트 투자 프로젝트',
      amount: 1000000000,
      team: '투자팀',
      assignee: '김투자',
      status: '대기',
      start_date: new Date().toISOString().split('T')[0],
      completed_date: null,
      expected_return: 10.0,
      actual_return: null,
      risk_level: '보통',
      attachments: {
        description: '이것은 테스트용 투자 프로젝트 설명입니다. 새로운 기술 스타트업에 대한 투자로 높은 성장 가능성을 보이고 있습니다.',
        files: ['test_document.pdf', 'analysis_report.xlsx']
      },
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    console.log("💾 새 투자 데이터 저장 중...");
    const { data: createdInvestment, error: createError } = await supabase
      .from("plan_investment_data")
      .insert([newInvestmentData])
      .select()
      .single();

    if (createError) {
      console.log("❌ 생성 실패:", createError);
      return;
    }

    console.log("✅ 투자 데이터가 성공적으로 생성되었습니다!");
    console.log("📄 생성된 데이터 ID:", createdInvestment.id);
    console.log("📝 저장된 설명:", createdInvestment.attachments.description);
    console.log("📎 저장된 파일:", createdInvestment.attachments.files);

    // 업데이트 테스트
    const updatedDescription = '업데이트된 투자 설명입니다. 시장 분석 결과 더욱 유망한 투자처로 판단됩니다.';

    console.log("\n🔄 설명 업데이트 테스트...");
    const { error: updateError } = await supabase
      .from("plan_investment_data")
      .update({
        attachments: {
          description: updatedDescription,
          files: ['updated_document.pdf', 'new_analysis.xlsx', 'market_report.pdf']
        },
        updated_at: new Date().toISOString()
      })
      .eq("id", createdInvestment.id);

    if (updateError) {
      console.log("❌ 업데이트 실패:", updateError);
    } else {
      console.log("✅ 설명이 성공적으로 업데이트되었습니다!");

      // 업데이트 확인
      const { data: updatedData, error: fetchError } = await supabase
        .from("plan_investment_data")
        .select("attachments")
        .eq("id", createdInvestment.id)
        .single();

      if (!fetchError) {
        console.log("📝 업데이트된 설명:", updatedData.attachments.description);
        console.log("📎 업데이트된 파일:", updatedData.attachments.files);
      }
    }

  } catch (err) {
    console.error("❌ 테스트 실패:", err);
  }
}

testInvestmentDescriptionSave();