require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 사용자 테이블 확인\n');

  const tables = ['admin_user_management', 'admin_users', 'users', 'admin_user'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    console.log(`\n${table}:`);
    if (data && data.length > 0) {
      console.log('  ✅ 존재함, 컬럼:', Object.keys(data[0]).join(', '));
    } else if (error) {
      console.log('  ❌ 없음:', error.message);
    }
  }
})();
