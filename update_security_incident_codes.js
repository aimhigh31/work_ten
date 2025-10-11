const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSecurityIncidentCodes() {
  try {
    console.log('🔍 보안사고 코드 조회 중...');

    // 모든 보안사고 데이터 조회
    const { data: incidents, error: fetchError } = await supabase
      .from('security_accident_data')
      .select('id, code')
      .order('id', { ascending: true });

    if (fetchError) {
      console.error('❌ 조회 실패:', fetchError);
      return;
    }

    console.log(`📊 전체 보안사고 수: ${incidents.length}`);

    let updateCount = 0;

    for (const incident of incidents) {
      // SECACC-XX-XXX 형식을 SEC-ACC-XX-XXX로 변경
      if (incident.code && incident.code.startsWith('SECACC-')) {
        const newCode = incident.code.replace('SECACC-', 'SEC-ACC-');

        console.log(`🔄 ID ${incident.id}: ${incident.code} → ${newCode}`);

        const { error: updateError } = await supabase
          .from('security_accident_data')
          .update({ code: newCode })
          .eq('id', incident.id);

        if (updateError) {
          console.error(`❌ ID ${incident.id} 업데이트 실패:`, updateError);
        } else {
          updateCount++;
        }
      }
    }

    console.log(`\n✅ 업데이트 완료: ${updateCount}개 코드 변경됨`);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateSecurityIncidentCodes();
