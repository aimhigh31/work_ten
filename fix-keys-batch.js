const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const filesToFix = [
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
  const originalContent = content;

  // 1. 상반기 월 헤더: key={index} → key={`month-header-first-${index}`}
  content = content.replace(
    /(\/\* 월 헤더 - 상반기 \*\/[\s\S]{1,200}?key=\{)index(\})/,
    '$1`month-header-first-${index}`$2'
  );

  // 2. 상반기 월 콘텐츠: key={monthIndex} → key={`month-content-first-${monthIndex}`}
  // "월 내용 - 상반기" 주석 이후의 첫 번째 key={monthIndex}만 교체
  const firstHalfContentPattern = /(\/\* 월 내용 - 상반기 \*\/[\s\S]{1,500}?<Box[\s\S]{1,50}?key=\{)monthIndex(\})/;
  if (firstHalfContentPattern.test(content)) {
    content = content.replace(
      firstHalfContentPattern,
      '$1`month-content-first-${monthIndex}`$2'
    );
  }

  // 3. 하반기 월 헤더: key={index + 6} → key={`month-header-second-${index}`}
  content = content.replace(
    /(\/\* 월 헤더 - 하반기 \*\/[\s\S]{1,200}?key=\{)index \+ 6(\})/,
    '$1`month-header-second-${index}`$2'
  );

  // 4. 하반기 월 콘텐츠: key={monthIndex} → key={`month-content-second-${index}`}
  // "월 내용 - 하반기" 주석 이후의 key={monthIndex}를 찾음
  const secondHalfContentPattern = /(\/\* 월 내용 - 하반기 \*\/[\s\S]{1,500}?<Box[\s\S]{1,50}?key=\{)monthIndex(\})/;
  if (secondHalfContentPattern.test(content)) {
    content = content.replace(
      secondHalfContentPattern,
      '$1`month-content-second-${index}`$2'
    );
  }

  // 5. 상반기 아이템: items.map 내부의 key={item.id}를 찾아서 교체
  // "월 내용 - 상반기" 이후 "하반기" 이전 구간
  const firstHalfStart = content.indexOf('/* 월 내용 - 상반기 */');
  const secondHalfStart = content.indexOf('/* 하반기 (7-12월) */');

  if (firstHalfStart !== -1 && secondHalfStart !== -1) {
    const firstHalfSection = content.substring(firstHalfStart, secondHalfStart);
    const itemsMapPattern = /(items\.map\(\(item, itemIndex\) => \{[\s\S]{1,500}?<Box[\s\S]{1,50}?key=\{)item\.id(\})/;

    if (itemsMapPattern.test(firstHalfSection)) {
      const updatedFirstHalf = firstHalfSection.replace(
        itemsMapPattern,
        '$1`month-${monthIndex}-item-${item.id}`$2'
      );
      content = content.substring(0, firstHalfStart) + updatedFirstHalf + content.substring(secondHalfStart);
    }
  }

  // 6. 하반기 아이템: "하반기" 이후 구간의 items.map 내부의 key={item.id}를 찾아서 교체
  const secondHalfStartNew = content.indexOf('/* 하반기 (7-12월) */');
  if (secondHalfStartNew !== -1) {
    const secondHalfSection = content.substring(secondHalfStartNew);
    const itemsMapPattern = /(items\.map\(\(item, itemIndex\) => \{[\s\S]{1,500}?<Box[\s\S]{1,50}?key=\{)item\.id(\})/;

    if (itemsMapPattern.test(secondHalfSection)) {
      const updatedSecondHalf = secondHalfSection.replace(
        itemsMapPattern,
        '$1`month-second-${index}-item-${item.id}`$2'
      );
      content = content.substring(0, secondHalfStartNew) + updatedSecondHalf;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 수정 완료: ${fileName}`);
  } else {
    console.log(`ℹ️  변경사항 없음 또는 이미 수정됨: ${fileName}`);
  }
});

console.log('\n모든 파일 처리 완료!');
