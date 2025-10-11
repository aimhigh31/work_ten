const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableDirect() {
  console.log('🔧 it_software_user 테이블 직접 생성 시도...');

  try {
    // 1. 샘플 데이터로 테이블 자동 생성 시도
    const sampleData = {
      software_id: 1, // it_software_data에서 기존 ID 사용
      user_name: 'test_user',
      department: 'test_dept',
      exclusive_id: 'test_id',
      reason: 'test',
      usage_status: '사용중',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      registration_date: '2025-01-01',
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };

    console.log('📤 샘플 데이터로 테이블 생성 시도...');

    const { data: insertData, error: insertError } = await supabase
      .from('it_software_user')
      .insert(sampleData)
      .select();

    if (insertError) {
      console.log('⚠️ 첫 번째 시도 실패:', insertError.message);

      // 2. 다른 방법 시도 - upsert 사용
      console.log('📤 upsert로 테이블 생성 시도...');

      const { data: upsertData, error: upsertError } = await supabase
        .from('it_software_user')
        .upsert(sampleData, { onConflict: 'id' })
        .select();

      if (upsertError) {
        console.log('⚠️ 두 번째 시도도 실패:', upsertError.message);

        // 3. 테이블이 정말 존재하지 않는 경우 - SQL을 통한 생성 시도
        console.log('📋 Raw SQL을 통한 테이블 생성 시도...');

        // PostgreSQL 함수 호출로 테이블 생성
        const createSQL = `
        CREATE TABLE IF NOT EXISTS public.it_software_user (
          id bigserial PRIMARY KEY,
          software_id bigint NOT NULL,
          user_name text NOT NULL,
          department text,
          exclusive_id text,
          reason text,
          usage_status text DEFAULT '사용중',
          start_date date,
          end_date date,
          registration_date date DEFAULT CURRENT_DATE,
          created_by text DEFAULT 'user',
          updated_by text DEFAULT 'user',
          is_active boolean DEFAULT true,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );

        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id ON public.it_software_user(software_id);
        CREATE INDEX IF NOT EXISTS idx_it_software_user_is_active ON public.it_software_user(is_active);
        `;

        console.log('📋 실행할 SQL:');
        console.log(createSQL);

        // RLS 정책도 생성 시도
        const rlsSQL = `
        -- Enable Row Level Security
        ALTER TABLE public.it_software_user ENABLE ROW LEVEL SECURITY;

        -- Create policy to allow all operations for authenticated users
        CREATE POLICY "Enable all operations for authenticated users" ON public.it_software_user
        FOR ALL USING (true);
        `;

        console.log('🔐 RLS 정책:');
        console.log(rlsSQL);

        // 직접 실행할 수 없으므로 사용자에게 안내
        console.log('');
        console.log('🚀 다음 단계를 수행하세요:');
        console.log('1. https://supabase.com/dashboard 접속');
        console.log('2. 프로젝트 선택');
        console.log('3. 왼쪽 메뉴에서 "SQL Editor" 클릭');
        console.log('4. "New Query" 클릭');
        console.log('5. 위의 CREATE TABLE SQL을 복사해서 붙여넣기');
        console.log('6. "RUN" 버튼 클릭');
        console.log('7. 그 다음 RLS 정책 SQL도 실행');
        console.log('');
        console.log('✅ 테이블 생성 완료 후 애플리케이션을 새로고침하세요!');

        return;
      }

      console.log('✅ upsert로 테이블 생성 성공!', upsertData);
    } else {
      console.log('✅ insert로 테이블 생성 성공!', insertData);
    }

    // 테이블이 성공적으로 생성되었으면 샘플 데이터 삭제
    console.log('🧹 샘플 데이터 정리...');
    await supabase
      .from('it_software_user')
      .delete()
      .eq('user_name', 'test_user');

    console.log('🎉 it_software_user 테이블 생성 완료!');

    // 테이블 구조 확인
    const { data: checkData, error: checkError } = await supabase
      .from('it_software_user')
      .select('*')
      .limit(1);

    if (!checkError) {
      console.log('✅ 테이블 확인 완료 - 정상 작동합니다!');
    }

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

createTableDirect();