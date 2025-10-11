// 간단한 테이블 생성 (단계별)
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createTableStep() {
  console.log('🔨 Admin_Systemsetting_Menu 테이블 생성...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 기본 테이블 생성
    console.log('\n1️⃣ 기본 테이블 생성...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "Admin_Systemsetting_Menu" (
        "id" bigserial PRIMARY KEY,
        "created_at" timestamptz DEFAULT now() NOT NULL,
        "updated_at" timestamptz DEFAULT now() NOT NULL,
        "menu_level" integer NOT NULL DEFAULT 0,
        "menu_category" varchar(100) NOT NULL,
        "menu_icon" varchar(50),
        "menu_page" varchar(100) NOT NULL,
        "menu_description" text,
        "menu_url" varchar(200) NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "display_order" integer NOT NULL DEFAULT 0,
        "created_by" varchar(100) NOT NULL DEFAULT 'system',
        "updated_by" varchar(100) NOT NULL DEFAULT 'system'
      );
    `;
    
    await client.query(createTableSQL);
    console.log('✅ 테이블 생성 완료');

    // 2단계: 인덱스 생성
    console.log('\n2️⃣ 인덱스 생성...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_category" ON "Admin_Systemsetting_Menu"("menu_category");',
      'CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_level" ON "Admin_Systemsetting_Menu"("menu_level");',
      'CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_enabled" ON "Admin_Systemsetting_Menu"("is_enabled");',
      'CREATE INDEX IF NOT EXISTS "idx_admin_systemsetting_menu_order" ON "Admin_Systemsetting_Menu"("display_order");'
    ];
    
    for (const indexSQL of indexes) {
      await client.query(indexSQL);
    }
    console.log('✅ 인덱스 생성 완료');

    // 3단계: RLS 설정
    console.log('\n3️⃣ RLS 정책 설정...');
    await client.query('ALTER TABLE "Admin_Systemsetting_Menu" ENABLE ROW LEVEL SECURITY;');
    
    const policySQL = `
      CREATE POLICY IF NOT EXISTS "Admin_Systemsetting_Menu_모든_작업_허용"
      ON "Admin_Systemsetting_Menu"
      FOR ALL
      USING (true)
      WITH CHECK (true);
    `;
    
    await client.query(policySQL);
    console.log('✅ RLS 정책 설정 완료');

    // 4단계: 샘플 데이터 삽입
    console.log('\n4️⃣ 샘플 데이터 삽입...');
    const sampleData = `
      INSERT INTO "Admin_Systemsetting_Menu" (
        menu_level, menu_category, menu_icon, menu_page, 
        menu_description, menu_url, is_enabled, display_order,
        created_by, updated_by
      ) VALUES 
      (0, '관리자메뉴', 'Setting2', '관리자메뉴', '시스템 관리 메뉴', '/', true, 1, 'system', 'system'),
      (1, '관리자메뉴', 'Setting2', '시스템설정', '시스템 기본 설정 관리', '/admin-panel/system-settings', true, 2, 'system', 'system'),
      (1, '관리자메뉴', 'Profile', '사용자관리', '사용자 계정 관리', '/admin-panel/user-settings', true, 3, 'system', 'system'),
      (0, '메인메뉴', 'Home3', '메인메뉴', '메인 대시보드', '/', true, 4, 'system', 'system'),
      (1, '메인메뉴', 'Chart', '대시보드', '현황 대시보드', '/dashboard/default', true, 5, 'system', 'system'),
      (1, '메인메뉴', 'TaskSquare', '업무관리', '업무 프로세스 관리', '/apps/task-management', true, 6, 'system', 'system'),
      (0, '기획메뉴', 'Category2', '기획메뉴', '기획 업무 관리', '/', true, 7, 'system', 'system'),
      (1, '기획메뉴', 'Money', '비용관리', '프로젝트 비용 관리', '/apps/cost-management', true, 8, 'system', 'system'),
      (1, '기획메뉴', 'Book1', '교육관리', '교육 과정 관리', '/apps/education-management', true, 9, 'system', 'system')
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await client.query(sampleData);
    console.log('✅ 샘플 데이터 삽입 완료');

    // 5단계: 최종 확인
    console.log('\n5️⃣ 최종 확인...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM "Admin_Systemsetting_Menu"');
    console.log(`📊 테이블 데이터 개수: ${countResult.rows[0].count}개`);

    const sampleResult = await client.query(`
      SELECT id, menu_level, menu_category, menu_page, is_enabled, display_order
      FROM "Admin_Systemsetting_Menu" 
      ORDER BY display_order 
      LIMIT 5
    `);
    
    console.log('\n📋 샘플 데이터:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. [${row.id}] ${row.menu_page} (${row.menu_category}) - 레벨:${row.menu_level} 활성:${row.is_enabled}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 테이블 생성 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

createTableStep().then((success) => {
  if (success) {
    console.log('\n🎉 테이블 생성 완료!');
    console.log('✅ Admin_Systemsetting_Menu 테이블과 데이터가 준비되었습니다.');
  } else {
    console.log('\n❌ 테이블 생성 실패');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 작업 실패:', error);
  process.exit(1);
});