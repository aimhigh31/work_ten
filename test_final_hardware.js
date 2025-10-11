const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFinalHardware() {
  console.log('🔍 최종 하드웨어 시스템 테스트...');

  try {
    // 1. 조회 테스트
    console.log('📝 하드웨어 데이터 조회...');
    const { data: hardwareList, error: fetchError } = await supabase
      .from('it_hardware_data')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 조회 실패:', fetchError);
      return;
    }

    console.log('✅ 조회 성공:', hardwareList?.length + '개');
    console.log('📋 하드웨어 목록:');
    hardwareList?.forEach(hw => {
      console.log(`  - ${hw.code}: ${hw.asset_name} (${hw.assignee})`);
    });

    // 2. 생성 테스트
    console.log('📝 새 하드웨어 생성 테스트...');
    const newHardware = {
      code: 'HW-25-004',
      team: '마케팅팀',
      department: 'IT',
      work_content: 'Surface Pro 9',
      status: '예비',
      assignee: '정수진',
      asset_category: '태블릿',
      asset_name: 'Microsoft Surface Pro 9',
      model: 'Surface Pro 9',
      manufacturer: 'Microsoft',
      vendor: 'Microsoft 코리아',
      detail_spec: 'Intel Core i7, 16GB RAM, 512GB SSD, Windows 11',
      purchase_date: '2025-01-25',
      warranty_end_date: '2027-01-25',
      serial_number: 'SP9004',
      assigned_user: '정수진',
      location: '마케팅실-D401',
      is_active: true,
      registration_date: new Date().toISOString().split('T')[0]
    };

    const { data: createdHw, error: createError } = await supabase
      .from('it_hardware_data')
      .insert([newHardware])
      .select()
      .single();

    if (createError) {
      console.error('❌ 생성 실패:', createError);
    } else {
      console.log('✅ 생성 성공:', createdHw.code);
    }

    // 3. 수정 테스트
    console.log('📝 하드웨어 수정 테스트...');
    const { data: updatedHw, error: updateError } = await supabase
      .from('it_hardware_data')
      .update({ status: '사용' })
      .eq('code', 'HW-25-004')
      .select()
      .single();

    if (updateError) {
      console.error('❌ 수정 실패:', updateError);
    } else {
      console.log('✅ 수정 성공:', updatedHw.code + ' 상태를 ' + updatedHw.status + '로 변경');
    }

    // 4. 최종 조회
    console.log('📝 최종 데이터 조회...');
    const { data: finalList, error: finalError } = await supabase
      .from('it_hardware_data')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ 최종 조회 실패:', finalError);
    } else {
      console.log('📊 최종 하드웨어 개수:', finalList?.length + '개');
    }

    console.log('🎉 하드웨어 시스템 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testFinalHardware();