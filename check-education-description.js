const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEducationDescription() {
  console.log('📚 보안교육 데이터의 description 필드 확인 중...\n');

  try {
    const { data, error } = await supabase
      .from('security_education_data')
      .select('id, education_name, description, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 조회 오류:', error);
      return;
    }

    console.log(`✅ 총 ${data.length}개 데이터 조회:\n`);

    data.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}`);
      console.log(`   교육명: ${item.education_name || '(없음)'}`);
      console.log(`   설명: ${item.description ? `"${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}"` : '(없음)'}`);
      console.log(`   생성일: ${item.created_at}`);
      console.log('   ---');
    });

    // description이 null인 레코드 개수 확인
    const { count: nullCount } = await supabase
      .from('security_education_data')
      .select('*', { count: 'exact', head: true })
      .is('description', null)
      .eq('is_active', true);

    console.log(`\n📊 통계:`);
    console.log(`   - description이 비어있는 레코드: ${nullCount}개`);
    console.log(`   - description이 있는 레코드: ${data.filter(d => d.description).length}개`);

  } catch (error) {
    console.error('❌ 실행 오류:', error);
  }
}

checkEducationDescription();