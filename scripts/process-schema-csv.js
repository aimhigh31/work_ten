const fs = require('fs');
const path = require('path');

// CSV 파일 읽기
const csvPath = 'c:\\Users\\11\\Downloads\\Supabase Snippet Public Schema DDL Export.csv';
const outputPath = path.join(__dirname, '..', 'schema.sql');

console.log('📖 CSV 파일 읽는 중...');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// 첫 번째 줄(헤더) 제거하고 나머지 처리
const lines = csvContent.split('\n');
const tableDefinitions = lines.slice(1).join('\n');

// 따옴표 제거 (각 테이블 정의를 감싸고 있는 따옴표)
const cleanedTables = tableDefinitions
  .replace(/^"/gm, '')  // 각 줄 시작의 따옴표 제거
  .replace(/"$/gm, '')  // 각 줄 끝의 따옴표 제거
  .trim();

// 최종 스키마 파일 생성
const header = `-- ========================================
-- 개발 DB 스키마 덤프
-- ========================================
-- 생성일: 2025-11-21
-- 프로젝트: exxumujwufzqnovhzvif
-- 총 테이블 수: 68
-- ========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

`;

const footer = `

-- ========================================
-- 스키마 덤프 완료
-- ========================================
`;

const finalSchema = header + cleanedTables + footer;

// 파일 저장
fs.writeFileSync(outputPath, finalSchema, 'utf8');

console.log('✅ schema.sql 파일 생성 완료!');
console.log('📍 위치:', path.resolve(outputPath));
console.log('📊 총 테이블 수: 68');
console.log('💾 파일 크기:', (finalSchema.length / 1024).toFixed(2), 'KB');
