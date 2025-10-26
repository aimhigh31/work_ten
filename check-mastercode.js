const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMasterCodes() {
  console.log('마스터코드 확인\n');

  // GROUP003 (직급)
  const { data: group003 } = await supabase
    .from('admin_mastercode3_subcodes')
    .select('*')
    .eq('group_code', 'GROUP003')
    .order('subcode_order');

  console.log('GROUP003 (직급):');
  group003?.forEach(item => {
    console.log('  -', item.subcode, ':', item.subcode_name, '| code_value:', item.code_value);
  });

  console.log('\n');

  // GROUP004 (직책)
  const { data: group004 } = await supabase
    .from('admin_mastercode3_subcodes')
    .select('*')
    .eq('group_code', 'GROUP004')
    .order('subcode_order');

  console.log('GROUP004 (직책):');
  group004?.forEach(item => {
    console.log('  -', item.subcode, ':', item.subcode_name, '| code_value:', item.code_value);
  });
}

checkMasterCodes().catch(console.error);
