// system_settings 테이블을 admin_systemsetting_system으로 이름 변경
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function renameSystemSettingsTable() {
  console.log('🔄 system_settings 테이블을 admin_systemsetting_system으로 이름 변경 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: 기존 테이블 존재 확인
    console.log('\n1️⃣ 기존 테이블 존재 확인...');
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_settings'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    console.log(`system_settings 테이블 존재: ${tableExists}`);

    if (!tableExists) {
      console.log('⚠️ system_settings 테이블이 존재하지 않습니다. 새로 생성합니다.');
      
      // 테이블이 없으면 새로운 이름으로 생성
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_systemsetting_system (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value JSONB NOT NULL,
          setting_type VARCHAR(50) DEFAULT 'general',
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      // 기본 데이터 삽입
      await client.query(`
        INSERT INTO admin_systemsetting_system (setting_key, setting_value, setting_type, description) VALUES
        ('site_name', '"Admin Dashboard"', 'general', '사이트 이름'),
        ('site_description', '"Next.js 관리자 시스템"', 'general', '사이트 설명'),
        ('site_logo', 'null', 'appearance', '사이트 로고 URL'),
        ('maintenance_mode', 'false', 'maintenance', '유지보수 모드 활성화'),
        ('maintenance_message', '"시스템 점검 중입니다. 잠시 후 다시 시도해 주세요."', 'maintenance', '유지보수 모드 메시지'),
        ('email_notifications', 'true', 'notification', '이메일 알림 활성화'),
        ('sms_notifications', 'false', 'notification', 'SMS 알림 활성화')
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_at = NOW();
      `);
      
      console.log('✅ admin_systemsetting_system 테이블 생성 및 기본 데이터 삽입 완료');
    } else {
      // 2단계: 새 테이블 이름이 이미 존재하는지 확인
      console.log('\n2️⃣ 새 테이블 이름 충돌 확인...');
      const newTableExistsResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'admin_systemsetting_system'
        );
      `);
      
      const newTableExists = newTableExistsResult.rows[0].exists;
      console.log(`admin_systemsetting_system 테이블 존재: ${newTableExists}`);

      if (newTableExists) {
        console.log('⚠️ admin_systemsetting_system 테이블이 이미 존재합니다. 기존 데이터를 백업하고 삭제 후 이름을 변경합니다.');
        
        // 기존 새 테이블 삭제 (필요시 백업)
        const backupResult = await client.query('SELECT COUNT(*) as count FROM admin_systemsetting_system');
        console.log(`기존 admin_systemsetting_system 테이블의 레코드 수: ${backupResult.rows[0].count}`);
        
        await client.query('DROP TABLE IF EXISTS admin_systemsetting_system');
        console.log('✅ 기존 admin_systemsetting_system 테이블 삭제');
      }

      // 3단계: 기존 데이터 확인
      console.log('\n3️⃣ 기존 system_settings 데이터 확인...');
      const dataCountResult = await client.query('SELECT COUNT(*) as count FROM system_settings');
      console.log(`system_settings 테이블의 레코드 수: ${dataCountResult.rows[0].count}`);

      const sampleDataResult = await client.query('SELECT setting_key, setting_type FROM system_settings LIMIT 5');
      console.log('샘플 데이터:');
      sampleDataResult.rows.forEach(row => {
        console.log(`  - ${row.setting_key} (${row.setting_type})`);
      });

      // 4단계: 테이블 이름 변경
      console.log('\n4️⃣ 테이블 이름 변경 실행...');
      await client.query('ALTER TABLE system_settings RENAME TO admin_systemsetting_system');
      console.log('✅ system_settings → admin_systemsetting_system 이름 변경 완료');
    }

    // 5단계: 인덱스 재생성 (필요시)
    console.log('\n5️⃣ 인덱스 재생성...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_systemsetting_system_key 
      ON admin_systemsetting_system(setting_key);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_systemsetting_system_type 
      ON admin_systemsetting_system(setting_type);
    `);
    console.log('✅ 인덱스 재생성 완료');

    // 6단계: RLS 정책 재설정
    console.log('\n6️⃣ RLS 정책 재설정...');
    
    // 기존 정책 삭제 (에러 무시)
    try {
      await client.query('DROP POLICY IF EXISTS "Allow read access for all users" ON admin_systemsetting_system');
      await client.query('DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON admin_systemsetting_system');
    } catch (err) {
      console.log('기존 정책 삭제 중 일부 오류 (무시): ', err.message);
    }

    // RLS 활성화
    await client.query('ALTER TABLE admin_systemsetting_system ENABLE ROW LEVEL SECURITY');
    
    // 새 정책 생성
    await client.query(`
      CREATE POLICY "Allow read access for all users" ON admin_systemsetting_system
        FOR SELECT USING (true)
    `);
    
    await client.query(`
      CREATE POLICY "Allow all operations for authenticated users" ON admin_systemsetting_system
        FOR ALL USING (auth.uid() IS NOT NULL)
    `);
    
    console.log('✅ RLS 정책 재설정 완료');

    // 7단계: 트리거 재생성
    console.log('\n7️⃣ 트리거 재생성...');
    
    // 기존 트리거 삭제
    await client.query('DROP TRIGGER IF EXISTS update_system_settings_updated_at ON admin_systemsetting_system');
    
    // 새 트리거 생성
    await client.query(`
      CREATE TRIGGER update_admin_systemsetting_system_updated_at 
        BEFORE UPDATE ON admin_systemsetting_system 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
    
    console.log('✅ 트리거 재생성 완료');

    // 8단계: 최종 확인
    console.log('\n8️⃣ 최종 확인...');
    const finalCheckResult = await client.query(`
      SELECT 
        COUNT(*) as record_count,
        COUNT(DISTINCT setting_type) as type_count
      FROM admin_systemsetting_system
    `);
    
    console.log(`✅ admin_systemsetting_system 테이블:`);
    console.log(`   - 총 레코드 수: ${finalCheckResult.rows[0].record_count}`);
    console.log(`   - 설정 타입 수: ${finalCheckResult.rows[0].type_count}`);

    const settingsResult = await client.query(`
      SELECT setting_key, setting_type 
      FROM admin_systemsetting_system 
      ORDER BY setting_type, setting_key
    `);
    
    console.log('📋 모든 설정 목록:');
    settingsResult.rows.forEach(row => {
      console.log(`   - ${row.setting_key} (${row.setting_type})`);
    });

    return true;
  } catch (error) {
    console.error('❌ 테이블 이름 변경 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

renameSystemSettingsTable().then((success) => {
  if (success) {
    console.log('\n🎉 테이블 이름 변경 완료!');
    console.log('✅ system_settings → admin_systemsetting_system');
    console.log('📝 다음 단계: 관련 코드에서 테이블명 업데이트 필요');
  } else {
    console.log('\n❌ 테이블 이름 변경 실패');
  }
  process.exit(success ? 0 : 1);
});