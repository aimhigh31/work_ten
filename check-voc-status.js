require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkVocStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Supabase 클라이언트 생성 성공\n');

    // VOC 데이터의 status 값 조회
    console.log('📊 VOC 데이터의 status 값 확인:');
    const { data: vocData, error: vocError } = await supabase
      .from('it_voc_data')
      .select('id, no, title, status, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(11);

    if (vocError) {
      console.error('❌ VOC 데이터 조회 실패:', vocError);
      return;
    }

    console.log(`\n총 ${vocData.length}개의 VOC 데이터:`);
    vocData.forEach((row) => {
      console.log(`- ID: ${row.id}, NO: ${row.no}, Status: "${row.status}", Title: ${row.title}`);
    });

    // status 값별 개수 (클라이언트에서 집계)
    const statusCount = {};
    vocData.forEach((row) => {
      statusCount[row.status] = (statusCount[row.status] || 0) + 1;
    });

    console.log('\n📊 status 값별 개수:');
    Object.entries(statusCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`- "${status}": ${count}개`);
      });

    // 전체 VOC 데이터 조회 (11개 이상일 수 있으므로)
    const { data: allVocData, error: allVocError } = await supabase
      .from('it_voc_data')
      .select('status')
      .eq('is_active', true);

    if (!allVocError && allVocData) {
      const allStatusCount = {};
      allVocData.forEach((row) => {
        allStatusCount[row.status] = (allStatusCount[row.status] || 0) + 1;
      });

      console.log('\n📊 전체 VOC 데이터 status 값별 개수:');
      Object.entries(allStatusCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          console.log(`- "${status}": ${count}개`);
        });
    }

    // GROUP002 마스터코드 확인
    console.log('\n📋 GROUP002 (상태) 마스터코드:');
    const { data: masterCodeData, error: masterCodeError } = await supabase
      .from('it_master_code')
      .select('subcode, subcode_name, subcode_order')
      .eq('main_code', 'GROUP002')
      .order('subcode_order', { ascending: true });

    if (masterCodeError) {
      console.error('❌ 마스터코드 조회 실패:', masterCodeError);
    } else if (masterCodeData && masterCodeData.length > 0) {
      masterCodeData.forEach((row) => {
        console.log(`- ${row.subcode} → "${row.subcode_name}" (순서: ${row.subcode_order})`);
      });
    } else {
      console.log('⚠️ GROUP002 마스터코드가 없습니다.');
    }

    console.log('\n✅ 조회 완료');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkVocStatus();
