const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTableDirectly() {
  console.log('🔄 PostgreSQL 직접 연결로 테이블 생성 중...\n');

  // PostgreSQL 직접 연결 설정
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS security_accident_report (
        id SERIAL PRIMARY KEY,
        accident_id INTEGER NOT NULL REFERENCES security_accident_data(id) ON DELETE CASCADE,

        -- Step 1: 사고탐지
        discovery_datetime TIMESTAMP,
        discoverer VARCHAR(100),
        discovery_method VARCHAR(100),
        report_datetime TIMESTAMP,
        reporter VARCHAR(100),
        report_method VARCHAR(100),

        -- Step 2: 현황분석
        incident_target TEXT,
        incident_cause TEXT,
        affected_systems TEXT,
        affected_data TEXT,
        service_impact VARCHAR(50),
        business_impact VARCHAR(50),
        situation_details TEXT,

        -- Step 3: 개선조치중
        response_method VARCHAR(100),
        improvement_executor VARCHAR(100),
        expected_completion_date DATE,
        improvement_details TEXT,

        -- Step 4: 즉시해결
        completion_date DATE,
        completion_approver VARCHAR(100),
        resolution_details TEXT,

        -- Step 5: 근본개선
        prevention_details TEXT,

        -- 메타데이터
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',

        -- 인덱스를 위한 고유 제약
        UNIQUE(accident_id)
      );
    `;

    const result = await client.query(createTableQuery);
    console.log('✅ 테이블 생성 성공:', result);

    // 테이블 생성 확인
    const checkTableQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'security_accident_report';
    `;

    const checkResult = await client.query(checkTableQuery);
    if (checkResult.rows.length > 0) {
      console.log('✅ security_accident_report 테이블이 성공적으로 생성되었습니다.');

      // 테이블 구조 확인
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'security_accident_report'
        ORDER BY ordinal_position;
      `;

      const columnsResult = await client.query(columnsQuery);
      console.log('📋 테이블 구조:');
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

    } else {
      console.log('❌ 테이블 생성 실패');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await client.end();
  }
}

createTableDirectly();