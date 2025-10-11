const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTeamConstraint() {
  try {
    console.log('🔧 팀 제약조건 수정 시작...');

    // 1. 현재 제약조건 확인
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT conname, pg_get_constraintdef(c.oid) as definition
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          WHERE t.relname = 'admin_checklist_data' AND contype = 'c'
        `
      });

    if (constraintError) {
      console.error('제약조건 조회 오류:', constraintError);
    } else {
      console.log('📋 현재 제약조건:', constraints);
    }

    // 2. 부서관리에서 활성화된 부서들 조회
    const { data: departments, error: deptError } = await supabase
      .from('admin_departments_data')
      .select('department_name')
      .eq('is_active', true);

    if (deptError) {
      console.error('부서 조회 오류:', deptError);
      return;
    }

    const activeTeams = departments.map(d => d.department_name);
    console.log('🏢 활성화된 부서들:', activeTeams);

    // 3. 기존 team 제약조건 삭제
    const { error: dropError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_team;'
      });

    if (dropError) {
      console.error('기존 제약조건 삭제 오류:', dropError);
      return;
    }

    console.log('✅ 기존 team 제약조건 삭제 완료');

    // 4. 새로운 team 제약조건 생성 (부서관리 데이터 기반)
    if (activeTeams.length > 0) {
      const teamValues = activeTeams.map(team => `'${team}'`).join(', ');
      const constraintSql = `
        ALTER TABLE admin_checklist_data
        ADD CONSTRAINT chk_team
        CHECK (team IN (${teamValues}) OR team IS NULL OR team = '');
      `;

      const { error: addError } = await supabase
        .rpc('exec_sql', { sql: constraintSql });

      if (addError) {
        console.error('새 제약조건 생성 오류:', addError);
        return;
      }

      console.log('✅ 새로운 team 제약조건 생성 완료');
      console.log('🎯 허용되는 팀 값들:', activeTeams);
    }

    // 5. 기존 데이터 확인
    const { data: existingData, error: dataError } = await supabase
      .from('admin_checklist_data')
      .select('id, team')
      .neq('team', null);

    if (dataError) {
      console.error('기존 데이터 조회 오류:', dataError);
      return;
    }

    console.log('📊 기존 체크리스트 데이터의 팀 값들:');
    existingData.forEach(item => {
      console.log(`- ID: ${item.id}, 팀: "${item.team}"`);
    });

    console.log('🎉 팀 제약조건 수정 완료!');

  } catch (error) {
    console.error('💥 오류 발생:', error);
  }
}

fixTeamConstraint();