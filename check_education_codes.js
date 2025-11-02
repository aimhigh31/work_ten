const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkEducationCodes() {
  console.log('\n=== 개인교육관리 테이블 코드 확인 ===');

  const { data, error } = await supabase
    .from('main_education_data')
    .select('code, title, no, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ main_education_data 오류:', error);
  } else {
    console.log('✅ main_education_data 데이터:');
    console.log(`총 ${data?.length || 0}개의 최근 데이터\n`);

    if (data && data.length > 0) {
      console.log('전체 코드 목록:');
      data.forEach(d => console.log(`  NO.${d.no} ${d.code} - ${d.title} (active: ${d.is_active})`));

      // 25년도 코드만 필터링 (정규식으로 3자리 형식만)
      const year25Pattern = /^MAIN-EDU-25-(\d{3})$/;
      const year25Codes = data.filter(c => c.code && year25Pattern.test(c.code));

      console.log(`\n25년도 올바른 형식 코드: ${year25Codes.length}개`);

      let maxSeq = 0;
      year25Codes.forEach(c => {
        const match = c.code.match(year25Pattern);
        if (match) {
          const seq = parseInt(match[1], 10);
          console.log(`  ${c.code} → 일련번호: ${seq}`);
          if (seq > maxSeq) maxSeq = seq;
        }
      });

      console.log(`\n📊 현재 최대 일련번호: ${maxSeq}`);
      const nextSeq = maxSeq + 1;
      const nextCode = `MAIN-EDU-25-${String(nextSeq).padStart(3, '0')}`;
      console.log(`✅ 다음 생성될 코드: ${nextCode}`);
    }
  }
}

checkEducationCodes();
