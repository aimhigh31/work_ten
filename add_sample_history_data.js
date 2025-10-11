const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleHistoryData() {
  try {
    console.log('📝 it_software_history 샘플 데이터 추가 중...\n');

    // 1. 유효한 software_id 가져오기
    console.log('1️⃣ 활성 소프트웨어 목록 확인:');
    const { data: softwareList, error: softwareError } = await supabase
      .from('it_software_data')
      .select('id, software_name')
      .eq('is_active', true)
      .limit(3);

    if (softwareError) {
      console.error('❌ 소프트웨어 목록 조회 실패:', softwareError);
      return;
    }

    if (!softwareList || softwareList.length === 0) {
      console.log('⚠️ 활성 소프트웨어가 없습니다. 먼저 소프트웨어를 추가해주세요.');
      return;
    }

    console.log('✅ 사용 가능한 소프트웨어:');
    softwareList.forEach(sw => {
      console.log(`   - ID: ${sw.id}, 이름: ${sw.software_name}`);
    });

    // 2. 각 소프트웨어별로 샘플 이력 생성
    console.log('\n2️⃣ 샘플 이력 데이터 생성:');

    const allSampleData = [];

    for (let i = 0; i < softwareList.length; i++) {
      const software = softwareList[i];

      // 각 소프트웨어별로 2-3개의 이력 생성
      const sampleHistories = [
        {
          software_id: software.id,
          history_type: '구매',
          purchase_date: `2024-0${(i % 3) + 1}-15`,
          supplier: `${software.software_name.split(' ')[0]} 공급업체`,
          price: (i + 1) * 1200000,
          quantity: (i + 1) * 5,
          contract_number: `CONTRACT-2024-00${i + 1}`,
          description: `${software.software_name} 라이선스 구매`,
          status: i === 0 ? '완료' : '진행중',
          memo: `${(i + 1) * 5}개 라이선스 구매`,
          registration_date: `2024-0${(i % 3) + 1}-15`,
          created_by: 'sample_script',
          updated_by: 'sample_script',
          is_active: true
        },
        {
          software_id: software.id,
          history_type: '유지보수',
          purchase_date: `2024-0${(i % 3) + 2}-01`,
          supplier: `${software.software_name.split(' ')[0]} 기술지원팀`,
          price: (i + 1) * 800000,
          quantity: 1,
          contract_number: `MAINT-2024-00${i + 1}`,
          description: `${software.software_name} 연간 유지보수`,
          status: '진행중',
          memo: '24시간 기술지원 및 업데이트 포함',
          registration_date: `2024-0${(i % 3) + 2}-01`,
          created_by: 'sample_script',
          updated_by: 'sample_script',
          is_active: true
        }
      ];

      // 마지막 소프트웨어에는 업그레이드 이력도 추가
      if (i === softwareList.length - 1) {
        sampleHistories.push({
          software_id: software.id,
          history_type: '업그레이드',
          purchase_date: '2024-09-01',
          supplier: `${software.software_name.split(' ')[0]} 업그레이드센터`,
          price: 500000,
          quantity: 1,
          contract_number: 'UPGRADE-2024-001',
          description: `${software.software_name} 프리미엄 업그레이드`,
          status: '완료',
          memo: '최신 기능 및 보안 업데이트',
          registration_date: '2024-09-01',
          created_by: 'sample_script',
          updated_by: 'sample_script',
          is_active: true
        });
      }

      allSampleData.push(...sampleHistories);
    }

    console.log(`   생성된 샘플 데이터: ${allSampleData.length}개`);

    // 3. 데이터 삽입
    console.log('\n3️⃣ 데이터베이스에 삽입 중...');

    const { data: insertedData, error: insertError } = await supabase
      .from('it_software_history')
      .insert(allSampleData)
      .select('id, history_type, supplier, software_id');

    if (insertError) {
      console.error('❌ 삽입 실패:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      });
      return;
    }

    console.log('✅ 삽입 성공!');
    console.log(`   삽입된 데이터: ${insertedData.length}개`);

    // 4. 삽입된 데이터 확인
    console.log('\n4️⃣ 삽입된 데이터 확인:');
    insertedData.forEach(item => {
      console.log(`   - ID: ${item.id}, 타입: ${item.history_type}, 업체: ${item.supplier}, 소프트웨어 ID: ${item.software_id}`);
    });

    // 5. 각 소프트웨어별 이력 개수 확인
    console.log('\n5️⃣ 소프트웨어별 이력 개수:');
    for (const software of softwareList) {
      const { count } = await supabase
        .from('it_software_history')
        .select('*', { count: 'exact', head: true })
        .eq('software_id', software.id)
        .eq('is_active', true);

      console.log(`   - ${software.software_name}: ${count || 0}개 이력`);
    }

    console.log('\n🎉 샘플 데이터 추가 완료!');
    console.log('   이제 소프트웨어관리 페이지에서 구매/유지보수이력을 확인할 수 있습니다.');
    console.log('   편집 모드로 소프트웨어를 열어보세요!');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

addSampleHistoryData();