const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addVocCodeColumn() {
  console.log('\n=== VOC 테이블에 code 컬럼 추가 ===');

  try {
    // 1. code 컬럼 추가 (이미 있으면 무시)
    const { data: alterData, error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE it_voc_data
        ADD COLUMN IF NOT EXISTS code VARCHAR(50);
      `
    });

    if (alterError) {
      console.log('⚠️ RPC로 컬럼 추가 실패 (권한 문제일 수 있음)');
      console.log('대신 수동으로 Supabase SQL Editor에서 실행해주세요:');
      console.log(`
ALTER TABLE it_voc_data
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 기존 데이터에 코드 추가
UPDATE it_voc_data
SET code = CONCAT('IT-VOC-', TO_CHAR(EXTRACT(YEAR FROM created_at), 'FM00'), '-', LPAD(ROW_NUMBER() OVER (PARTITION BY EXTRACT(YEAR FROM created_at) ORDER BY id)::TEXT, 3, '0'))
WHERE code IS NULL;
      `);
      return;
    }

    console.log('✅ code 컬럼 추가 완료');

    // 2. 기존 데이터 확인
    const { data: existingData, error: checkError } = await supabase
      .from('it_voc_data')
      .select('id, created_at, code')
      .order('id', { ascending: true });

    if (checkError) {
      console.error('❌ 기존 데이터 조회 오류:', checkError);
      return;
    }

    console.log(`\n📊 총 ${existingData.length}개의 VOC 데이터 발견`);

    // 3. 연도별로 그룹화하여 코드 생성
    const vocsByYear = {};
    existingData.forEach(voc => {
      const year = new Date(voc.created_at).getFullYear();
      if (!vocsByYear[year]) {
        vocsByYear[year] = [];
      }
      vocsByYear[year].push(voc);
    });

    // 4. 각 연도별로 순차적 코드 할당
    for (const year in vocsByYear) {
      const yearStr = year.toString().slice(-2);
      const vocs = vocsByYear[year];

      console.log(`\n📅 ${year}년 데이터: ${vocs.length}개`);

      for (let i = 0; i < vocs.length; i++) {
        const voc = vocs[i];
        const sequence = (i + 1).toString().padStart(3, '0');
        const newCode = `IT-VOC-${yearStr}-${sequence}`;

        // code가 없는 경우만 업데이트
        if (!voc.code) {
          const { error: updateError } = await supabase
            .from('it_voc_data')
            .update({ code: newCode })
            .eq('id', voc.id);

          if (updateError) {
            console.error(`❌ ID ${voc.id} 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ ID ${voc.id}: ${newCode}`);
          }
        }
      }
    }

    // 5. 결과 확인
    console.log('\n=== 최종 결과 확인 ===');
    const { data: finalData, error: finalError } = await supabase
      .from('it_voc_data')
      .select('id, code, created_at')
      .order('code', { ascending: true })
      .limit(10);

    if (finalError) {
      console.error('❌ 최종 데이터 조회 오류:', finalError);
    } else {
      console.log('\n✅ 생성된 코드 샘플 (최신 10개):');
      finalData.forEach(voc => {
        console.log(`  ${voc.code} (ID: ${voc.id})`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addVocCodeColumn();
