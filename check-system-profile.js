require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL 또는 SUPABASE_DB_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    await client.connect();
    console.log('✅ DB 연결 성공\n');

    // System 프로필 조회
    console.log('📊 System 프로필 조회...');
    const { rows: profiles } = await client.query(`
      SELECT id, email, name, role_id
      FROM admin_users_userprofiles
      WHERE email = 'admin@nexplus.co.kr' OR name LIKE '%System%'
      LIMIT 5
    `);
    console.log('System 프로필:', profiles);

    if (profiles.length > 0) {
      const systemProfile = profiles[0];
      console.log(`\n🔍 Role ID: ${systemProfile.role_id}`);

      if (systemProfile.role_id) {
        // 해당 역할의 권한 조회
        console.log('\n📋 권한 조회...');
        const { rows: permissions } = await client.query(`
          SELECT
            rp.role_id,
            rp.menu_id,
            rp.can_view_category,
            rp.can_read_data,
            rp.can_manage_own,
            rp.can_edit_others,
            m.menu_category,
            m.menu_page,
            m.menu_url
          FROM admin_users_rules_permissions rp
          LEFT JOIN admin_systemsetting_menu m ON rp.menu_id = m.id
          WHERE rp.role_id = $1
          ORDER BY m.display_order
          LIMIT 10
        `, [systemProfile.role_id]);

        console.log(`권한 개수: ${permissions.length}`);
        if (permissions.length > 0) {
          console.log('처음 5개 권한:');
          console.table(permissions.slice(0, 5));
        } else {
          console.log('⚠️  권한이 하나도 없습니다!');
        }

        // 역할 정보 조회
        console.log('\n📋 역할 정보 조회...');
        const { rows: roles } = await client.query(`
          SELECT id, role_code, role_name, is_active
          FROM admin_users_rules
          WHERE id = $1
        `, [systemProfile.role_id]);

        if (roles.length > 0) {
          console.log('역할 정보:', roles[0]);
        }
      } else {
        console.log('⚠️  role_id가 NULL입니다!');
      }
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

check();
