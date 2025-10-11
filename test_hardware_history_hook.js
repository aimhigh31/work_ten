const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHardwareHistoryHook() {
  console.log('🔍 it_hardware_history 훅 테스트...');

  try {
    // 1. 연결 테스트
    console.log('\n1. Supabase 연결 테스트:');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('it_hardware_history')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('❌ 연결 실패:', connectionError);
      return;
    }
    console.log('✅ 연결 성공');

    // 2. 하드웨어 ID 1의 이력 조회
    console.log('\n2. 하드웨어 ID 1의 이력 조회:');
    const { data: histories, error: fetchError } = await supabase
      .from('it_hardware_history')
      .select('*')
      .eq('hardware_id', 1)
      .eq('is_active', true)
      .order('registration_date', { ascending: false });

    if (fetchError) {
      console.error('❌ 조회 실패:', fetchError);
      return;
    }

    console.log('✅ 조회 성공:', histories?.length || 0, '개');
    console.table(histories);

    // 3. 새 이력 생성 테스트
    console.log('\n3. 새 이력 생성 테스트:');
    const newHistoryData = {
      hardware_id: 1,
      registration_date: new Date().toISOString().split('T')[0],
      type: 'other',
      content: '테스트 이력 생성',
      vendor: '테스트 업체',
      amount: 50000,
      registrant: '테스트 사용자',
      status: 'completed',
      start_date: new Date().toISOString().split('T')[0],
      completion_date: new Date().toISOString().split('T')[0],
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    const { data: newHistory, error: createError } = await supabase
      .from('it_hardware_history')
      .insert([newHistoryData])
      .select()
      .single();

    if (createError) {
      console.error('❌ 생성 실패:', createError);
      return;
    }

    console.log('✅ 생성 성공:', newHistory);

    // 4. 생성된 이력 삭제 (정리)
    console.log('\n4. 테스트 이력 정리:');
    const { error: deleteError } = await supabase
      .from('it_hardware_history')
      .delete()
      .eq('id', newHistory.id);

    if (deleteError) {
      console.error('❌ 정리 실패:', deleteError);
    } else {
      console.log('✅ 테스트 이력 정리 완료');
    }

    // 5. 최종 데이터 변환 테스트
    console.log('\n5. 데이터 변환 테스트:');
    if (histories && histories.length > 0) {
      const sampleHistory = histories[0];
      const converted = {
        id: sampleHistory.id.toString(),
        registrationDate: sampleHistory.registration_date,
        type: sampleHistory.type,
        content: sampleHistory.content,
        vendor: sampleHistory.vendor,
        amount: sampleHistory.amount,
        registrant: sampleHistory.registrant,
        status: sampleHistory.status,
        startDate: sampleHistory.start_date,
        completionDate: sampleHistory.completion_date || ''
      };

      console.log('원본 Supabase 데이터:', sampleHistory);
      console.log('변환된 MaintenanceHistory:', converted);
      console.log('✅ 데이터 변환 성공');
    }

  } catch (error) {
    console.error('💥 테스트 실패:', error);
  }
}

// 실행
testHardwareHistoryHook()
  .then(() => {
    console.log('\n🎉 it_hardware_history 훅 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실행 실패:', error);
    process.exit(1);
  });