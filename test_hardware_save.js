const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testHardwareSave() {
  console.log('🔍 하드웨어 저장 테스트...');

  try {
    // 1. 현재 데이터 개수 확인
    console.log('📝 현재 하드웨어 데이터 확인...');
    const { data: beforeData, error: beforeError } = await supabase
      .from('it_hardware_data')
      .select('*')
      .eq('is_active', true);

    if (beforeError) {
      console.error('❌ 조회 실패:', beforeError);
      return;
    }

    console.log('📊 저장 전 데이터 개수:', beforeData?.length + '개');

    // 2. 테스트 데이터 생성
    console.log('📝 테스트 하드웨어 생성...');
    const testHardware = {
      code: `HW-${new Date().getFullYear()}-TEST-${Date.now()}`,
      team: '테스트팀',
      department: 'IT',
      work_content: 'Test Hardware Item',
      status: '예비',
      assignee: '테스트유저',
      start_date: new Date().toISOString().split('T')[0],
      asset_category: '테스트',
      asset_name: 'Test Asset',
      model: 'Test Model',
      manufacturer: 'Test Manufacturer',
      vendor: 'Test Vendor',
      detail_spec: 'Test Specification',
      is_active: true,
      registration_date: new Date().toISOString().split('T')[0]
    };

    const { data: createdData, error: createError } = await supabase
      .from('it_hardware_data')
      .insert([testHardware])
      .select()
      .single();

    if (createError) {
      console.error('❌ 생성 실패:', createError);
      return;
    }

    console.log('✅ 테스트 데이터 생성 성공:', createdData.code);

    // 3. 생성 후 데이터 개수 확인
    console.log('📝 저장 후 하드웨어 데이터 확인...');
    const { data: afterData, error: afterError } = await supabase
      .from('it_hardware_data')
      .select('*')
      .eq('is_active', true);

    if (afterError) {
      console.error('❌ 조회 실패:', afterError);
      return;
    }

    console.log('📊 저장 후 데이터 개수:', afterData?.length + '개');
    console.log('✅ 데이터 증가:', (afterData?.length - beforeData?.length) + '개');

    // 4. 업데이트 테스트
    console.log('📝 데이터 업데이트 테스트...');
    const { data: updateData, error: updateError } = await supabase
      .from('it_hardware_data')
      .update({ status: '사용' })
      .eq('id', createdData.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
    } else {
      console.log('✅ 업데이트 성공: 상태를', updateData.status + '로 변경');
    }

    console.log('🎉 하드웨어 저장 테스트 완료!');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testHardwareSave();