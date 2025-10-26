const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkChecklist() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('CHECKLIST DATA:\n');

  const { data } = await supabase.from('main_checklist_data').select('status').limit(10);
  
  if (data) {
    const uniqueStatuses = [...new Set(data.map(i => i.status))];
    console.log('Unique statuses in data:', uniqueStatuses);
  }

  console.log('\nMASTER CODES GROUP002:\n');
  
  const { data: codes } = await supabase
    .from('admin_master_code3')
    .select('subcode_name, subcode_value')
    .eq('group_code', 'GROUP002')
    .eq('is_active', true);
    
  if (codes) {
    console.log('Subcode names:', codes.map(c => c.subcode_name));
    console.log('Subcode values:', codes.map(c => c.subcode_value));
  }
}

checkChecklist();
