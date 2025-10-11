// next
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

declare module 'next-auth' {
  interface User {
    accessToken?: string;
    position?: string;
    department?: string;
    profileImage?: string;
  }
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      position?: string;
      department?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      id: 'login',
      name: 'login',
      credentials: {
        email: { name: 'email', label: 'Account ID', type: 'text', placeholder: 'Enter Account ID' },
        password: { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password' }
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Login attempt:', credentials?.email);

          if (!credentials?.email || !credentials?.password) {
            throw new Error('Account ID and password are required');
          }

          // Supabase 클라이언트 생성
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

          console.log('🔍 Environment check:', {
            hasUrl: !!supabaseUrl,
            hasKey: !!serviceRoleKey
          });

          const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          // 1단계: Account ID로 이메일 조회
          console.log('🔍 Querying user profile...');
          const { data: users, error: queryError } = await supabaseAdmin
            .from('admin_users_userprofiles')
            .select('email, user_name, status, is_active, auth_user_id, position, department, avatar_url, profile_image_url')
            .or(`user_code.eq.${credentials.email},user_account_id.eq.${credentials.email}`)
            .limit(1);

          console.log('📊 Query result:', {
            error: queryError?.message,
            userCount: users?.length
          });

          if (queryError || !users || users.length === 0) {
            console.error('❌ User not found or query error');
            throw new Error('Invalid Account ID or password');
          }

          const userProfile = users[0];
          console.log('✅ User found:', userProfile.email);

          // 사용자 상태 확인
          if (!userProfile.is_active || userProfile.status !== 'active') {
            throw new Error('Account is inactive');
          }

          // 2단계: Supabase Auth로 로그인
          console.log('🔐 Attempting Supabase Auth login...');
          const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: userProfile.email,
            password: credentials.password
          });

          if (authError) {
            console.error('❌ Supabase Auth error:', authError.message);
            throw new Error('Invalid Account ID or password');
          }

          if (!authData.user) {
            console.error('❌ No user data returned from Auth');
            throw new Error('Invalid Account ID or password');
          }

          // 로그인 성공
          console.log('✅ Login successful:', authData.user.email);

          // 프로필 이미지 우선순위: profile_image_url > avatar_url > 기본 이미지
          const profileImage = userProfile.profile_image_url || userProfile.avatar_url || '/assets/images/users/avatar-1.png';

          return {
            id: authData.user.id,
            name: userProfile.user_name,
            email: userProfile.email,
            position: userProfile.position,
            department: userProfile.department,
            profileImage: profileImage,
            accessToken: authData.session?.access_token || 'authenticated'
          };
        } catch (e: any) {
          console.error('❌ Authorization error:', e.message);
          const errorMessage = e?.message || 'Invalid credentials';
          throw new Error(errorMessage);
        }
      }
    }),
    CredentialsProvider({
      id: 'register',
      name: 'Register',
      credentials: {
        firstname: { name: 'firstname', label: 'Firstname', type: 'text', placeholder: 'Enter Firstname' },
        lastname: { name: 'lastname', label: 'Lastname', type: 'text', placeholder: 'Enter Lastname' },
        email: { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter Email' },
        company: { name: 'company', label: 'Company', type: 'text', placeholder: 'Enter Company' },
        password: { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password' }
      },
      async authorize(credentials) {
        try {
          // 임시로 더미 회원가입 로직 사용
          const existingUser = users.find((user) => user.email === credentials?.email);

          if (existingUser) {
            throw new Error('User already exists');
          }

          const newUser = {
            id: users.length + 1,
            name: `${credentials?.firstname} ${credentials?.lastname}`,
            email: credentials?.email!,
            password: credentials?.password!
          };

          users.push(newUser);

          return {
            id: newUser.id.toString(),
            name: newUser.name,
            email: newUser.email,
            accessToken: 'dummy-access-token'
          };
        } catch (e: any) {
          const errorMessage = e?.message || 'Registration failed';
          throw new Error(errorMessage);
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token && session.user) {
        session.id = token.id;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async signIn(params) {
      // Prevent JWT token issuance on registration
      if (params.account?.provider === 'register') {
        return `${process.env.NEXTAUTH_URL}login`;
      }
      return true;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: Number(process.env.NEXT_APP_JWT_TIMEOUT!)
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: '/login',
    newUser: '/register'
  }
};
