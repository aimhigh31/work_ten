/**
 * 모든 Management 페이지에 권한 체크 로직 추가
 *
 * 실행: node add-permission-check-to-pages.js
 */

const fs = require('fs');
const path = require('path');

// 수정할 파일 목록
const files = [
  'src/views/apps/TaskManagement.tsx',
  'src/views/apps/EducationManagement.tsx',
  'src/views/apps/CostManagement.tsx',
  'src/views/apps/SalesManagement.tsx',
  'src/views/apps/InvestmentManagement.tsx',
  'src/views/apps/VOCManagement.tsx',
  'src/views/apps/KpiManagement.tsx',
  'src/views/apps/ChecklistManagement.tsx',
  'src/views/apps/HardwareManagement.tsx',
  'src/views/apps/SoftwareManagement.tsx',
  'src/views/apps/SolutionManagement.tsx',
  'src/views/apps/ITEducationManagement.tsx',
  'src/views/apps/InspectionManagement.tsx',
  'src/views/apps/RegulationManagement.tsx',
  'src/views/apps/EvaluationManagement.tsx',
  'src/views/apps/SecurityIncidentManagement.tsx',
  'src/views/apps/SecurityEducationManagement.tsx',
  'src/views/apps/CustomerSecurityManagement.tsx',
  'src/views/apps/PartnersSecurityManagement.tsx',
  'src/views/apps/MasterCodeManagement.tsx'
];

// 페이지별 URL 매핑
const pageUrls = {
  'TaskManagement': '/apps/task',
  'EducationManagement': '/apps/education',
  'CostManagement': '/apps/cost',
  'SalesManagement': '/apps/sales',
  'InvestmentManagement': '/apps/investment',
  'VOCManagement': '/apps/voc',
  'KpiManagement': '/apps/kpi',
  'ChecklistManagement': '/apps/checklist',
  'HardwareManagement': '/apps/hardware',
  'SoftwareManagement': '/apps/software',
  'SolutionManagement': '/apps/solution',
  'ITEducationManagement': '/apps/it-education',
  'InspectionManagement': '/apps/inspection',
  'RegulationManagement': '/apps/regulation',
  'EvaluationManagement': '/apps/evaluation',
  'SecurityIncidentManagement': '/apps/security-incident',
  'SecurityEducationManagement': '/apps/security-education',
  'CustomerSecurityManagement': '/apps/customer-security',
  'PartnersSecurityManagement': '/apps/partners-security',
  'MasterCodeManagement': '/apps/mastercode'
};

files.forEach(filePath => {
  const fullPath = path.resolve(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⏩ 파일 없음: ${filePath}`);
    return;
  }

  const fileName = path.basename(filePath, '.tsx');
  const pageUrl = pageUrls[fileName];

  if (!pageUrl) {
    console.log(`⚠️ URL 매핑 없음: ${fileName}`);
    return;
  }

  console.log(`\n📝 처리 중: ${fileName}`);

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. useMenuPermission import 확인
  if (!content.includes("import { useMenuPermission }")) {
    console.log(`  ⚠️ useMenuPermission import가 없습니다. 수동으로 확인이 필요합니다.`);
  }

  // 2. canViewCategory 추가 (이미 있는지 확인)
  const permissionHookRegex = /const\s+{\s*([^}]+)}\s*=\s*useMenuPermission\(['"]([^'"]+)['"]\)/;
  const match = content.match(permissionHookRegex);

  if (match) {
    const currentPermissions = match[1];
    const currentUrl = match[2];

    if (!currentPermissions.includes('canViewCategory')) {
      const newPermissions = `canViewCategory, ${currentPermissions}`;
      content = content.replace(
        permissionHookRegex,
        `const { ${newPermissions} } = useMenuPermission('${currentUrl}')`
      );
      console.log(`  ✅ canViewCategory 추가`);
    } else {
      console.log(`  ✔️  canViewCategory 이미 있음`);
    }
  } else {
    console.log(`  ⚠️ useMenuPermission 사용을 찾지 못했습니다.`);
  }

  // 3. 타이틀 뒤에 권한 체크 로직 추가
  // 패턴: </Box>\n\n 다음에 {/* 탭 또는 다른 컨텐츠 시작

  // 이미 권한 체크가 있는지 확인
  if (content.includes('{canViewCategory && !canReadData')) {
    console.log(`  ✔️  권한 체크 이미 있음`);
  } else {
    // 타이틀 Box 종료 후 탭 시작 전에 권한 체크 추가
    // 주의: 각 파일의 구조가 다를 수 있으므로 신중하게 처리
    console.log(`  ⚠️ 권한 체크 로직을 수동으로 추가해야 합니다.`);
    console.log(`      패턴: 타이틀 </Box> 다음에 조건부 렌더링 추가`);
  }

  // 파일 저장 (주석 처리 - 안전을 위해)
  // fs.writeFileSync(fullPath, content, 'utf8');
  // console.log(`  💾 저장 완료`);
});

console.log('\n✅ 모든 파일 확인 완료!');
console.log('\n📌 주의: 자동 수정이 안전하지 않을 수 있으므로, 수동으로 확인하세요.');
console.log('    패턴:');
console.log('    1. useMenuPermission 훅에 canViewCategory 추가');
console.log('    2. 타이틀 Box 다음에 권한 체크 조건문 추가:');
console.log('       {canViewCategory && !canReadData ? (<안내메시지/>) : (<기존컨텐츠/>)}');
