const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateGroup002() {
  console.log("🔍 GROUP002 확인 및 상태 설정...");

  try {
    // GROUP002 그룹 확인
    const { data: group002, error: groupError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'group');

    if (groupError) {
      console.log("❌ 그룹 조회 오류:", groupError);
      return;
    }

    if (!group002 || group002.length === 0) {
      console.log("📝 GROUP002 그룹이 없습니다. 생성합니다...");

      // GROUP002 그룹 생성
      const { data: newGroup, error: createGroupError } = await supabase
        .from('admin_mastercode_data')
        .insert([{
          codetype: 'group',
          group_code: 'GROUP002',
          group_code_name: '상태',
          group_code_description: 'VOC 관리 시스템에서 사용하는 상태 분류',
          group_code_status: 'active',
          group_code_order: 2,
          subcode: '',
          subcode_name: '',
          subcode_description: '',
          subcode_status: 'active',
          subcode_remark: '',
          subcode_order: 0,
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        }])
        .select();

      if (createGroupError) {
        console.log("❌ 그룹 생성 오류:", createGroupError);
        return;
      }

      console.log("✅ GROUP002 그룹 생성 완료:", newGroup);
    } else {
      console.log("✅ GROUP002 그룹이 이미 존재합니다:", group002[0]);
    }

    // GROUP002의 서브코드 확인
    const { data: subCodes, error: subCodeError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'subcode')
      .order('subcode_order', { ascending: true });

    if (subCodeError) {
      console.log("❌ 서브코드 조회 오류:", subCodeError);
      return;
    }

    console.log(`📊 GROUP002 서브코드 ${subCodes?.length || 0}개 발견`);

    if (!subCodes || subCodes.length === 0) {
      console.log("📝 GROUP002 서브코드가 없습니다. 상태를 생성합니다...");

      // 상태 서브코드들 생성
      const statuses = [
        { name: '접수', description: '새로 접수된 VOC', order: 1 },
        { name: '처리중', description: '현재 처리가 진행 중인 VOC', order: 2 },
        { name: '대기', description: '처리 대기 중인 VOC', order: 3 },
        { name: '완료', description: '처리가 완료된 VOC', order: 4 },
        { name: '보류', description: '일시적으로 보류된 VOC', order: 5 }
      ];

      for (const status of statuses) {
        const subCodeData = {
          codetype: 'subcode',
          group_code: 'GROUP002',
          group_code_name: '상태',
          group_code_description: 'VOC 관리 시스템에서 사용하는 상태 분류',
          group_code_status: 'active',
          group_code_order: 2,
          subcode: `GROUP002-SUB${status.order.toString().padStart(3, '0')}`,
          subcode_name: status.name,
          subcode_description: status.description,
          subcode_status: 'active',
          subcode_remark: '',
          subcode_order: status.order,
          is_active: true,
          created_by: 'system',
          updated_by: 'system'
        };

        const { data: newSubCode, error: createSubCodeError } = await supabase
          .from('admin_mastercode_data')
          .insert([subCodeData])
          .select();

        if (createSubCodeError) {
          console.log(`❌ ${status.name} 서브코드 생성 오류:`, createSubCodeError);
        } else {
          console.log(`✅ ${status.name} 서브코드 생성 완료`);
        }
      }
    } else {
      console.log("📋 기존 GROUP002 서브코드 목록:");
      subCodes.forEach((subCode, index) => {
        console.log(`  ${index + 1}. ${subCode.subcode_name} (${subCode.subcode}) - ${subCode.subcode_description}`);
      });
    }

    // 최종 확인
    const { data: finalSubCodes, error: finalError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'subcode')
      .order('subcode_order', { ascending: true });

    if (finalError) {
      console.log("❌ 최종 확인 오류:", finalError);
    } else {
      console.log(`🎉 GROUP002 상태 설정 완료! 총 ${finalSubCodes?.length || 0}개 상태:`);
      finalSubCodes?.forEach((subCode, index) => {
        console.log(`  ${index + 1}. ${subCode.subcode_name}: ${subCode.subcode_description}`);
      });
    }

  } catch (err) {
    console.error("❌ 오류 발생:", err);
  }
}

checkAndCreateGroup002();