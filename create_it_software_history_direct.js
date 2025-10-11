const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL 직접 연결 설정
const client = new Client({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zvcjffkxgqjhpbwdvdja',
  password: 'nexwork123!@#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function createSoftwareHistoryTableDirect() {
  try {
    console.log('🔗 PostgreSQL 직접 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!');

    console.log('🏗️ it_software_history 테이블 생성 중...');

    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.it_software_history (
        id SERIAL PRIMARY KEY,
        software_id INTEGER NOT NULL REFERENCES public.it_software_data(id) ON DELETE CASCADE,
        history_type VARCHAR(50) NOT NULL DEFAULT '구매',
        purchase_date DATE,
        supplier VARCHAR(200),
        price DECIMAL(12, 2),
        quantity INTEGER DEFAULT 1,
        maintenance_start_date DATE,
        maintenance_end_date DATE,
        contract_number VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT '진행중',
        memo TEXT,
        registration_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ 테이블 생성 완료!');

    // 인덱스 생성
    console.log('📊 인덱스 생성 중...');

    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_it_software_history_software_id
       ON public.it_software_history(software_id);`,

      `CREATE INDEX IF NOT EXISTS idx_it_software_history_type
       ON public.it_software_history(history_type);`,

      `CREATE INDEX IF NOT EXISTS idx_it_software_history_active
       ON public.it_software_history(is_active);`,

      `CREATE INDEX IF NOT EXISTS idx_it_software_history_composite
       ON public.it_software_history(software_id, is_active);`,

      `CREATE INDEX IF NOT EXISTS idx_it_software_history_date
       ON public.it_software_history(purchase_date);`
    ];

    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    console.log('✅ 인덱스 생성 완료!');

    // RLS 정책 설정
    console.log('🔐 RLS 정책 설정 중...');

    const rls = [
      `ALTER TABLE public.it_software_history ENABLE ROW LEVEL SECURITY;`,

      `CREATE POLICY IF NOT EXISTS "Enable read access for all users"
       ON public.it_software_history FOR SELECT
       USING (true);`,

      `CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users"
       ON public.it_software_history FOR ALL
       USING (true)
       WITH CHECK (true);`
    ];

    for (const rlsSQL of rls) {
      try {
        await client.query(rlsSQL);
      } catch (rlsError) {
        if (rlsError.message.includes('already exists')) {
          console.log('   정책이 이미 존재함');
        } else {
          console.warn('   RLS 정책 설정 중 오류:', rlsError.message);
        }
      }
    }
    console.log('✅ RLS 정책 설정 완료!');

    // 권한 설정
    console.log('🔑 권한 설정 중...');
    await client.query(`GRANT ALL ON public.it_software_history TO anon, authenticated;`);
    await client.query(`GRANT USAGE, SELECT ON SEQUENCE public.it_software_history_id_seq TO anon, authenticated;`);
    console.log('✅ 권한 설정 완료!');

    // 테이블 구조 확인
    console.log('\n📋 생성된 테이블 구조 확인:');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'it_software_history'
      ORDER BY ordinal_position;
    `);

    console.log('====================================');
    structureResult.rows.forEach(col => {
      const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL';
      const defaultVal = col.column_default ? ` DEFAULT: ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${nullable}${defaultVal}`);
    });
    console.log('====================================');

    // 샘플 데이터 삽입
    console.log('\n📝 샘플 데이터 삽입 중...');

    // 먼저 유효한 software_id 찾기
    const softwareResult = await client.query(`
      SELECT id, software_name
      FROM public.it_software_data
      WHERE is_active = true
      LIMIT 1;
    `);

    if (softwareResult.rows.length > 0) {
      const softwareId = softwareResult.rows[0].id;
      const softwareName = softwareResult.rows[0].software_name;

      console.log(`   대상 소프트웨어: ${softwareName} (ID: ${softwareId})`);

      const sampleData = [
        {
          software_id: softwareId,
          history_type: '구매',
          purchase_date: '2024-01-15',
          supplier: '소프트웨어코리아',
          price: 5000000,
          quantity: 10,
          contract_number: 'SW-2024-001',
          description: '초기 라이센스 구매',
          status: '완료',
          memo: '10개 라이센스 구매 완료',
          registration_date: '2024-01-15'
        },
        {
          software_id: softwareId,
          history_type: '유지보수',
          maintenance_start_date: '2024-02-01',
          maintenance_end_date: '2025-01-31',
          supplier: '테크서포트',
          price: 1200000,
          contract_number: 'MAINT-2024-001',
          description: '연간 유지보수 계약',
          status: '진행중',
          memo: '24시간 기술지원 및 업데이트 포함',
          registration_date: '2024-02-01'
        }
      ];

      for (const data of sampleData) {
        const insertSQL = `
          INSERT INTO public.it_software_history (
            software_id, history_type, purchase_date, supplier, price, quantity,
            maintenance_start_date, maintenance_end_date, contract_number,
            description, status, memo, registration_date,
            created_by, updated_by, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            'system', 'system', true
          );
        `;

        await client.query(insertSQL, [
          data.software_id, data.history_type, data.purchase_date,
          data.supplier, data.price, data.quantity,
          data.maintenance_start_date || null, data.maintenance_end_date || null,
          data.contract_number, data.description, data.status, data.memo,
          data.registration_date
        ]);
      }

      console.log('✅ 샘플 데이터 2개 삽입 완료!');
    } else {
      console.log('⚠️ 활성 소프트웨어가 없어 샘플 데이터를 건너뜁니다.');
    }

    // 데이터 확인
    const countResult = await client.query('SELECT COUNT(*) as count FROM public.it_software_history;');
    console.log(`\n📈 총 ${countResult.rows[0].count}개의 이력 데이터가 있습니다.`);

    console.log('\n🎉 it_software_history 테이블 생성 완료!');
    console.log('   이제 소프트웨어관리 페이지에서 구매/유지보수이력을 관리할 수 있습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 정보:', error);
  } finally {
    await client.end();
    console.log('\n🔚 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
createSoftwareHistoryTableDirect();