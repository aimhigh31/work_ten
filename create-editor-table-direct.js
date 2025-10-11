const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createEditorTableDirect() {
  const client = new Client({
    host: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '.pooler.supabase.com'),
    port: 5432,
    database: 'postgres',
    user: 'postgres.cbzktvpbyzwquvjcqtbf',
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔗 PostgreSQL 연결 성공');

    // 1. admin_checklist_editor 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS admin_checklist_editor (
          id BIGSERIAL PRIMARY KEY,
          checklist_id BIGINT NOT NULL,
          no INTEGER NOT NULL,
          major_category VARCHAR(100) NOT NULL,
          sub_category VARCHAR(100) NOT NULL,
          title VARCHAR(500) NOT NULL,
          description TEXT,
          evaluation VARCHAR(50) DEFAULT '대기',
          score INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by VARCHAR(100) DEFAULT 'system',
          updated_by VARCHAR(100) DEFAULT 'system',
          is_active BOOLEAN DEFAULT true,

          -- 외래키 제약조건
          CONSTRAINT fk_checklist_editor_checklist
              FOREIGN KEY (checklist_id)
              REFERENCES admin_checklist_data(id)
              ON DELETE CASCADE,

          -- 체크 제약조건
          CONSTRAINT chk_evaluation
              CHECK (evaluation IN ('대기', '진행', '완료', '보류', '불가')),

          CONSTRAINT chk_score
              CHECK (score >= 0 AND score <= 100)
      );
    `;

    console.log('🔧 admin_checklist_editor 테이블 생성 중...');
    await client.query(createTableSQL);
    console.log('✅ admin_checklist_editor 테이블 생성 완료');

    // 2. 인덱스 생성
    console.log('🔧 인덱스 생성 중...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_checklist_editor_checklist_id
          ON admin_checklist_editor(checklist_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_checklist_editor_no
          ON admin_checklist_editor(checklist_id, no);
    `);
    console.log('✅ 인덱스 생성 완료');

    // 3. RLS 활성화
    console.log('🔧 RLS 설정 중...');
    await client.query('ALTER TABLE admin_checklist_editor ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS 활성화 완료');

    // 4. RLS 정책 생성
    console.log('🔧 RLS 정책 생성 중...');
    await client.query(`
      CREATE POLICY "Allow all operations on admin_checklist_editor"
          ON admin_checklist_editor FOR ALL
          USING (true)
          WITH CHECK (true);
    `);
    console.log('✅ RLS 정책 생성 완료');

    // 5. 샘플 데이터 삽입
    console.log('🔧 샘플 데이터 삽입 중...');
    const sampleDataSQL = `
      INSERT INTO admin_checklist_editor (checklist_id, no, major_category, sub_category, title, description, evaluation, score) VALUES
      (1, 1, '보안', '접근통제', '시스템 권한 점검', '시스템 사용자 권한이 적절히 설정되어 있는지 확인', '대기', 0),
      (1, 2, '보안', '패스워드', '패스워드 정책 점검', '패스워드 복잡성 및 변경 주기 확인', '대기', 0),
      (1, 3, '시스템', '백업', '데이터 백업 상태', '정기적인 백업 수행 여부 확인', '대기', 0),
      (2, 1, '네트워크', '방화벽', '방화벽 설정 검토', '불필요한 포트 및 서비스 차단 확인', '대기', 0),
      (2, 2, '네트워크', '모니터링', '트래픽 모니터링', '네트워크 트래픽 이상 여부 모니터링', '대기', 0)
      ON CONFLICT DO NOTHING;
    `;

    await client.query(sampleDataSQL);
    console.log('✅ 샘플 데이터 삽입 완료');

    // 6. 테이블 구조 확인
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'admin_checklist_editor'
      ORDER BY ordinal_position;
    `);

    console.log('📊 테이블 구조:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (NULL: ${row.is_nullable})`);
    });

    // 7. 데이터 확인
    const dataResult = await client.query('SELECT * FROM admin_checklist_editor LIMIT 3;');
    console.log('📋 샘플 데이터:', dataResult.rows.length, '개');
    console.log('첫 번째 데이터:', dataResult.rows[0]);

    console.log('🎉 admin_checklist_editor 테이블 설정 완료!');

  } catch (error) {
    console.error('💥 오류 발생:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('❌ 데이터베이스 비밀번호가 올바르지 않습니다.');
      console.log('💡 .env.local 파일에 SUPABASE_DB_PASSWORD를 설정해주세요.');
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      console.log('❌ 데이터베이스 연결 실패. 호스트명을 확인해주세요.');
    } else {
      console.log('💡 Supabase Dashboard에서 다음 SQL을 직접 실행해주세요:');
      console.log(createTableSQL);
    }
  } finally {
    await client.end();
  }
}

createEditorTableDirect();