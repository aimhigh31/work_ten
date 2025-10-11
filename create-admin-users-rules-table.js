const { Client } = require('pg');

// 환경변수에서 데이터베이스 연결 정보 가져오기
const DATABASE_URL = "postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres";

async function createAdminUsersRulesTable() {
  const client = new Client({
    connectionString: DATABASE_URL
  });

  try {
    console.log('📡 Supabase 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // admin_users_rules 테이블 생성
    const createTableSQL = `
      -- admin_users_rules 테이블 생성 (역할 관리용)
      CREATE TABLE IF NOT EXISTS admin_users_rules (
          id SERIAL PRIMARY KEY,
          role_no INTEGER UNIQUE NOT NULL,
          role_code VARCHAR(50) UNIQUE NOT NULL,
          role_name VARCHAR(100) NOT NULL,
          role_description TEXT,
          user_count INTEGER DEFAULT 0,
          permission_count INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_by VARCHAR(100) DEFAULT '시스템',
          updated_by VARCHAR(100) DEFAULT '시스템',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('📋 admin_users_rules 테이블 생성 중...');
    await client.query(createTableSQL);
    console.log('✅ admin_users_rules 테이블 생성 완료');

    // 인덱스 생성
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_admin_users_rules_role_code ON admin_users_rules(role_code);
      CREATE INDEX IF NOT EXISTS idx_admin_users_rules_role_name ON admin_users_rules(role_name);
      CREATE INDEX IF NOT EXISTS idx_admin_users_rules_is_active ON admin_users_rules(is_active);
    `;

    console.log('📋 인덱스 생성 중...');
    await client.query(createIndexSQL);
    console.log('✅ 인덱스 생성 완료');

    // 기본 데이터 삽입
    const insertDataSQL = `
      INSERT INTO admin_users_rules (role_no, role_code, role_name, role_description, user_count, permission_count, is_active)
      VALUES
          (1, 'ROLE-25-001', '시스템관리자', '시스템 전체 관리 권한', 2, 15, true),
          (2, 'ROLE-25-002', '일반관리자', '일반 관리 업무 권한', 5, 8, true),
          (3, 'ROLE-25-003', '사용자', '기본 사용자 권한', 20, 3, true),
          (4, 'ROLE-25-004', '게스트', '제한적 조회 권한', 0, 1, false),
          (5, 'ROLE-25-005', '검토자', '검토 및 승인 권한', 3, 5, true)
      ON CONFLICT (role_code) DO NOTHING;
    `;

    console.log('📋 기본 데이터 삽입 중...');
    const insertResult = await client.query(insertDataSQL);
    console.log(`✅ ${insertResult.rowCount || 0}개 기본 데이터 삽입 완료`);

    // 업데이트 트리거 함수 생성
    const triggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_admin_users_rules_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    console.log('📋 트리거 함수 생성 중...');
    await client.query(triggerFunctionSQL);
    console.log('✅ 트리거 함수 생성 완료');

    // 업데이트 트리거 설정
    const triggerSQL = `
      DROP TRIGGER IF EXISTS update_admin_users_rules_updated_at ON admin_users_rules;
      CREATE TRIGGER update_admin_users_rules_updated_at
          BEFORE UPDATE ON admin_users_rules
          FOR EACH ROW
          EXECUTE FUNCTION update_admin_users_rules_updated_at();
    `;

    console.log('📋 트리거 설정 중...');
    await client.query(triggerSQL);
    console.log('✅ 트리거 설정 완료');

    // 테이블 정보 조회
    const checkDataSQL = `
      SELECT
          'admin_users_rules 테이블 설정 완료' as status,
          count(*) as total_records
      FROM admin_users_rules;
    `;

    const result = await client.query(checkDataSQL);
    console.log('\n🎉 admin_users_rules 테이블 설정 완료');
    console.log(`📊 총 레코드 수: ${result.rows[0].total_records}`);

    // 데이터 확인
    const selectResult = await client.query('SELECT * FROM admin_users_rules ORDER BY role_no');
    console.log('\n📋 현재 데이터:');
    selectResult.rows.forEach(row => {
      console.log(`  ${row.role_code} - ${row.role_name} (${row.is_active ? '활성' : '비활성'})`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
createAdminUsersRulesTable();