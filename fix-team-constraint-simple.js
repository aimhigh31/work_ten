const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTeamConstraint() {
  try {
    console.log('🔧 팀 제약조건 수정 시작...');

    // 1. 현재 체크리스트 데이터의 팀 값들 확인
    const { data: existingData, error: dataError } = await supabase
      .from('admin_checklist_data')
      .select('id, team');

    if (dataError) {
      console.error('기존 데이터 조회 오류:', dataError);
      return;
    }

    console.log('📊 기존 체크리스트 데이터의 팀 값들:');
    const uniqueTeams = [...new Set(existingData.map(item => item.team).filter(Boolean))];
    uniqueTeams.forEach(team => {
      console.log(`- "${team}"`);
    });

    // 2. 사용자 프로파일에서 사용되는 부서들 확인 (임시)
    const { data: userProfiles, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select('department')
      .not('department', 'is', null);

    if (!userError && userProfiles) {
      console.log('👥 사용자 프로파일의 부서들:');
      const userDepartments = [...new Set(userProfiles.map(u => u.department).filter(Boolean))];
      userDepartments.forEach(dept => {
        console.log(`- "${dept}"`);
      });
    }

    console.log('✨ 제약조건을 제거하고 모든 팀 값을 허용하도록 변경합니다...');

    // 제약조건을 일시적으로 완전히 제거하는 방법으로 접근
    // API를 통해 직접 제약조건을 수정하는 것은 제한적이므로,
    // 대신 API 레벨에서 검증하도록 변경하겠습니다.

    console.log('📝 다음 단계:');
    console.log('1. Supabase 대시보드에서 SQL Editor를 사용하여 다음 명령 실행:');
    console.log('   ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_team;');
    console.log('');
    console.log('2. 또는 제약조건을 더 유연하게 변경:');
    console.log('   ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_team;');
    console.log('   ALTER TABLE admin_checklist_data ADD CONSTRAINT chk_team_flexible CHECK (team IS NOT NULL);');
    console.log('');
    console.log('3. API 레벨에서 팀 검증을 처리하도록 수정합니다.');

  } catch (error) {
    console.error('💥 오류 발생:', error);
  }
}

fixTeamConstraint();