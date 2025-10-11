const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createChecklistDataTable() {
  try {
    console.log('🔨 admin_checklist_data 테이블 생성 중...');

    // 테이블 생성 SQL
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

        -- 복합 유니크 제약 (체크리스트별 필드 중복 방지)
        CONSTRAINT unique_checklist_field UNIQUE (checklist_id, data_type, item_no, field_name)
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      // RPC가 없으면 직접 실행
      console.log('⚠️ RPC 실행 실패, 직접 SQL 실행 시도...');

      // PostgreSQL 직접 연결 방식
      const { Client } = require('pg');
      const connectionString = process.env.DATABASE_URL ||
        `postgresql://postgres.${supabaseUrl.split('//')[1].split('.')[0]}:${supabaseServiceKey}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

      const client = new Client({ connectionString });
      await client.connect();

      await client.query(createTableSQL);

      console.log('✅ 테이블 생성 완료');

      // 인덱스 생성
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_checklist_data_checklist_id ON admin_checklist_data(checklist_id);',
        'CREATE INDEX IF NOT EXISTS idx_checklist_data_type ON admin_checklist_data(data_type);',
        'CREATE INDEX IF NOT EXISTS idx_checklist_data_item_no ON admin_checklist_data(item_no);',
        'CREATE INDEX IF NOT EXISTS idx_checklist_data_field_name ON admin_checklist_data(field_name);',
        'CREATE INDEX IF NOT EXISTS idx_checklist_data_composite ON admin_checklist_data(checklist_id, data_type, item_no);'
      ];

      for (const indexSQL of indexes) {
        try {
          await client.query(indexSQL);
          console.log('✅ 인덱스 생성:', indexSQL.match(/INDEX (\w+)/)[1]);
        } catch (err) {
          if (err.message.includes('already exists')) {
            console.log('⚠️ 인덱스 이미 존재:', indexSQL.match(/INDEX (\w+)/)[1]);
          } else {
            throw err;
          }
        }
      }

      // 트리거 생성 (updated_at 자동 업데이트)
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
    } else {
      console.log('✅ 테이블 생성 완료');
    }

    // 테이블 정보 확인
    const { data: tableInfo, error: infoError } = await supabase
      .from('admin_checklist_data')
      .select('*')
      .limit(1);

    if (!infoError) {
      console.log('✅ 테이블 생성 확인 완료');
      console.log('📊 테이블 구조:');
      console.log('  - id: 자동 증가 기본키');
      console.log('  - checklist_id: 체크리스트 그룹 ID');
      console.log('  - data_type: overview | editor_item');
      console.log('  - item_no: 에디터 항목 번호');
      console.log('  - field_name: 필드명');
      console.log('  - field_value: 필드값');
      console.log('  - sequence_no: 정렬 순서');
      console.log('  - created_at, updated_at: 타임스탬프');
      console.log('  - created_by, updated_by: 사용자');
      console.log('  - is_active: 활성화 여부');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
createChecklistDataTable();