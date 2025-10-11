const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCreateHardware() {
  console.log('🔍 하드웨어 생성 테스트...');

  try {
    // 새 하드웨어 데이터 (프론트엔드에서 보내는 것과 동일한 형식)
    const hardwareData = {
      code: `HW-${new Date().getFullYear()}-TEST-${Date.now()}`,
      team: '테스트팀',
      department: 'IT',
      work_content: 'Test Hardware from Frontend',
      status: '예비',
      assignee: '테스트유저',
      start_date: new Date().toISOString().split('T')[0],
      completed_date: null,
      asset_category: '테스트',
      asset_name: 'Test Asset Frontend',
      model: 'Test Model',
      manufacturer: 'Test Manufacturer',
      vendor: 'Test Vendor',
      detail_spec: 'Test Specification',
      purchase_date: new Date().toISOString().split('T')[0],
      warranty_end_date: null,
      serial_number: 'TEST123',
      assigned_user: '테스트유저',
      location: 'Test Location',
      is_active: true,
      registration_date: new Date().toISOString().split('T')[0]
    };

    console.log('📝 전송할 데이터:', hardwareData);

    const { data, error } = await supabase
      .from('it_hardware_data')
      .insert([hardwareData])
      .select()
      .single();

    if (error) {
      console.error('❌ 생성 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
    } else {
      console.log('✅ 생성 성공:', data);
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testCreateHardware();