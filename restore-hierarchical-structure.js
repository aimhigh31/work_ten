const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase 연결 문자열에서 직접 연결 정보 추출
const connectionString = process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '');
const projectRef = connectionString.split('.')[0];

// PostgreSQL 직접 연결 설정
const client = new Client({
  host: `${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ssl: { rejectUnauthorized: false }
});

async function restoreHierarchicalStructure() {
  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 1. 기존 플랫 구조 테이블 삭제
    console.log('\n1. 기존 플랫 구조 테이블 삭제 중...');
    await client.query('DROP TABLE IF EXISTS admin_mastercode_data CASCADE');
    console.log('✅ admin_mastercode_data 테이블 삭제 완료');

    // 2. 마스터코드 테이블 생성
    console.log('\n2. 계층 구조 테이블 생성 중...');

    // 마스터코드 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_mastercode (
        id SERIAL PRIMARY KEY,
        code_group VARCHAR(50) NOT NULL UNIQUE,
        code_group_name VARCHAR(100) NOT NULL,
        code_group_description TEXT,
        is_active BOOLEAN DEFAULT true,
        is_system BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100)
      )
    `);
    console.log('✅ admin_mastercode 테이블 생성 완료');

    // 서브코드 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_subcode (
        id SERIAL PRIMARY KEY,
        mastercode_id INTEGER NOT NULL REFERENCES admin_mastercode(id) ON DELETE CASCADE,
        sub_code VARCHAR(50) NOT NULL,
        sub_code_name VARCHAR(100) NOT NULL,
        sub_code_description TEXT,
        code_value1 VARCHAR(255),
        code_value2 VARCHAR(255),
        code_value3 VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        is_system BOOLEAN DEFAULT false,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100),
        updated_by VARCHAR(100),
        UNIQUE(mastercode_id, sub_code)
      )
    `);
    console.log('✅ admin_subcode 테이블 생성 완료');

    // 3. 인덱스 생성
    console.log('\n3. 인덱스 생성 중...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_mastercode_code_group ON admin_mastercode(code_group)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_mastercode_is_active ON admin_mastercode(is_active)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_subcode_mastercode_id ON admin_subcode(mastercode_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_subcode_sub_code ON admin_subcode(sub_code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_admin_subcode_is_active ON admin_subcode(is_active)');
    console.log('✅ 인덱스 생성 완료');

    // 4. 샘플 데이터 삽입
    console.log('\n4. 샘플 데이터 삽입 중...');

    // 마스터코드 데이터
    const masterCodes = [
      { code_group: 'USER_LEVEL', code_group_name: '사용자 레벨', code_group_description: '사용자 권한 레벨 관리' },
      { code_group: 'TASK_STATUS', code_group_name: '업무 상태', code_group_description: '업무 진행 상태 코드' },
      { code_group: 'PRIORITY', code_group_name: '우선순위', code_group_description: '업무 우선순위 레벨' },
      { code_group: 'DEPT_TYPE', code_group_name: '부서 유형', code_group_description: '부서 분류 코드' },
      { code_group: 'DOC_TYPE', code_group_name: '문서 유형', code_group_description: '문서 분류 코드' }
    ];

    for (const mc of masterCodes) {
      const result = await client.query(
        `INSERT INTO admin_mastercode (code_group, code_group_name, code_group_description, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [mc.code_group, mc.code_group_name, mc.code_group_description, masterCodes.indexOf(mc) + 1]
      );

      const mastercodeId = result.rows[0].id;

      // 각 마스터코드에 대한 서브코드 추가
      let subCodes = [];

      switch(mc.code_group) {
        case 'USER_LEVEL':
          subCodes = [
            { sub_code: 'L1', sub_code_name: '사원', code_value1: '#4CAF50' },
            { sub_code: 'L2', sub_code_name: '대리', code_value1: '#2196F3' },
            { sub_code: 'L3', sub_code_name: '과장', code_value1: '#FF9800' },
            { sub_code: 'L4', sub_code_name: '부장', code_value1: '#F44336' },
            { sub_code: 'L5', sub_code_name: '임원', code_value1: '#9C27B0' }
          ];
          break;
        case 'TASK_STATUS':
          subCodes = [
            { sub_code: 'PENDING', sub_code_name: '대기중', code_value1: '#9E9E9E' },
            { sub_code: 'IN_PROGRESS', sub_code_name: '진행중', code_value1: '#2196F3' },
            { sub_code: 'COMPLETED', sub_code_name: '완료', code_value1: '#4CAF50' },
            { sub_code: 'CANCELLED', sub_code_name: '취소', code_value1: '#F44336' }
          ];
          break;
        case 'PRIORITY':
          subCodes = [
            { sub_code: 'LOW', sub_code_name: '낮음', code_value1: '#4CAF50' },
            { sub_code: 'MEDIUM', sub_code_name: '보통', code_value1: '#FF9800' },
            { sub_code: 'HIGH', sub_code_name: '높음', code_value1: '#F44336' },
            { sub_code: 'URGENT', sub_code_name: '긴급', code_value1: '#D32F2F' }
          ];
          break;
        case 'DEPT_TYPE':
          subCodes = [
            { sub_code: 'DEV', sub_code_name: '개발팀' },
            { sub_code: 'DESIGN', sub_code_name: '디자인팀' },
            { sub_code: 'SALES', sub_code_name: '영업팀' },
            { sub_code: 'HR', sub_code_name: '인사팀' }
          ];
          break;
        case 'DOC_TYPE':
          subCodes = [
            { sub_code: 'REPORT', sub_code_name: '보고서' },
            { sub_code: 'PROPOSAL', sub_code_name: '제안서' },
            { sub_code: 'CONTRACT', sub_code_name: '계약서' },
            { sub_code: 'MANUAL', sub_code_name: '매뉴얼' }
          ];
          break;
      }

      for (let i = 0; i < subCodes.length; i++) {
        const sc = subCodes[i];
        await client.query(
          `INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [mastercodeId, sc.sub_code, sc.sub_code_name, sc.code_value1 || null, i + 1]
        );
      }
    }

    console.log('✅ 샘플 데이터 삽입 완료');

    // 5. 데이터 확인
    console.log('\n5. 데이터 확인 중...');
    const masterCount = await client.query('SELECT COUNT(*) FROM admin_mastercode');
    const subCount = await client.query('SELECT COUNT(*) FROM admin_subcode');

    console.log(`✅ 마스터코드: ${masterCount.rows[0].count}개`);
    console.log(`✅ 서브코드: ${subCount.rows[0].count}개`);

    console.log('\n✨ 계층 구조로 원복 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
  }
}

restoreHierarchicalStructure();