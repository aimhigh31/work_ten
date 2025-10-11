const fs = require('fs');

// SQL 파일들을 읽어서 웹 인터페이스용으로 포맷팅
const sqlFiles = [
  { path: 'sql-for-dashboard/01-extensions-and-basic-tables.sql', name: '1단계: 기본 확장 및 핵심 테이블' },
  { path: 'sql-for-dashboard/02-cost-management-tables.sql', name: '2단계: 비용관리 모듈 테이블' },
  { path: 'sql-for-dashboard/03-task-education-tables.sql', name: '3단계: 업무관리 및 교육관리 테이블' }
];

console.log('🚀 Supabase 웹 SQL 편집기에서 실행할 준비된 SQL:');
console.log('💡 https://exxumujwufzqnovhzvif.supabase.co > SQL Editor에서 실행하세요');
console.log('\n' + '='.repeat(80));

sqlFiles.forEach((file, index) => {
  console.log(`\n📄 ${file.name}`);
  console.log('-'.repeat(60));
  
  const sqlContent = fs.readFileSync(file.path, 'utf8');
  console.log(sqlContent);
  
  if (index < sqlFiles.length - 1) {
    console.log('\n' + '='.repeat(80));
    console.log('⏳ 위의 SQL을 실행한 후 다음 단계로 진행하세요');
    console.log('='.repeat(80));
  }
});

console.log('\n🎉 모든 SQL 스크립트 준비 완료!');
console.log('📊 실행 후 Supabase Dashboard > Table Editor에서 생성된 테이블을 확인하세요.');