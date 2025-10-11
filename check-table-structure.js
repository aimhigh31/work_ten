const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  try {
    console.log('🔍 admin_checklist_data 테이블 확인 중...');

    // 테이블 존재 여부 확인
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error);

      if (error.message.includes('relation "admin_checklist_data" does not exist')) {
        console.log('⚠️ admin_checklist_data 테이블이 존재하지 않습니다.');
        console.log('🔨 테이블을 다시 생성합니다...');

        // 테이블 생성 스크립트를 다시 실행
        const { Client } = require('pg');
        const connectionString = `postgresql://postgres.njbwafbxifebclvkkzke:Coding74!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

        const client = new Client({ connectionString });
        await client.connect();

        // 테이블 생성
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS admin_checklist_data (
            id SERIAL PRIMARY KEY,
            checklist_id INTEGER NOT NULL,
            data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('overview', 'editor_item')),
            item_no INTEGER,
            field_name VARCHAR(100) NOT NULL,
            field_value TEXT,
            sequence_no INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100) DEFAULT 'system',
            updated_by VARCHAR(100) DEFAULT 'system',
            is_active BOOLEAN DEFAULT TRUE,
            CONSTRAINT unique_checklist_field UNIQUE (checklist_id, data_type, item_no, field_name)
          );
        `;

        await client.query(createTableSQL);
        console.log('✅ 테이블 생성 완료');

        // 트리거 생성
        const triggerSQL = `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';

          DROP TRIGGER IF EXISTS update_admin_checklist_data_updated_at ON admin_checklist_data;

          CREATE TRIGGER update_admin_checklist_data_updated_at
          BEFORE UPDATE ON admin_checklist_data
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `;

        await client.query(triggerSQL);
        console.log('✅ 트리거 생성 완료');

        await client.end();

        // 다시 테이블 확인
        const { data: newData, error: newError } = await supabase
          .from('admin_checklist_data')
          .select('*')
          .limit(1);

        if (!newError) {
          console.log('✅ 테이블이 정상적으로 생성되었습니다');
        }
      }
    } else {
      console.log('✅ admin_checklist_data 테이블이 존재합니다');

      // 테이블 데이터 확인
      const { data: allData, error: countError } = await supabase
        .from('admin_checklist_data')
        .select('checklist_id, data_type, count(*)', { count: 'exact' });

      if (!countError) {
        console.log(`📊 테이블에 ${allData?.length || 0}개 행이 있습니다`);
      }
    }

    // RLS 정책 확인
    console.log('\n🔒 RLS 정책 확인...');

    // RLS 비활성화 (개발 중)
    const { Client: Client2 } = require('pg');
    const connectionString2 = `postgresql://postgres.njbwafbxifebclvkkzke:Coding74!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

    const client2 = new Client2({ connectionString: connectionString2 });
    await client2.connect();

    try {
      await client2.query('ALTER TABLE admin_checklist_data DISABLE ROW LEVEL SECURITY;');
      console.log('✅ RLS 비활성화 완료');
    } catch (rlsError) {
      console.log('⚠️ RLS 설정 실패 (이미 설정되었을 수 있음):', rlsError.message);
    }

    await client2.end();

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkTableStructure();