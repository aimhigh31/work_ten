const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMenuTable() {
  console.log('메뉴 테이블 구조 확인:\n');

  const { data: menus, error } = await supabase
    .from('admin_systemsetting_menu')
    .select('*')
    .limit(3);

  if (error) {
    console.error('조회 실패:', error);
    return;
  }

  if (menus && menus.length > 0) {
    console.log('컬럼 목록:');
    Object.keys(menus[0]).forEach(key => {
      console.log('  -', key, ':', menus[0][key]);
    });

    console.log('\n전체 메뉴 샘플:');
    menus.forEach(m => {
      console.log('  - ID:', m.id, '| 이름:', m.menu_name);
    });
  }
}

checkMenuTable().catch(console.error);
