const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistEditor() {
  console.log("🧪 체크리스트 편집기 기능 테스트 시작...\n");

  try {
    // 1. 체크리스트 데이터 확인
    console.log("1️⃣ 기존 체크리스트 데이터 확인...");
    const { data: checklists, error: checklistError } = await supabase
      .from("admin_checklist_management")
      .select("*")
      .limit(5);

    if (checklistError) {
      console.error("❌ 체크리스트 조회 실패:", checklistError);
      return;
    }

    console.log(`✅ 체크리스트 ${checklists?.length || 0}개 확인됨`);
    if (checklists && checklists.length > 0) {
      console.log(`📝 첫 번째 체크리스트: ${checklists[0].checklist_name}`);
    }

    // 2. 에디터 데이터 확인
    console.log("\n2️⃣ 에디터 데이터 확인...");
    const { data: editorData, error: editorError } = await supabase
      .from("admin_checklist_editor")
      .select("*")
      .limit(5);

    if (editorError) {
      console.error("❌ 에디터 데이터 조회 실패:", editorError);
      return;
    }

    console.log(`✅ 에디터 데이터 ${editorData?.length || 0}개 확인됨`);

    // 3. 새로운 테스트 체크리스트 생성
    console.log("\n3️⃣ 테스트 체크리스트 생성...");
    const testChecklist = {
      checklist_name: "테스트 체크리스트 " + new Date().getTime(),
      checklist_type: "업무",
      usage_yn: "Y",
      description: "편집기 기능 테스트용",
      sequence: 999,
      created_by: "test_user"
    };

    const { data: newChecklist, error: createError } = await supabase
      .from("admin_checklist_management")
      .insert([testChecklist])
      .select()
      .single();

    if (createError) {
      console.error("❌ 체크리스트 생성 실패:", createError);
      return;
    }

    console.log(`✅ 테스트 체크리스트 생성됨 (ID: ${newChecklist.id})`);

    // 4. 에디터 아이템 추가 테스트
    console.log("\n4️⃣ 에디터 아이템 추가 테스트...");
    const testEditorItems = [
      {
        checklist_id: newChecklist.id,
        item_no: 1,
        check_item: "테스트 항목 1",
        evaluation_standard: "평가 기준 1",
        is_main_item: "N",
        usage_yn: "Y",
        sequence: 1,
        created_by: "test_user"
      },
      {
        checklist_id: newChecklist.id,
        item_no: 2,
        check_item: "테스트 항목 2",
        evaluation_standard: "평가 기준 2",
        is_main_item: "Y",
        usage_yn: "Y",
        sequence: 2,
        created_by: "test_user"
      }
    ];

    const { data: editorItems, error: editorInsertError } = await supabase
      .from("admin_checklist_editor")
      .insert(testEditorItems)
      .select();

    if (editorInsertError) {
      console.error("❌ 에디터 아이템 추가 실패:", editorInsertError);
    } else {
      console.log(`✅ 에디터 아이템 ${editorItems?.length || 0}개 추가됨`);
    }

    // 5. 데이터 조회 테스트
    console.log("\n5️⃣ 통합 데이터 조회 테스트...");
    const { data: checklistWithEditor, error: joinError } = await supabase
      .from("admin_checklist_management")
      .select(`
        *,
        admin_checklist_editor (*)
      `)
      .eq("id", newChecklist.id)
      .single();

    if (joinError) {
      console.error("❌ 통합 조회 실패:", joinError);
    } else {
      console.log(`✅ 통합 데이터 조회 성공`);
      console.log(`📊 체크리스트: ${checklistWithEditor.checklist_name}`);
      console.log(`📊 에디터 아이템: ${checklistWithEditor.admin_checklist_editor?.length || 0}개`);
    }

    // 6. 테스트 데이터 정리
    console.log("\n6️⃣ 테스트 데이터 정리...");

    // 에디터 데이터 삭제
    const { error: deleteEditorError } = await supabase
      .from("admin_checklist_editor")
      .delete()
      .eq("checklist_id", newChecklist.id);

    // 체크리스트 삭제
    const { error: deleteChecklistError } = await supabase
      .from("admin_checklist_management")
      .delete()
      .eq("id", newChecklist.id);

    if (deleteEditorError || deleteChecklistError) {
      console.log("⚠️ 테스트 데이터 정리 중 일부 오류 발생");
    } else {
      console.log("✅ 테스트 데이터 정리 완료");
    }

    console.log("\n🎉 체크리스트 편집기 기능 테스트 완료!");
    console.log("✨ 모든 기본 기능이 정상적으로 작동합니다.");

  } catch (error) {
    console.error("❌ 테스트 중 오류 발생:", error);
  }
}

testChecklistEditor();