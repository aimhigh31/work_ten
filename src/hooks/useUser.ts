// next
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import { useCommonData } from 'contexts/CommonDataContext';

interface UserProps {
  name: string;
  email: string;
  avatar: string;
  thumb: string;
  role: string;
  position?: string;
  department?: string;
}

export default function useUser() {
  const { data: session } = useSession();
  const { users } = useCommonData(); // ✅ CommonData에서 캐싱된 사용자 데이터 사용

  return useMemo(() => {
    if (!session) {
      return false;
    }

    const user = session?.user;
    const provider = session?.provider;

    console.log('🔍 [useUser] 세션 user.email:', user?.email);
    console.log('🔍 [useUser] CommonData users 개수:', users?.length);

    // DB에서 현재 사용자의 프로필 정보 가져오기
    const dbUser = users.find((u) => u.email === user?.email);

    console.log('🔍 [useUser] 찾은 dbUser:', dbUser ? {
      user_name: dbUser.user_name,
      department: dbUser.department,
      position: dbUser.position,
      role: dbUser.role
    } : '없음');
    const profileImage = dbUser?.profile_image_url || dbUser?.avatar_url;

    let thumb = profileImage || user?.image || '/assets/images/users/avatar-1.png';
    if (provider === 'cognito') {
      const email = user?.email?.split('@');
      user!.name = email ? email[0] : 'Jone Doe';
    }

    if (!profileImage && !user?.image) {
      user!.image = '/assets/images/users/avatar-1.png';
      thumb = '/assets/images/users/avatar-thumb-1.png';
    }

    const newUser: UserProps = {
      name: dbUser?.user_name || user?.name || 'Jone Doe',
      email: user?.email || 'doe@codedthemes.com',
      avatar: profileImage || user?.image || '/assets/images/users/avatar-1.png',
      thumb,
      role: dbUser?.role || user?.position || 'UI/UX Designer',
      position: dbUser?.position || user?.position,
      department: dbUser?.department || user?.department
    };

    return newUser;
  }, [session, users]);
}
