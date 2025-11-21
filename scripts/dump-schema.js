const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function dumpSchema() {
  // 직접 connection string 구성 (% 문자는 %25로 인코딩)
  const dbUrl = 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres';

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ 개발 DB 연결 성공');

    // 1. 모든 테이블 목록 가져오기
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('📋 테이블 개수:', tablesResult.rows.length);

    let schemaSQL = '-- 개발 DB 스키마 덤프\n';
    schemaSQL += '-- 생성일: ' + new Date().toISOString() + '\n';
    schemaSQL += '-- 프로젝트: ' + process.env.SUPABASE_PROJECT_REF + '\n\n';

    // 2. Extensions
    schemaSQL += '-- Extensions\n';
    schemaSQL += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';

    // 3. 각 테이블의 CREATE 문 생성
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      console.log(`📄 처리 중: ${tableName}`);

      // 테이블 구조 조회
      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      schemaSQL += `\n-- 테이블: ${tableName}\n`;
      schemaSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      schemaSQL += `CREATE TABLE ${tableName} (\n`;

      const columns = columnsResult.rows.map((col) => {
        let def = `  ${col.column_name} `;

        // 데이터 타입
        if (col.data_type === 'character varying') {
          def += `varchar`;
          if (col.character_maximum_length) {
            def += `(${col.character_maximum_length})`;
          }
        } else if (col.data_type === 'numeric' && col.numeric_precision) {
          def += `numeric(${col.numeric_precision}`;
          if (col.numeric_scale) {
            def += `,${col.numeric_scale}`;
          }
          def += ')';
        } else if (col.data_type === 'timestamp without time zone') {
          def += 'timestamp';
        } else if (col.data_type === 'timestamp with time zone') {
          def += 'timestamptz';
        } else {
          def += col.data_type;
        }

        // NOT NULL
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }

        // DEFAULT
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }

        return def;
      }).join(',\n');

      schemaSQL += columns + '\n);\n';

      // Primary Key 조회
      const pkResult = await client.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary
      `, [tableName]);

      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(r => r.attname).join(', ');
        schemaSQL += `ALTER TABLE ${tableName} ADD PRIMARY KEY (${pkColumns});\n`;
      }

      schemaSQL += '\n';
    }

    // 4. Foreign Keys 조회
    console.log('🔗 Foreign Keys 처리 중...');
    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);

    if (fkResult.rows.length > 0) {
      schemaSQL += '\n-- Foreign Keys\n';
      for (const fk of fkResult.rows) {
        schemaSQL += `ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} `;
        schemaSQL += `FOREIGN KEY (${fk.column_name}) `;
        schemaSQL += `REFERENCES ${fk.foreign_table_name} (${fk.foreign_column_name});\n`;
      }
    }

    // 5. Indexes 조회
    console.log('📇 Indexes 처리 중...');
    const indexResult = await client.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname
    `);

    if (indexResult.rows.length > 0) {
      schemaSQL += '\n-- Indexes\n';
      for (const idx of indexResult.rows) {
        schemaSQL += `${idx.indexdef};\n`;
      }
    }

    // 6. 파일로 저장
    fs.writeFileSync('schema.sql', schemaSQL, 'utf8');
    console.log('\n✅ schema.sql 파일 생성 완료!');
    console.log('📍 위치:', require('path').resolve('schema.sql'));
    console.log('📊 총 테이블 수:', tablesResult.rows.length);

  } catch (error) {
    console.error('❌ 에러:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

dumpSchema();
