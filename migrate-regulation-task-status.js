require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateStatus() {
  console.log('=== 보안규정관리 상태값 마이그레이션 시작 ===\n');

  // 보안규정관리: 승인 → 완료
  console.log('1. 승인 → 완료 변경 중...');
  const { data: approvedItems, error: approvedError } = await supabase
    .from('security_regulation_data')
    .select('id, code, status')
    .eq('status', '승인');

  if (approvedError) {
    console.error('승인 항목 조회 에러:', approvedError);
  } else {
    console.log(`  발견된 승인 항목: ${approvedItems.length}건`);

    if (approvedItems.length > 0) {
      for (const item of approvedItems) {
        const { error: updateError } = await supabase
          .from('security_regulation_data')
          .update({ status: '완료' })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  ✗ ID ${item.id} (${item.code}) 업데이트 실패:`, updateError);
        } else {
          console.log(`  ✓ ID ${item.id} (${item.code}): 승인 → 완료`);
        }
      }
    }
  }

  // 보안규정관리: 취소 → 홀딩
  console.log('\n2. 취소 → 홀딩 변경 중...');
  const { data: canceledItems, error: canceledError } = await supabase
    .from('security_regulation_data')
    .select('id, code, status')
    .eq('status', '취소');

  if (canceledError) {
    console.error('취소 항목 조회 에러:', canceledError);
  } else {
    console.log(`  발견된 취소 항목: ${canceledItems.length}건`);

    if (canceledItems.length > 0) {
      for (const item of canceledItems) {
        const { error: updateError } = await supabase
          .from('security_regulation_data')
          .update({ status: '홀딩' })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  ✗ ID ${item.id} (${item.code}) 업데이트 실패:`, updateError);
        } else {
          console.log(`  ✓ ID ${item.id} (${item.code}): 취소 → 홀딩`);
        }
      }
    }
  }

  // 홀딩22 → 홀딩 수정
  console.log('\n3. 홀딩22 → 홀딩 변경 중...');
  const { data: holding22Items, error: holding22Error } = await supabase
    .from('security_regulation_data')
    .select('id, code, status')
    .eq('status', '홀딩22');

  if (holding22Error) {
    console.error('홀딩22 항목 조회 에러:', holding22Error);
  } else {
    console.log(`  발견된 홀딩22 항목: ${holding22Items.length}건`);

    if (holding22Items.length > 0) {
      for (const item of holding22Items) {
        const { error: updateError } = await supabase
          .from('security_regulation_data')
          .update({ status: '홀딩' })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  ✗ ID ${item.id} (${item.code}) 업데이트 실패:`, updateError);
        } else {
          console.log(`  ✓ ID ${item.id} (${item.code}): 홀딩22 → 홀딩`);
        }
      }
    }
  }

  // 업무관리: 승인 → 완료
  console.log('\n=== 업무관리 상태값 마이그레이션 시작 ===\n');
  console.log('4. 승인 → 완료 변경 중...');
  const { data: taskApprovedItems, error: taskApprovedError } = await supabase
    .from('main_task_data')
    .select('id, code, status')
    .eq('status', '승인');

  if (taskApprovedError) {
    console.error('승인 항목 조회 에러:', taskApprovedError);
  } else {
    console.log(`  발견된 승인 항목: ${taskApprovedItems.length}건`);

    if (taskApprovedItems.length > 0) {
      for (const item of taskApprovedItems) {
        const { error: updateError } = await supabase
          .from('main_task_data')
          .update({ status: '완료' })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  ✗ ID ${item.id} (${item.code}) 업데이트 실패:`, updateError);
        } else {
          console.log(`  ✓ ID ${item.id} (${item.code}): 승인 → 완료`);
        }
      }
    }
  }

  // 업무관리: 취소 → 홀딩
  console.log('\n5. 취소 → 홀딩 변경 중...');
  const { data: taskCanceledItems, error: taskCanceledError } = await supabase
    .from('main_task_data')
    .select('id, code, status')
    .eq('status', '취소');

  if (taskCanceledError) {
    console.error('취소 항목 조회 에러:', taskCanceledError);
  } else {
    console.log(`  발견된 취소 항목: ${taskCanceledItems.length}건`);

    if (taskCanceledItems.length > 0) {
      for (const item of taskCanceledItems) {
        const { error: updateError } = await supabase
          .from('main_task_data')
          .update({ status: '홀딩' })
          .eq('id', item.id);

        if (updateError) {
          console.error(`  ✗ ID ${item.id} (${item.code}) 업데이트 실패:`, updateError);
        } else {
          console.log(`  ✓ ID ${item.id} (${item.code}): 취소 → 홀딩`);
        }
      }
    }
  }

  // 최종 상태 확인
  console.log('\n=== 마이그레이션 완료 - 최종 상태 확인 ===\n');

  const { data: finalRegData } = await supabase
    .from('security_regulation_data')
    .select('status');
  const uniqueRegStatuses = [...new Set(finalRegData.map(t => t.status))];
  console.log('보안규정관리 최종 고유 상태값:', uniqueRegStatuses);

  const { data: finalTaskData } = await supabase
    .from('main_task_data')
    .select('status');
  const uniqueTaskStatuses = [...new Set(finalTaskData.map(t => t.status))];
  console.log('업무관리 최종 고유 상태값:', uniqueTaskStatuses);
}

migrateStatus().then(() => {
  console.log('\n✅ 마이그레이션 완료!');
  process.exit(0);
});
