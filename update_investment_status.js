const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateInvestmentStatus() {
  try {
    console.log('🔄 투자관리 상태 필드 업데이트 시작...\n');

    // 1. GROUP002 마스터코드 조회 (상태)
    console.log('📋 Step 1: GROUP002 마스터코드 조회 중...');
    const { data: masterCodes, error: masterError } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name')
      .eq('codetype', 'subcode')
      .eq('group_code', 'GROUP002')
      .eq('is_active', true);

    if (masterError) {
      console.error('❌ 마스터코드 조회 실패:', masterError);
      return;
    }

    console.log(`✅ ${masterCodes.length}개의 상태 마스터코드 조회 완료`);

    // 서브코드 -> 서브코드명 매핑 객체 생성
    const subcodeMap = {};
    masterCodes.forEach(code => {
      subcodeMap[code.subcode] = code.subcode_name;
      console.log(`   ${code.subcode} -> ${code.subcode_name}`);
    });

    // 2. plan_investment_data 테이블에서 서브코드로 저장된 데이터 조회
    console.log('\n📋 Step 2: plan_investment_data 테이블에서 서브코드 데이터 조회 중...');
    const { data: investments, error: invError } = await supabase
      .from('plan_investment_data')
      .select('id, investment_name, code, status')
      .like('status', 'GROUP002-%');

    if (invError) {
      console.error('❌ 투자 데이터 조회 실패:', invError);
      return;
    }

    console.log(`✅ ${investments.length}개의 투자 데이터 발견`);

    // 3. plan_investment_data 업데이트
    if (investments.length > 0) {
      console.log('\n🔄 Step 3: plan_investment_data 상태 필드 업데이트 중...');

      for (const item of investments) {
        const newStatusName = subcodeMap[item.status];
        if (newStatusName) {
          const { error: updateError } = await supabase
            .from('plan_investment_data')
            .update({ status: newStatusName })
            .eq('id', item.id);

          if (updateError) {
            console.error(`❌ ID ${item.id} 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ ID ${item.id}: ${item.investment_name} (${item.code})`);
            console.log(`   ${item.status} -> ${newStatusName}`);
          }
        }
      }
    } else {
      console.log('ℹ️  업데이트할 투자 데이터가 없습니다.');
    }

    // 4. common_log_data 테이블에서 서브코드로 저장된 변경로그 조회
    console.log('\n📋 Step 4: common_log_data 테이블에서 서브코드 변경로그 조회 중...');
    const { data: logs, error: logError } = await supabase
      .from('common_log_data')
      .select('id, record_id, before_value, after_value, description')
      .eq('page', 'plan_investment')
      .or('before_value.like.GROUP002-%,after_value.like.GROUP002-%');

    if (logError) {
      console.error('❌ 변경로그 조회 실패:', logError);
      return;
    }

    console.log(`✅ ${logs.length}개의 변경로그 발견`);

    // 5. common_log_data 업데이트
    if (logs.length > 0) {
      console.log('\n🔄 Step 5: common_log_data 변경로그 업데이트 중...');

      for (const log of logs) {
        const updates = {};
        let needsUpdate = false;

        // before_value 변환
        if (log.before_value && log.before_value.startsWith('GROUP002-')) {
          const newValue = subcodeMap[log.before_value];
          if (newValue) {
            updates.before_value = newValue;
            needsUpdate = true;
          }
        }

        // after_value 변환
        if (log.after_value && log.after_value.startsWith('GROUP002-')) {
          const newValue = subcodeMap[log.after_value];
          if (newValue) {
            updates.after_value = newValue;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('common_log_data')
            .update(updates)
            .eq('id', log.id);

          if (updateError) {
            console.error(`❌ 로그 ID ${log.id} 업데이트 실패:`, updateError);
          } else {
            console.log(`✅ 로그 ID ${log.id}: ${log.record_id}`);
            if (updates.before_value) {
              console.log(`   before: ${log.before_value} -> ${updates.before_value}`);
            }
            if (updates.after_value) {
              console.log(`   after: ${log.after_value} -> ${updates.after_value}`);
            }
          }
        }
      }
    } else {
      console.log('ℹ️  업데이트할 변경로그가 없습니다.');
    }

    console.log('\n✅ 모든 업데이트 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateInvestmentStatus();
