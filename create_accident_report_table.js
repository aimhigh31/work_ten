const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAccidentReportTable() {
  try {
    console.log('🔄 security_accident_report 테이블 생성 중...\n');

    // SQL 쿼리로 테이블 생성
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

    // RPC 함수를 통해 SQL 실행 (Supabase는 직접 SQL 실행을 지원하지 않음)
    // 대신 Supabase Dashboard에서 직접 실행하거나 migration 파일로 처리해야 함

    console.log('📋 다음 SQL을 Supabase SQL Editor에서 실행하세요:\n');
    console.log(createTableQuery);

    console.log('\n또는 다음 테스트를 실행하여 테이블 존재 여부 확인:');

    // 테이블 존재 여부 테스트
    const { data, error } = await supabase
      .from('security_accident_report')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ 테이블이 존재하지 않습니다. 위 SQL을 실행해주세요.');
      } else {
        console.log('❌ 테이블 확인 오류:', error.message);
      }
    } else {
      console.log('✅ 테이블이 이미 존재합니다!');

      // 컬럼 정보 확인
      if (data && data.length === 0) {
        console.log('📊 테이블은 있지만 데이터는 없습니다.');
      }
    }

    // 테스트 데이터 삽입 예제
    console.log('\n📝 테스트 데이터 삽입 예제:');
    const testData = {
      accident_id: 1, // 실제 security_accident_data의 ID를 사용해야 함
      discovery_datetime: new Date().toISOString(),
      discoverer: '테스트 발견자',
      discovery_method: '시스템 자동탐지',
      report_datetime: new Date().toISOString(),
      reporter: '테스트 보고자',
      report_method: '이메일',
      incident_target: '테스트 시스템',
      incident_cause: '테스트 원인',
      affected_systems: '시스템A, 시스템B',
      affected_data: '고객 데이터',
      service_impact: '중간',
      business_impact: '낮음',
      situation_details: '상황 설명...',
      response_method: '격리',
      improvement_executor: '담당자A',
      expected_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      improvement_details: '개선 계획...',
      completion_date: null,
      completion_approver: null,
      resolution_details: null,
      prevention_details: '재발 방지 계획...'
    };

    console.log('테스트 데이터:', JSON.stringify(testData, null, 2));

  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err.message);
  }
}

// 스크립트 실행
createAccidentReportTable();