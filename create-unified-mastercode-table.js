// 통합 마스터코드 테이블 생성 및 데이터 마이그레이션

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUnifiedMasterCodeTable() {
  try {
    console.log('🚀 통합 마스터코드 테이블 생성 및 마이그레이션 시작...');

    // 1. 새 통합 테이블 생성
    console.log('📋 admin_mastercode 테이블 생성 중...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS admin_mastercode (
        id SERIAL PRIMARY KEY,
        parent_id INTEGER REFERENCES admin_mastercode(id) ON DELETE CASCADE,
        code_group VARCHAR(50),        -- 최상위 레벨만 사용 (NULL for 서브코드)
        code_value VARCHAR(50),        -- 서브코드 레벨만 사용 (NULL for 마스터코드)
        code_name VARCHAR(100) NOT NULL,
        code_description TEXT,
        level INTEGER DEFAULT 0,       -- 0: 마스터, 1: 서브, 2: 하위서브...
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(50) DEFAULT 'system',
        updated_by VARCHAR(50) DEFAULT 'system',
        metadata JSONB
      );
    `;

    const { error: createError } = await supabase.rpc('execute_sql', {
      sql: createTableSQL
    });

    if (createError) {
      // SQL 함수가 없으면 직접 실행
      console.log('⚠️ RPC 함수 없음, 대안 방법 사용...');

      // 직접 테이블 생성 (Supabase에서 지원되는 방법)
      const { error: directError } = await supabase
        .from('admin_mastercode')
        .select('id')
        .limit(1);

      if (directError && directError.code === '42P01') {
        console.log('❌ 테이블 생성 권한이 필요합니다. Supabase 대시보드에서 SQL 실행 필요');
        console.log('📋 다음 SQL을 Supabase SQL Editor에서 실행해주세요:');
        console.log(createTableSQL);
        return;
      }
    }

    console.log('✅ admin_mastercode 테이블 준비 완료');

    // 2. 기존 데이터 조회
    console.log('📥 기존 데이터 조회 중...');

    const { data: masterCodes, error: masterError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .order('id');

    if (masterError) {
      throw masterError;
    }

    const { data: subCodes, error: subError } = await supabase
      .from('admin_mastercode_subcode')
      .select('*')
      .order('mastercode_id', { ascending: true })
      .order('display_order', { ascending: true });

    if (subError) {
      throw subError;
    }

    console.log(`📊 마스터코드: ${masterCodes.length}개, 서브코드: ${subCodes.length}개`);

    // 3. 통합 테이블에 데이터 마이그레이션
    console.log('🔄 데이터 마이그레이션 시작...');

    const unifiedData = [];

    // 마스터코드들을 먼저 삽입 (parent_id = null, level = 0)
    for (const masterCode of masterCodes) {
      unifiedData.push({
        parent_id: null,
        code_group: masterCode.code_group,
        code_value: null,
        code_name: masterCode.code_group_name || masterCode.group_name,
        code_description: masterCode.code_group_description || masterCode.group_description || '',
        level: 0,
        display_order: masterCode.display_order || 0,
        is_active: masterCode.is_active !== false,
        is_system: masterCode.is_system || false,
        created_by: masterCode.created_by || 'system',
        updated_by: masterCode.updated_by || 'system',
        metadata: {
          original_master_id: masterCode.id,
          migrated_at: new Date().toISOString()
        }
      });
    }

    // 먼저 마스터코드들 삽입
    const { data: insertedMasters, error: insertMasterError } = await supabase
      .from('admin_mastercode')
      .insert(unifiedData)
      .select('id, code_group, metadata');

    if (insertMasterError) {
      throw insertMasterError;
    }

    console.log(`✅ 마스터코드 ${insertedMasters.length}개 삽입 완료`);

    // 마스터코드 ID 매핑 생성
    const masterIdMapping = {};
    insertedMasters.forEach(inserted => {
      const originalId = inserted.metadata.original_master_id;
      masterIdMapping[originalId] = inserted.id;
    });

    // 서브코드들 삽입 (parent_id = 새로운 마스터코드 ID, level = 1)
    const subCodeData = [];
    for (const subCode of subCodes) {
      const newParentId = masterIdMapping[subCode.mastercode_id];
      if (newParentId) {
        subCodeData.push({
          parent_id: newParentId,
          code_group: null,
          code_value: subCode.sub_code || subCode.code_value,
          code_name: subCode.sub_code_name || subCode.code_name || '이름없음',
          code_description: subCode.sub_code_description || subCode.code_description || '',
          level: 1,
          display_order: subCode.display_order || 0,
          is_active: subCode.is_active !== false,
          is_system: subCode.is_system || false,
          created_by: subCode.created_by || 'system',
          updated_by: subCode.updated_by || 'system',
          metadata: {
            original_subcode_id: subCode.id,
            original_master_id: subCode.mastercode_id,
            migrated_at: new Date().toISOString()
          }
        });
      }
    }

    if (subCodeData.length > 0) {
      const { data: insertedSubs, error: insertSubError } = await supabase
        .from('admin_mastercode')
        .insert(subCodeData)
        .select('id');

      if (insertSubError) {
        throw insertSubError;
      }

      console.log(`✅ 서브코드 ${insertedSubs.length}개 삽입 완료`);
    }

    // 4. 마이그레이션 결과 확인
    const { data: finalData, error: finalError } = await supabase
      .from('admin_mastercode')
      .select('*')
      .order('level', { ascending: true })
      .order('display_order', { ascending: true });

    if (finalError) {
      throw finalError;
    }

    console.log('🎉 마이그레이션 완료!');
    console.log('📊 최종 결과:');

    const masters = finalData.filter(item => item.level === 0);
    const subs = finalData.filter(item => item.level === 1);

    console.log(`  - 마스터코드: ${masters.length}개`);
    masters.forEach(master => {
      const masterSubs = subs.filter(sub => sub.parent_id === master.id);
      console.log(`    └ ${master.code_group}: ${master.code_name} (${masterSubs.length}개 서브코드)`);
      masterSubs.forEach(sub => {
        console.log(`      └ ${sub.code_value}: ${sub.code_name}`);
      });
    });

    console.log(`  - 서브코드: ${subs.length}개`);
    console.log('✅ 통합 테이블 생성 및 마이그레이션 성공!');

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
createUnifiedMasterCodeTable();