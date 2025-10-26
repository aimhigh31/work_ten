// API GET /api/users 응답 테스트
async function testUsersAPI() {
  console.log('\n🔍 API 테스트: GET /api/users\n');

  try {
    const response = await fetch('http://localhost:3200/api/users');
    const result = await response.json();

    if (result.success && result.data) {
      console.log(`✅ API 응답 성공: ${result.data.length}명의 사용자`);

      // System 사용자 찾기
      const systemUser = result.data.find(u => u.user_code === 'USER-25-013');

      if (systemUser) {
        console.log('\n📋 System 사용자 데이터:');
        console.log('  user_code:', systemUser.user_code);
        console.log('  user_name:', systemUser.user_name);
        console.log('  assigned_roles (원본):', systemUser.assigned_roles);
        console.log('  assignedRole (변환):', systemUser.assignedRole);
        console.log('\n🔍 타입 확인:');
        console.log('  assigned_roles 타입:', typeof systemUser.assigned_roles);
        console.log('  assigned_roles 배열 여부:', Array.isArray(systemUser.assigned_roles));
        console.log('  assignedRole 타입:', typeof systemUser.assignedRole);
        console.log('  assignedRole 배열 여부:', Array.isArray(systemUser.assignedRole));

        if (Array.isArray(systemUser.assignedRole)) {
          console.log('  assignedRole 길이:', systemUser.assignedRole.length);
          console.log('  assignedRole 내용:', systemUser.assignedRole);
        }
      } else {
        console.log('⚠️  System 사용자를 찾을 수 없습니다.');
      }
    } else {
      console.log('❌ API 응답 실패:', result.error);
    }
  } catch (error) {
    console.error('❌ API 호출 중 오류:', error.message);
  }
}

testUsersAPI();
