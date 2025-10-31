const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
  'SoftwareManagement.tsx',
  'HardwareManagement.tsx',
  'ITEducationManagement.tsx',
  'SecurityIncidentManagement.tsx',
  'EvaluationManagement.tsx',
  'KpiManagement.tsx',
  'EducationManagement.tsx',
  'InvestmentManagement.tsx',
  'InspectionManagement.tsx',
  'SecurityEducationManagement.tsx',
  'RegulationManagement.tsx',
  'UserSettingsManagement.tsx',
  'PartnersSecurityManagement.tsx',
  'CustomerSecurityManagement.tsx'
];

const basePath = path.join(__dirname, 'src', 'views', 'apps');

filesToFix.forEach(fileName => {
  const filePath = path.join(basePath, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  파일을 찾을 수 없음: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 패턴 1: 상반기 월 헤더 - key={index}를 key={`month-header-first-${index}`}로
  const pattern1 = /(\{\/\* 월 헤더 - 상반기 \*\/\}[\s\S]*?\.map\(\(month, index\) => \([\s\S]*?)<Box[\s\n\s]*key=\{index\}/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, (match) => {
      return match.replace('key={index}', 'key={`month-header-first-${index}`}');
    });
    modified = true;
  }

  // 패턴 2: 상반기 월 콘텐츠 - key={monthIndex}를 key={`month-content-first-${monthIndex}`}로
  const pattern2 = /(\{\/\* 월 내용 - 상반기 \*\/\}[\s\S]*?\.map\(\([^)]*monthIndex[^)]*\) => \{[\s\S]*?return \([\s\S]*?)<Box[\s\n\s]*key=\{monthIndex\}/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, (match) => {
      return match.replace('key={monthIndex}', 'key={`month-content-first-${monthIndex}`}');
    });
    modified = true;
  }

  // 패턴 3: 하반기 월 헤더 - key={index + 6}를 key={`month-header-second-${index}`}로
  const pattern3 = /(\{\/\* 월 헤더 - 하반기 \*\/\}[\s\S]*?\.map\(\(month, index\) => \([\s\S]*?)<Box[\s\n\s]*key=\{index \+ 6\}/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, (match) => {
      return match.replace('key={index + 6}', 'key={`month-header-second-${index}`}');
    });
    modified = true;
  }

  // 패턴 4: 하반기 월 콘텐츠
  // 먼저 하반기 영역을 찾고, 그 안에서 처리
  const halfYearPattern = /\{\/\* 월 내용 - 하반기 \*\/\}[\s\S]*?\.map\(\([^)]*\) => \{[\s\S]*?const monthIndex = index \+ 6;[\s\S]*?return \([\s\S]*?<Box[\s\n\s]*key=\{monthIndex\}/g;
  if (halfYearPattern.test(content)) {
    content = content.replace(halfYearPattern, (match) => {
      return match.replace('key={monthIndex}', 'key={`month-content-second-${index}`}');
    });
    modified = true;
  }

  // 간단한 대체 방식으로 변경
  // 상반기 아이템 키 수정
  content = content.replace(
    /(\{\/\* 월 내용 - 상반기 \*\/\}[\s\S]*?items\.map\(\(item, itemIndex\) => \{[\s\S]*?return \([\s\S]*?)<Box[\s\n\s]*key=\{item\.id\}/,
    (match) => {
      return match.replace('key={item.id}', 'key={`month-${monthIndex}-item-${item.id}`}');
    }
  );

  // 하반기 아이템 키 수정 - 더 정확하게
  // 하반기 섹션 내 아이템을 찾기
  const secondHalfStart = content.indexOf('{/* 하반기 (7-12월) */}');
  if (secondHalfStart !== -1) {
    const secondHalfContent = content.substring(secondHalfStart);
    const itemPattern = /items\.map\(\(item, itemIndex\) => \{[\s\S]*?return \([\s\S]*?<Box[\s\n\s]*key=\{item\.id\}/;

    if (itemPattern.test(secondHalfContent)) {
      const updatedSecondHalf = secondHalfContent.replace(itemPattern, (match) => {
        return match.replace('key={item.id}', 'key={`month-second-${index}-item-${item.id}`}');
      });

      content = content.substring(0, secondHalfStart) + updatedSecondHalf;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 수정 완료: ${fileName}`);
  } else {
    console.log(`ℹ️  변경사항 없음 또는 이미 수정됨: ${fileName}`);
  }
});

console.log('\n모든 파일 처리 완료!');
