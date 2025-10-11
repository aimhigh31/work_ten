// 시스템설정 페이지 테스트 스크립트
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function testSystemSettingsPage() {
  console.log('🔄 시스템설정 페이지 테스트 시작...');
  
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1단계: admin_systemsetting_system 테이블 확인
    console.log('\n1️⃣ admin_systemsetting_system 테이블 확인...');
    const systemSettingsResult = await client.query(`
      SELECT setting_key, setting_value, setting_type 
      FROM admin_systemsetting_system 
      ORDER BY setting_type, setting_key
    `);
    
    console.log(`📊 admin_systemsetting_system 테이블: ${systemSettingsResult.rows.length}개 레코드`);
    systemSettingsResult.rows.forEach(row => {
      console.log(`   - ${row.setting_key}: ${row.setting_value} (${row.setting_type})`);
    });

    // 2단계: admin_systemsetting_menu 테이블 확인 (메뉴 관리탭용)
    console.log('\n2️⃣ admin_systemsetting_menu 테이블 확인...');
    const menuResult = await client.query(`
      SELECT COUNT(*) as total_count,
             COUNT(CASE WHEN is_enabled = true THEN 1 END) as enabled_count
      FROM admin_systemsetting_menu
    `);
    
    console.log(`📊 admin_systemsetting_menu 테이블:`);
    console.log(`   - 총 메뉴: ${menuResult.rows[0].total_count}개`);
    console.log(`   - 활성 메뉴: ${menuResult.rows[0].enabled_count}개`);

    // 3단계: 관리자메뉴 그룹 확인
    console.log('\n3️⃣ 관리자메뉴 그룹 확인...');
    const adminMenuResult = await client.query(`
      SELECT menu_page, display_order, is_enabled 
      FROM admin_systemsetting_menu 
      WHERE menu_category = '관리자메뉴' 
      ORDER BY display_order
    `);
    
    console.log('📋 관리자메뉴 구조:');
    adminMenuResult.rows.forEach(row => {
      const status = row.is_enabled ? '✅' : '❌';
      console.log(`   [${row.display_order}] ${row.menu_page} ${status}`);
    });

    // 4단계: 일반설정 기본값 확인
    console.log('\n4️⃣ 일반설정 기본값 확인...');
    const generalSettings = await client.query(`
      SELECT setting_key, setting_value 
      FROM admin_systemsetting_system 
      WHERE setting_type = 'general'
      ORDER BY setting_key
    `);
    
    console.log('📝 일반설정 현재값:');
    generalSettings.rows.forEach(row => {
      console.log(`   - ${row.setting_key}: ${row.setting_value}`);
    });

    // 5단계: 누락된 기본 설정 추가 (필요시)
    console.log('\n5️⃣ 기본 설정 완성도 확인...');
    const requiredSettings = [
      { key: 'site_name', value: '"Admin Dashboard"', type: 'general' },
      { key: 'site_description', value: '"Next.js 관리자 시스템"', type: 'general' },
      { key: 'site_logo', value: 'null', type: 'appearance' },
      { key: 'maintenance_mode', value: 'false', type: 'maintenance' },
      { key: 'maintenance_message', value: '"시스템 점검 중입니다. 잠시 후 다시 시도해 주세요."', type: 'maintenance' },
      { key: 'email_notifications', value: 'true', type: 'notification' },
      { key: 'sms_notifications', value: 'false', type: 'notification' }
    ];
    
    for (const setting of requiredSettings) {
      const existsResult = await client.query(
        'SELECT COUNT(*) as count FROM admin_systemsetting_system WHERE setting_key = $1',
        [setting.key]
      );
      
      if (existsResult.rows[0].count === 0) {
        console.log(`⚠️ 누락된 설정 발견: ${setting.key}, 추가 중...`);
        await client.query(`
          INSERT INTO admin_systemsetting_system (setting_key, setting_value, setting_type, description)
          VALUES ($1, $2, $3, $4)
        `, [setting.key, setting.value, setting.type, `${setting.key} 설정`]);
        console.log(`✅ ${setting.key} 설정 추가 완료`);
      }
    }

    // 6단계: 최종 상태 확인
    console.log('\n6️⃣ 최종 설정 상태 확인...');
    const finalCheck = await client.query(`
      SELECT 
        setting_type,
        COUNT(*) as count,
        string_agg(setting_key, ', ' ORDER BY setting_key) as keys
      FROM admin_systemsetting_system 
      GROUP BY setting_type
      ORDER BY setting_type
    `);
    
    console.log('📊 설정 타입별 현황:');
    finalCheck.rows.forEach(row => {
      console.log(`   ${row.setting_type}: ${row.count}개`);
      console.log(`     - ${row.keys}`);
    });

    return true;
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

testSystemSettingsPage().then((success) => {
  if (success) {
    console.log('\n🎉 시스템설정 페이지 테스트 완료!');
    console.log('✅ DB 테이블 구조 확인됨: admin_systemsetting_system, admin_systemsetting_menu');
    console.log('🌐 브라우저에서 http://localhost:3200/admin-panel/system-settings 접속하여 확인하세요.');
  } else {
    console.log('\n❌ 시스템설정 페이지 테스트 실패');
  }
  process.exit(success ? 0 : 1);
});