// 플랫 구조 마스터코드 테이블 생성 및 데이터 마이그레이션
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createFlatStructureTable() {
  try {
    console.log('🔗 PostgreSQL 연결 중...');
    await client.connect();

    console.log('📋 플랫 구조 테이블 생성 중...');

    // 1. 기존 테이블 이름 변경 (백업용)
    await client.query('ALTER TABLE admin_mastercode_data RENAME TO admin_mastercode_data_hierarchical_backup;');
    console.log('✅ 기존 테이블을 백업용으로 이름 변경');

    // 2. 새로운 플랫 구조 테이블 생성
    const createTableSQL = `
      CREATE TABLE admin_mastercode_data (
        id SERIAL PRIMARY KEY,
        group_code VARCHAR(50) NOT NULL,
        group_name VARCHAR(100) NOT NULL,
        group_description TEXT,
        group_status VARCHAR(20) DEFAULT 'active',
        sub_code VARCHAR(50) NOT NULL,
        sub_name VARCHAR(100) NOT NULL,
        sub_description TEXT,
        sub_status VARCHAR(20) DEFAULT 'active',
        code_value1 VARCHAR(100),
        code_value2 VARCHAR(100),
        code_value3 VARCHAR(100),
        display_order INTEGER DEFAULT 0,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(50) DEFAULT 'system',
        updated_by VARCHAR(50) DEFAULT 'system',

        -- 인덱스들
        UNIQUE(group_code, sub_code)
      );

      -- 인덱스 생성
      CREATE INDEX idx_admin_mastercode_data_group_code ON admin_mastercode_data(group_code);
      CREATE INDEX idx_admin_mastercode_data_group_status ON admin_mastercode_data(group_status);
      CREATE INDEX idx_admin_mastercode_data_sub_status ON admin_mastercode_data(sub_status);
      CREATE INDEX idx_admin_mastercode_data_display_order ON admin_mastercode_data(display_order);

      -- RLS 정책 설정
      ALTER TABLE admin_mastercode_data ENABLE ROW LEVEL SECURITY;

      -- 기존 정책 삭제 후 재생성
      DROP POLICY IF EXISTS "Allow read access for all users" ON admin_mastercode_data;
      DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON admin_mastercode_data;

      CREATE POLICY "Allow read access for all users" ON admin_mastercode_data FOR SELECT USING (true);
      CREATE POLICY "Allow all operations for authenticated users" ON admin_mastercode_data FOR ALL USING (true);
    `;

    await client.query(createTableSQL);
    console.log('✅ 플랫 구조 테이블 생성 완료');

    // 3. 계층형 데이터를 플랫 구조로 변환하여 삽입
    console.log('🔄 계층형 → 플랫 구조로 데이터 마이그레이션 시작...');

    // 백업 테이블에서 마스터코드들 조회
    const mastersResult = await client.query(`
      SELECT * FROM admin_mastercode_data_hierarchical_backup
      WHERE level = 0
      ORDER BY display_order, id
    `);

    const masters = mastersResult.rows;
    console.log(`📊 마스터코드 ${masters.length}개 발견`);

    let totalInserted = 0;

    for (const master of masters) {
      // 각 마스터코드의 서브코드들 조회
      const subsResult = await client.query(`
        SELECT * FROM admin_mastercode_data_hierarchical_backup
        WHERE parent_id = $1 AND level = 1
        ORDER BY display_order, id
      `, [master.id]);

      const subs = subsResult.rows;
      console.log(`  └ ${master.code_group}: ${subs.length}개 서브코드`);

      // 각 서브코드를 플랫 구조로 삽입
      for (const sub of subs) {
        const metadata = sub.metadata || {};

        await client.query(`
          INSERT INTO admin_mastercode_data (
            group_code, group_name, group_description, group_status,
            sub_code, sub_name, sub_description, sub_status,
            code_value1, code_value2, code_value3,
            display_order, is_system, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [
          master.code_group,
          master.code_name,
          master.code_description || '',
          master.is_active ? 'active' : 'inactive',
          sub.code_value,
          sub.code_name,
          sub.code_description || '',
          sub.is_active ? 'active' : 'inactive',
          metadata.code_value1 || null,
          metadata.code_value2 || null,
          metadata.code_value3 || null,
          sub.display_order || 0,
          sub.is_system || false,
          sub.created_by || 'system',
          sub.updated_by || 'system'
        ]);

        totalInserted++;
      }
    }

    console.log(`✅ 총 ${totalInserted}개의 플랫 구조 레코드 생성 완료`);

    // 4. 결과 확인
    const finalResult = await client.query('SELECT COUNT(*) as count FROM admin_mastercode_data');
    console.log(`📈 최종 플랫 구조 테이블 레코드 수: ${finalResult.rows[0].count}`);

    // 5. 그룹별 요약
    const summaryResult = await client.query(`
      SELECT group_code, group_name, COUNT(*) as sub_count
      FROM admin_mastercode_data
      GROUP BY group_code, group_name
      ORDER BY group_code
    `);

    console.log('📋 그룹별 요약:');
    summaryResult.rows.forEach(row => {
      console.log(`  - ${row.group_code} (${row.group_name}): ${row.sub_count}개 서브코드`);
    });

  } catch (error) {
    console.error('❌ 플랫 구조 변환 중 오류:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 스크립트 실행
createFlatStructureTable();