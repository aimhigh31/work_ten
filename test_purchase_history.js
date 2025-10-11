const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPurchaseHistory() {
  try {
    console.log('🔍 구매/유지보수이력 테스트 시작...\n');

    // 1. 테이블 확인
    console.log('1️⃣ it_software_history 테이블 확인:');
    const { data: tableTest, error: tableError } = await supabase
      .from('it_software_history')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === 'PGRST205') {
        console.log('⚠️ 테이블이 아직 스키마 캐시에 없습니다.');
        console.log('   Supabase 대시보드에서 테이블을 확인하거나 잠시 후 다시 시도해주세요.');
        return;
      }
      console.error('❌ 테이블 접근 실패:', tableError);
      return;
    }
    console.log('✅ 테이블 접근 가능');

    // 2. 유효한 software_id 가져오기
    console.log('\n2️⃣ 테스트용 소프트웨어 확인:');
    const { data: validSoftware } = await supabase
      .from('it_software_data')
      .select('id, software_name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!validSoftware) {
      console.log('❌ 활성 소프트웨어가 없습니다.');
      return;
    }

    console.log(`✅ 테스트 소프트웨어: ${validSoftware.software_name} (ID: ${validSoftware.id})`);

    // 3. 테스트 데이터 삽입
    console.log('\n3️⃣ 구매/유지보수이력 테스트 데이터 삽입:');
    const testHistories = [
      {
        software_id: validSoftware.id,
        history_type: '구매',
        purchase_date: '2024-09-01',
        supplier: '테스트 공급업체 A',
        price: 3500000,
        quantity: 5,
        contract_number: 'TEST-CONTRACT-001',
        description: '초기 라이센스 구매',
        status: '완료',
        memo: '5개 라이센스 구매 완료',
        registration_date: '2024-09-01',
        created_by: 'test',
        updated_by: 'test',
        is_active: true
      },
      {
        software_id: validSoftware.id,
        history_type: '유지보수',
        maintenance_start_date: '2024-09-01',
        maintenance_end_date: '2025-08-31',
        supplier: '유지보수 업체 B',
        price: 800000,
        contract_number: 'TEST-MAINT-001',
        description: '연간 유지보수 계약',
        status: '진행중',
        memo: '기술지원 및 업데이트 포함',
        registration_date: '2024-09-01',
        created_by: 'test',
        updated_by: 'test',
        is_active: true
      }
    ];

    const { data: insertedData, error: insertError } = await supabase
      .from('it_software_history')
      .insert(testHistories)
      .select('id, history_type, supplier');

    if (insertError) {
      console.error('❌ 삽입 실패:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      });
      return;
    }

    console.log('✅ 삽입 성공!');
    console.log('   삽입된 데이터:', insertedData);

    // 4. 조회 테스트
    console.log('\n4️⃣ 구매/유지보수이력 조회:');
    const { data: histories, error: selectError } = await supabase
      .from('it_software_history')
      .select('*')
      .eq('software_id', validSoftware.id)
      .eq('is_active', true)
      .order('purchase_date', { ascending: false });

    if (selectError) {
      console.error('❌ 조회 실패:', selectError);
    } else {
      console.log(`✅ 총 ${histories.length}개 이력 조회됨:`);
      histories.forEach(h => {
        console.log(`   - ${h.history_type}: ${h.supplier} (${h.status}) - ${h.price?.toLocaleString()}원`);
      });
    }

    // 5. 테스트 데이터 정리
    if (insertedData && insertedData.length > 0) {
      console.log('\n5️⃣ 테스트 데이터 정리:');
      const ids = insertedData.map(item => item.id);

      const { error: deleteError } = await supabase
        .from('it_software_history')
        .delete()
        .in('id', ids);

      if (deleteError) {
        console.error('⚠️ 정리 실패:', deleteError.message);
      } else {
        console.log('✅ 테스트 데이터 정리 완료');
      }
    }

    console.log('\n🎉 구매/유지보수이력 테스트 완료!');
    console.log('   이제 소프트웨어관리 페이지에서 구매/유지보수이력을 관리할 수 있습니다.');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

testPurchaseHistory();