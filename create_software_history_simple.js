const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSoftwareHistorySimple() {
  try {
    console.log('🔨 it_software_history 테이블 생성 (간단 버전)...\n');

    // 단계별로 SQL 실행
    console.log('1️⃣ 기본 테이블 생성...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.it_software_history (
        id SERIAL PRIMARY KEY,
        software_id INTEGER NOT NULL,
        history_type VARCHAR(50) DEFAULT '구매',
        purchase_date DATE,
        supplier VARCHAR(200),
        price DECIMAL(12, 2),
        quantity INTEGER DEFAULT 1,
        contract_number VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT '진행중',
        memo TEXT,
        registration_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );
    `;

    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });

    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError.message);
      return;
    }
    console.log('✅ 테이블 생성 완료');

    console.log('\n2️⃣ 인덱스 생성...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_software_history_software_id ON public.it_software_history(software_id);
      CREATE INDEX IF NOT EXISTS idx_software_history_active ON public.it_software_history(is_active);
    `;

    const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL });

    if (indexError) {
      console.warn('⚠️ 인덱스 생성 실패:', indexError.message);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }

    console.log('\n3️⃣ 권한 설정...');
    const permissionSQL = `
      GRANT ALL ON public.it_software_history TO anon, authenticated;
      GRANT USAGE, SELECT ON SEQUENCE public.it_software_history_id_seq TO anon, authenticated;
    `;

    const { error: permError } = await supabase.rpc('exec', { sql: permissionSQL });

    if (permError) {
      console.warn('⚠️ 권한 설정 실패:', permError.message);
    } else {
      console.log('✅ 권한 설정 완료');
    }

    // 잠시 대기 후 테이블 확인
    console.log('\n4️⃣ 테이블 확인 (3초 대기 후)...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: testData, error: testError } = await supabase
      .from('it_software_history')
      .select('*')
      .limit(1);

    if (testError) {
      if (testError.code === 'PGRST205') {
        console.log('⚠️ 테이블이 아직 스키마 캐시에 반영되지 않았습니다.');
        console.log('   몇 분 후에 다시 시도하거나 Supabase 대시보드를 확인해주세요.');
      } else {
        console.error('❌ 테이블 확인 실패:', testError.message);
      }
    } else {
      console.log('✅ 테이블 접근 가능!');

      // 샘플 데이터 삽입 시도
      console.log('\n5️⃣ 샘플 데이터 삽입 시도...');

      // 유효한 software_id 찾기
      const { data: softwareData } = await supabase
        .from('it_software_data')
        .select('id, software_name')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (softwareData) {
        const sampleHistory = {
          software_id: softwareData.id,
          history_type: '구매',
          purchase_date: '2024-09-26',
          supplier: '테스트 공급업체',
          price: 1000000,
          quantity: 1,
          contract_number: 'TEST-001',
          description: '테스트 구매 이력',
          status: '완료',
          memo: '테스트용 데이터입니다',
          registration_date: '2024-09-26',
          created_by: 'script',
          updated_by: 'script',
          is_active: true
        };

        const { data: insertData, error: insertError } = await supabase
          .from('it_software_history')
          .insert([sampleHistory])
          .select();

        if (insertError) {
          console.error('❌ 샘플 데이터 삽입 실패:', insertError.message);
        } else {
          console.log('✅ 샘플 데이터 삽입 성공!');
          console.log('   삽입된 데이터 ID:', insertData[0].id);
        }
      }
    }

    console.log('\n🎉 it_software_history 테이블 설정 완료!');
    console.log('');
    console.log('📋 다음 단계:');
    console.log('   1. Supabase 대시보드에서 테이블이 생성되었는지 확인');
    console.log('   2. 소프트웨어관리 페이지에서 구매/유지보수이력 테스트');
    console.log('   3. 몇 분 후 스키마 캐시가 업데이트되면 정상 작동');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
createSoftwareHistorySimple();