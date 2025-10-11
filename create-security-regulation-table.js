const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSecurityRegulationTable() {
  try {
    console.log('🔨 security_regulation_data 테이블 생성 중...');

    // PostgreSQL 직접 연결 방식
    const { Client } = require('pg');
    const connectionString = process.env.DATABASE_URL ||
      `postgresql://postgres.${supabaseUrl.split('//')[1].split('.')[0]}:${supabaseServiceKey}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

    const client = new Client({ connectionString });

    try {
      await client.connect();
      console.log('✅ 데이터베이스 연결 성공');
    } catch (connectError) {
      // 연결 실패 시 다른 연결 문자열 시도
      const altConnectionString = `postgresql://postgres.njbwafbxifebclvkkzke:Coding74!@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;
      const altClient = new Client({ connectionString: altConnectionString });
      await altClient.connect();
      console.log('✅ 대체 연결로 데이터베이스 연결 성공');
      // client를 altClient로 교체
      Object.assign(client, altClient);
    }

    // 테이블 삭제 (이미 존재하는 경우)
    try {
      await client.query('DROP TABLE IF EXISTS security_regulation_data CASCADE');
      console.log('🗑️ 기존 테이블 삭제 완료');
    } catch (err) {
      console.log('ℹ️ 기존 테이블이 없거나 삭제 건너뜀');
    }

    // 테이블 생성
    const createTableSQL = `
      CREATE TABLE security_regulation_data (
        id SERIAL PRIMARY KEY,

        -- 폴더/파일 구조 관련
        parent_id INTEGER REFERENCES security_regulation_data(id) ON DELETE CASCADE,
        type VARCHAR(10) CHECK (type IN ('folder', 'file')) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(500),
        level INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,

        -- 파일 관련 정보
        file_size VARCHAR(20),
        file_extension VARCHAR(10),

        -- 개요탭 관련 필드
        description TEXT,
        document_type VARCHAR(100), -- GROUP007 서브코드 값
        status VARCHAR(50), -- GROUP002 서브코드 값
        assignee VARCHAR(100), -- 사용자명
        code VARCHAR(50), -- 문서 코드
        revision VARCHAR(20), -- 리비전
        revision_date DATE, -- 리비전 수정일

        -- 공통 필드
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT TRUE,

        -- 메타데이터
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ 테이블 생성 완료');

    // 인덱스 생성
    const indexes = [
      'CREATE INDEX idx_security_regulation_parent ON security_regulation_data(parent_id);',
      'CREATE INDEX idx_security_regulation_type ON security_regulation_data(type);',
      'CREATE INDEX idx_security_regulation_path ON security_regulation_data(path);',
      'CREATE INDEX idx_security_regulation_active ON security_regulation_data(is_active);',
      'CREATE INDEX idx_security_regulation_document_type ON security_regulation_data(document_type);',
      'CREATE INDEX idx_security_regulation_status ON security_regulation_data(status);'
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

      DROP TRIGGER IF EXISTS update_security_regulation_updated_at ON security_regulation_data;

      CREATE TRIGGER update_security_regulation_updated_at
      BEFORE UPDATE ON security_regulation_data
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    await client.query(triggerSQL);
    console.log('✅ 트리거 생성 완료');

    // RLS 정책 설정 (개발 중에는 비활성화)
    try {
      await client.query('ALTER TABLE security_regulation_data DISABLE ROW LEVEL SECURITY;');
      console.log('✅ RLS 비활성화 완료');
    } catch (rlsError) {
      console.log('⚠️ RLS 설정 실패 (이미 설정되었을 수 있음):', rlsError.message);
    }

    await client.end();
    console.log('✅ 데이터베이스 연결 종료');

    // 테이블 생성 확인
    const { data: testData, error: testError } = await supabase
      .from('security_regulation_data')
      .select('*')
      .limit(1);

    if (!testError) {
      console.log('✅ 테이블 생성 확인 완료');
      console.log('\n📊 테이블 구조:');
      console.log('  - id: 자동 증가 기본키');
      console.log('  - parent_id: 상위 폴더 참조');
      console.log('  - type: folder | file');
      console.log('  - name: 폴더/파일명');
      console.log('  - path: 전체 경로');
      console.log('  - document_type: 문서유형 (GROUP007)');
      console.log('  - status: 상태 (GROUP002)');
      console.log('  - assignee: 담당자');
      console.log('  - 기타 메타데이터...');
    } else {
      console.log('⚠️ 테이블 접근 테스트 실패:', testError.message);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

// 실행
createSecurityRegulationTable();