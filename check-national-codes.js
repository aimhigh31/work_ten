const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkNationalCodes() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
  });

  try {
    await client.connect();
    console.log('🔗 데이터베이스 연결 성공');

    // NATIONAL 코드그룹의 서브코드들 확인
    console.log('\n📊 NATIONAL 코드그룹의 서브코드 목록:');
    const nationalCodes = await client.query(`
      SELECT id, subcode, subcode_name, subcode_description, subcode_status
      FROM admin_mastercode_data
      WHERE group_code = 'NATIONAL'
      ORDER BY id;
    `);

    if (nationalCodes.rows.length === 0) {
      console.log('❌ NATIONAL 코드그룹에 서브코드가 없습니다.');

      console.log('\n🔧 샘플 국가 데이터를 추가합니다...');

      const sampleCountries = [
        { subcode: 'KR', subcode_name: '대한민국', description: 'Republic of Korea' },
        { subcode: 'US', subcode_name: '미국', description: 'United States' },
        { subcode: 'JP', subcode_name: '일본', description: 'Japan' },
        { subcode: 'CN', subcode_name: '중국', description: 'China' },
        { subcode: 'GB', subcode_name: '영국', description: 'United Kingdom' },
        { subcode: 'DE', subcode_name: '독일', description: 'Germany' },
        { subcode: 'FR', subcode_name: '프랑스', description: 'France' },
        { subcode: 'CA', subcode_name: '캐나다', description: 'Canada' },
        { subcode: 'AU', subcode_name: '호주', description: 'Australia' },
        { subcode: 'SG', subcode_name: '싱가포르', description: 'Singapore' }
      ];

      for (const country of sampleCountries) {
        await client.query(`
          INSERT INTO admin_mastercode_data (
            group_code, subcode, subcode_name, subcode_description, subcode_status
          ) VALUES ($1, $2, $3, $4, $5)
        `, ['NATIONAL', country.subcode, country.subcode_name, country.description, 'active']);
      }

      console.log(`✅ ${sampleCountries.length}개 국가 데이터 추가 완료`);

      // 다시 조회
      const updatedCodes = await client.query(`
        SELECT id, subcode, subcode_name, subcode_description, subcode_status
        FROM admin_mastercode_data
        WHERE group_code = 'NATIONAL'
        ORDER BY id;
      `);

      updatedCodes.rows.forEach((country, index) => {
        console.log(`  ${index + 1}. ${country.subcode_name} (${country.subcode}) - ${country.subcode_description}`);
      });

    } else {
      console.log(`✅ ${nationalCodes.rows.length}개의 국가 코드를 찾았습니다:`);
      nationalCodes.rows.forEach((country, index) => {
        const status = country.subcode_status === 'active' ? '✅' : '❌';
        console.log(`  ${index + 1}. ${status} ${country.subcode_name} (${country.subcode}) - ${country.subcode_description || 'N/A'}`);
      });
    }

    // 활성화된 국가만 필터링
    console.log('\n🌍 활성화된 국가 목록:');
    const activeCodes = await client.query(`
      SELECT subcode, subcode_name
      FROM admin_mastercode_data
      WHERE group_code = 'NATIONAL' AND subcode_status = 'active'
      ORDER BY subcode_name;
    `);

    activeCodes.rows.forEach((country, index) => {
      console.log(`  ${index + 1}. ${country.subcode_name} (${country.subcode})`);
    });

    console.log('\n🎯 UI에서 사용할 형태로 매핑된 데이터:');
    const mappedData = activeCodes.rows.map(country => ({
      value: country.subcode_name,
      label: country.subcode_name,
      code: country.subcode
    }));

    console.log(JSON.stringify(mappedData, null, 2));

  } catch (error) {
    console.error('❌ 데이터베이스 오류:', error.message);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
checkNationalCodes();