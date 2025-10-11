#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 훅 파일에서 모든 Supabase 테이블 검색 중...\n');

const hooksDir = path.join(__dirname, '../src/hooks');
const files = fs.readdirSync(hooksDir).filter(f => f.startsWith('useSupabase') && f.endsWith('.ts'));

const tableNames = new Set();

files.forEach(file => {
  const content = fs.readFileSync(path.join(hooksDir, file), 'utf8');

  // .from('테이블명') 패턴 찾기
  const fromPattern = /\.from\(['"`]([^'"`]+)['"`]\)/g;
  let match;

  while ((match = fromPattern.exec(content)) !== null) {
    const tableName = match[1];
    if (!tableName.includes('information_schema') && !tableName.includes('auth.')) {
      tableNames.add(tableName);
    }
  }

  // INSERT INTO 패턴 찾기
  const insertPattern = /INSERT\s+INTO\s+([a-z_0-9]+)/gi;
  while ((match = insertPattern.exec(content)) !== null) {
    tableNames.add(match[1].toLowerCase());
  }

  // UPDATE 패턴 찾기
  const updatePattern = /UPDATE\s+([a-z_0-9]+)/gi;
  while ((match = updatePattern.exec(content)) !== null) {
    tableNames.add(match[1].toLowerCase());
  }

  // DELETE FROM 패턴 찾기
  const deletePattern = /DELETE\s+FROM\s+([a-z_0-9]+)/gi;
  while ((match = deletePattern.exec(content)) !== null) {
    tableNames.add(match[1].toLowerCase());
  }
});

const sortedTables = Array.from(tableNames).sort();

console.log(`📋 발견된 테이블: ${sortedTables.length}개\n`);
console.log('=' .repeat(80));

sortedTables.forEach((table, index) => {
  console.log(`${(index + 1).toString().padStart(3)}. ${table}`);
});

// 카테고리별로 분류
console.log('\n\n📊 카테고리별 분류\n');
console.log('=' .repeat(80));

const categories = {
  'ADMIN (관리)': sortedTables.filter(t => t.startsWith('admin_')),
  'MAIN (메인)': sortedTables.filter(t => t.startsWith('main_')),
  'SECURITY (보안)': sortedTables.filter(t => t.includes('security')),
  'IT (IT관리)': sortedTables.filter(t => t.includes('it_')),
  'FINANCE (재무)': sortedTables.filter(t => t.includes('finance') || t.includes('cost') || t.includes('investment')),
  'HARDWARE (하드웨어)': sortedTables.filter(t => t.includes('hardware')),
  'SOFTWARE (소프트웨어)': sortedTables.filter(t => t.includes('software')),
  'FEEDBACK (피드백)': sortedTables.filter(t => t.includes('feedback')),
  'EDUCATION (교육)': sortedTables.filter(t => t.includes('education')),
  'VOC (고객의견)': sortedTables.filter(t => t.includes('voc')),
  'ACCIDENT (사고)': sortedTables.filter(t => t.includes('accident')),
  'IMPROVEMENT (개선)': sortedTables.filter(t => t.includes('improvement')),
  'SOLUTION (솔루션)': sortedTables.filter(t => t.includes('solution')),
  'KPI (KPI)': sortedTables.filter(t => t.includes('kpi')),
  'CHECKLIST (체크리스트)': sortedTables.filter(t => t.includes('checklist')),
  'CALENDAR (캘린더)': sortedTables.filter(t => t.includes('calendar')),
  'STORAGE (스토리지)': sortedTables.filter(t => t.includes('storage'))
};

Object.entries(categories).forEach(([category, tables]) => {
  if (tables.length > 0) {
    console.log(`\n▶ ${category} (${tables.length}개)`);
    tables.forEach((table, idx) => {
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${table}`);
    });
  }
});

console.log('\n\n✅ 검색 완료!\n');
