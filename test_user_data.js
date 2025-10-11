const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserData() {
  console.log("🔍 사용자 데이터 확인...");

  try {
    // 사용자 데이터 조회
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.log("❌ 사용자 데이터 조회 오류:", error);
      return;
    }

    console.log(`✅ 활성 사용자 ${data?.length || 0}명 발견:`);
    if (data && data.length > 0) {
      data.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.user_name} (${user.email}) - ${user.department || '부서 미설정'}`);
      });
    } else {
      console.log("📝 활성 사용자가 없습니다. 테스트 사용자를 생성합니다...");

      // 테스트 사용자 생성
      const testUsers = [
        {
          user_code: 'USER001',
          user_name: '홍길동',
          email: 'hong@company.com',
          department: 'IT개발팀',
          position: '대리',
          role: 'developer',
          status: 'active',
          is_active: true,
          is_system: false,
          created_by: 'system',
          updated_by: 'system'
        },
        {
          user_code: 'USER002',
          user_name: '김철수',
          email: 'kim@company.com',
          department: '기획팀',
          position: '과장',
          role: 'manager',
          status: 'active',
          is_active: true,
          is_system: false,
          created_by: 'system',
          updated_by: 'system'
        },
        {
          user_code: 'USER003',
          user_name: '이영희',
          email: 'lee@company.com',
          department: '고객지원팀',
          position: '사원',
          role: 'support',
          status: 'active',
          is_active: true,
          is_system: false,
          created_by: 'system',
          updated_by: 'system'
        }
      ];

      for (const user of testUsers) {
        const { data: newUser, error: createError } = await supabase
          .from('admin_users_userprofiles')
          .insert([user])
          .select();

        if (createError) {
          console.log(`❌ ${user.user_name} 생성 오류:`, createError);
        } else {
          console.log(`✅ ${user.user_name} 생성 완료`);
        }
      }
    }

  } catch (err) {
    console.error("❌ 오류 발생:", err);
  }
}

testUserData();