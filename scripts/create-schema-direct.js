#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Service Role Key가 필요합니다.');
  process.exit(1);
}

// Service Role Key로 관리자 권한 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCompleteSchema() {
  console.log('🚀 Nexwork 완전 스키마 생성 시작...');
  
  try {
    // 1. UUID 확장 활성화
    console.log('📦 UUID 확장 활성화...');
    const { error: uuidError } = await supabase.rpc('sql', {
      query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });
    
    if (!uuidError) {
      console.log('✅ UUID 확장 활성화 완료');
    }

    // 2. 사용자 프로필 테이블 생성
    console.log('👥 사용자 프로필 테이블 생성...');
    const userProfilesSQL = `
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
        department TEXT,
        position TEXT,
        nextauth_migrated BOOLEAN DEFAULT FALSE,
        nextauth_original_id TEXT,
        migration_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view own profile" ON user_profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY IF NOT EXISTS "Users can update own profile" ON user_profiles
        FOR UPDATE USING (auth.uid() = id);
    `;

    const { error: profileError } = await supabase.rpc('sql', {
      query: userProfilesSQL
    });

    if (profileError) {
      console.error('❌ 사용자 프로필 테이블 생성 실패:', profileError);
    } else {
      console.log('✅ 사용자 프로필 테이블 생성 완료');
    }

    // 3. 코드 시퀀스 테이블 생성
    console.log('🔢 코드 시퀀스 테이블 생성...');
    const codeSequenceSQL = `
      CREATE TABLE IF NOT EXISTS code_sequences (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        module_type TEXT NOT NULL,
        year INTEGER NOT NULL,
        current_sequence INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(module_type, year)
      );
    `;

    const { error: seqError } = await supabase.rpc('sql', {
      query: codeSequenceSQL
    });

    if (!seqError) {
      console.log('✅ 코드 시퀀스 테이블 생성 완료');
    }

    // 4. 비용 관리 테이블들 생성
    console.log('💰 비용관리 테이블들 생성...');
    const costTablesSQL = `
      CREATE TABLE IF NOT EXISTS cost_records (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        registration_date DATE NOT NULL,
        start_date DATE NOT NULL,
        code TEXT UNIQUE NOT NULL,
        team TEXT NOT NULL,
        assignee_id UUID REFERENCES user_profiles(id),
        cost_type TEXT NOT NULL CHECK (cost_type IN ('솔루션', '하드웨어', '출장경비', '행사경비', '사무경비')),
        content TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(15,2) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '취소')),
        completion_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES user_profiles(id),
        CONSTRAINT check_amount_calculation CHECK (amount = quantity * unit_price)
      );

      ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view cost records" ON cost_records
        FOR SELECT USING (
          assignee_id = auth.uid() OR 
          created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
          )
        );
    `;

    const { error: costError } = await supabase.rpc('sql', {
      query: costTablesSQL
    });

    if (!costError) {
      console.log('✅ 비용관리 테이블 생성 완료');
    }

    // 5. 코드 생성 함수 생성
    console.log('⚙️ 코드 생성 함수 생성...');
    const functionsSQL = `
      CREATE OR REPLACE FUNCTION get_next_sequence(module_type TEXT, year INTEGER)
      RETURNS INTEGER AS $$
      DECLARE
        next_seq INTEGER;
      BEGIN
        INSERT INTO code_sequences (module_type, year, current_sequence)
        VALUES (module_type, year, 1)
        ON CONFLICT (module_type, year)
        DO UPDATE SET 
          current_sequence = code_sequences.current_sequence + 1,
          updated_at = NOW();
        
        SELECT current_sequence INTO next_seq
        FROM code_sequences
        WHERE code_sequences.module_type = get_next_sequence.module_type 
          AND code_sequences.year = get_next_sequence.year;
        
        RETURN next_seq;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION generate_cost_code()
      RETURNS TEXT AS $$
      DECLARE
        year_suffix TEXT;
        sequence_num INTEGER;
        new_code TEXT;
      BEGIN
        year_suffix := SUBSTR(EXTRACT(year FROM NOW())::TEXT, 3, 2);
        sequence_num := get_next_sequence('COST', EXTRACT(year FROM NOW())::INTEGER);
        new_code := 'COST-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 3, '0');
        
        RETURN new_code;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: funcError } = await supabase.rpc('sql', {
      query: functionsSQL
    });

    if (!funcError) {
      console.log('✅ 코드 생성 함수 생성 완료');
    }

    console.log('\n🎉 기본 스키마 생성 완료!');
    console.log('📝 다음: 연결 테스트 재실행');

  } catch (error) {
    console.error('❌ 스키마 생성 중 오류:', error);
  }
}

createCompleteSchema();