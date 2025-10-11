const fs = require('fs');
const path = require('path');

console.log('🔧 타입 정의 정합성 수정 시작...');

// 1. 백업 생성
if (!fs.existsSync('src/types_backup')) {
  fs.cpSync('src/types', 'src/types_backup', { recursive: true });
  console.log('📦 기존 타입 정의 백업 완료');
}

const typeFiles = [
  'src/types/cost.ts',
  'src/types/task.ts', 
  'src/types/education.ts'
];

const typeMapping = {
  'id: number': 'id: string',
  'assignee: string': 'assignee_id: string | null',
  'created_by: string': 'created_by: string | null',
  'updated_by: string': 'updated_by: string | null',
  'author: string': 'author_id: string | null',
  'uploaded_by: string': 'uploaded_by: string | null'
};

// 추가 매핑 (날짜 필드 정규화)
const dateMapping = {
  'registrationDate: string': 'registration_date: string',
  'startDate: string': 'start_date: string',
  'completionDate: string': 'completion_date: string | null',
  'completedDate: string': 'completed_date: string | null',
  'uploadDate: string': 'upload_date: string'
};

// 모든 매핑 합치기
const allMappings = { ...typeMapping, ...dateMapping };

typeFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    Object.entries(allMappings).forEach(([oldType, newType]) => {
      const regex = new RegExp(oldType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldType)) {
        content = content.replace(regex, newType);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚪ No changes needed for ${filePath}`);
    }
  } else {
    console.log(`⚠️ File not found: ${filePath}`);
  }
});

console.log('🎉 타입 정의 정합성 수정 완료!');
console.log('📝 다음: Supabase 프로젝트 초기화');