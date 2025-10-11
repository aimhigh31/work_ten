const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function removeTeamConstraint() {
  try {
    console.log('🔧 chk_team 제약조건 제거 시작...');
    console.log('📍 Supabase URL:', supabaseUrl);

    // Supabase REST API를 통해 직접 SQL 실행
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

    if (!projectRef) {
      throw new Error('프로젝트 참조를 찾을 수 없습니다.');
    }

    const sql = 'ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_team;';

    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      }
    };

    const postData = JSON.stringify({
      sql_query: sql
    });

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('응답 상태 코드:', res.statusCode);
        console.log('응답 데이터:', data);

        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log('✅ chk_team 제약조건이 성공적으로 제거되었습니다!');
        } else {
          console.log('❌ 제약조건 제거 실패');
          console.log('\n⚠️ Supabase SQL Editor에서 직접 실행하세요:');
          console.log('\nALTER TABLE admin_checklist_data');
          console.log('DROP CONSTRAINT IF EXISTS chk_team;');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 요청 오류:', error);
      console.log('\n⚠️ Supabase SQL Editor에서 직접 실행하세요:');
      console.log('\nALTER TABLE admin_checklist_data');
      console.log('DROP CONSTRAINT IF EXISTS chk_team;');
    });

    req.write(postData);
    req.end();

  } catch (err) {
    console.error('💥 오류 발생:', err);
    console.log('\n⚠️ Supabase SQL Editor에서 직접 실행하세요:');
    console.log('\nALTER TABLE admin_checklist_data');
    console.log('DROP CONSTRAINT IF EXISTS chk_team;');
  }
}

removeTeamConstraint();
