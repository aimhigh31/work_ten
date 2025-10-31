import { Fragment, useLayoutEffect, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project-imports
import NavGroup from './NavGroup';
import NavItem from './NavItem';
import { useGetMenu, useGetMenuMaster } from 'api/menu';
import { MenuOrientation, HORIZONTAL_MAX_ITEM } from 'config';
import useConfig from 'hooks/useConfig';
import menuItem from 'menu-items';
// import { MenuFromAPI } from 'menu-items/dashboard'; // Dashboard 메뉴 임시 숨김 처리 - 추후 사용 가능
import { useSupabaseMenuManagement } from 'hooks/useSupabaseMenuManagement';
import { usePermissions } from 'hooks/usePermissions';

// 아이콘 import
import {
  Setting2,
  Profile,
  Home3,
  Chart,
  TaskSquare,
  Category2,
  Money,
  Book1,
  Code,
  TrendUp,
  Calendar1,
  MoneyRecive,
  Monitor,
  MessageQuestion,
  Setting3,
  ProgrammingArrows,
  Teacher,
  SecuritySafe,
  ScanBarcode,
  SecurityUser,
  Warning2,
  DocumentText
} from '@wandersonalwes/iconsax-react';

// types
import { NavItemType } from 'types/menu';

function isFound(arr: any, str: string) {
  return arr.items.some((element: any) => {
    if (element.id === str) {
      return true;
    }
    return false;
  });
}

// ==============================|| DRAWER CONTENT - NAVIGATION ||============================== //

export default function Navigation() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const pathname = usePathname();

  const { menuOrientation } = useConfig();
  const { menuLoading } = useGetMenu();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  // Supabase 메뉴 데이터 훅
  const { menus: supabaseMenus, loading: supabaseLoading } = useSupabaseMenuManagement();

  // 권한 정보 가져오기
  const { permissions, loading: permissionsLoading } = usePermissions();

  const [selectedID, setSelectedID] = useState<string | null>(menuMaster.openedHorizontalItem);
  const [selectedItems, setSelectedItems] = useState<string | undefined>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(0);
  const [menuItems, setMenuItems] = useState<{ items: NavItemType[] }>({ items: [] });

  // const dashboardMenu = MenuFromAPI(); // Dashboard 메뉴 임시 숨김 처리 - 추후 사용 가능

  // 아이콘 문자열을 실제 컴포넌트로 변환하는 함수
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Setting2: Setting2,
      Profile: Profile,
      Home3: Home3,
      Chart: Chart,
      TaskSquare: TaskSquare,
      Category2: Category2,
      Money: Money,
      Book1: Book1,
      Code: Code,
      TrendUp: TrendUp,
      Calendar1: Calendar1,
      MoneyRecive: MoneyRecive,
      Monitor: Monitor,
      MessageQuestion: MessageQuestion,
      Setting3: Setting3,
      ProgrammingArrows: ProgrammingArrows,
      Teacher: Teacher,
      SecuritySafe: SecuritySafe,
      ScanBarcode: ScanBarcode,
      SecurityUser: SecurityUser,
      Warning2: Warning2,
      DocumentText: DocumentText
    };

    return iconMap[iconName] || Setting2; // 기본값은 Setting2
  };

  // Supabase 메뉴 데이터를 NavItemType으로 변환하는 함수
  const convertSupabaseMenusToNavItems = (menus: any[], userPermissions: Record<string, any>): NavItemType[] => {
    try {
      if (!menus || menus.length === 0) {
        console.log('Supabase 메뉴 데이터가 없음:', { menus, length: menus?.length });
        return [];
      }

      console.log('메뉴 변환 시작:', { menuCount: menus.length, menus });

      // 정렬순서에 따라 정렬
      const sortedMenus = [...menus].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      // 활성화된 메뉴만 필터링
      const enabledMenus = sortedMenus.filter((menu) => menu.permissions?.enabled !== false);
      console.log('활성화된 메뉴:', { enabledCount: enabledMenus.length, enabledMenus });

      if (enabledMenus.length === 0) {
        console.warn('활성화된 메뉴가 없음');
        return [];
      }

      // 카테고리별로 그룹화
      const groupedMenus = enabledMenus.reduce(
        (acc, menu) => {
          const category = menu.category || '기본';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(menu);
          return acc;
        },
        {} as Record<string, any[]>
      );

      console.log('카테고리별 그룹화:', groupedMenus);

      // NavItemType 형식으로 변환
      const navItems: NavItemType[] = Object.entries(groupedMenus)
        .map(([category, categoryMenus]) => {
          // 레벨 0 메뉴 찾기 (그룹 헤더)
          const groupMenu = categoryMenus.find((menu) => menu.level === 0);
          const subMenus = categoryMenus.filter((menu) => menu.level === 1);

          const groupItem = {
            id: `group-${category.toLowerCase().replace(/\s+/g, '-')}`,
            title: category,
            type: 'group' as const,
            children: subMenus
              .filter((menu) => {
                // 권한 체크: menuId로 직접 조회 (permissions 객체의 키가 문자열이므로 변환)
                const menuIdKey = String(menu.id);
                const menuPermission = userPermissions[menuIdKey];

                console.log(`🔍 [권한체크] 메뉴: ${menu.page}`);
                console.log(`   menu.id: ${menu.id} (타입: ${typeof menu.id})`);
                console.log(`   menuIdKey: ${menuIdKey}`);
                console.log(`   menuPermission:`, menuPermission);
                console.log(`   canViewCategory:`, menuPermission?.canViewCategory);

                const canView = menuPermission?.canViewCategory === true;

                if (!canView) {
                  console.log(`🚫 메뉴 숨김`);
                } else {
                  console.log(`✅ 메뉴 표시`);
                }

                return canView;
              })
              .map((menu) => ({
                id: menu.id.toString(),
                title: menu.page,
                type: 'item' as const,
                url: menu.url,
                icon: getIconComponent(menu.icon || 'Setting2'), // 아이콘 컴포넌트로 변환
                breadcrumbs: false,
                description: menu.description
              }))
          };

          console.log('생성된 그룹 아이템:', { category, childrenCount: groupItem.children.length, groupItem });
          return groupItem;
        })
        .filter((item) => item.children.length > 0); // 자식 메뉴가 있는 그룹만 반환

      console.log('최종 변환된 네비게이션 아이템:', { navItemsCount: navItems.length, navItems });
      return navItems;
    } catch (error) {
      console.error('메뉴 변환 중 오류 발생:', error);
      return [];
    }
  };

  // 현재 경로가 특정 메뉴 아이템에 속하는지 확인하는 함수
  const isCurrentPathInMenu = (item: NavItemType, currentPath: string): boolean => {
    if (item.url && currentPath === item.url) {
      return true;
    }
    if (item.children) {
      return item.children.some((child) => isCurrentPathInMenu(child, currentPath));
    }
    return false;
  };

  // 메뉴 필터링 함수 - 현재 경로 보호 로직 포함 (간소화 버전)
  const filterMenuItems = (items: NavItemType[], menuStatus: Record<string, boolean>, currentPath: string): NavItemType[] => {
    return items
      .map((item) => {
        // 현재 경로에 해당하는 메뉴는 항상 표시 (보호 로직)
        const isCurrentPathMenu = isCurrentPathInMenu(item, currentPath);

        // 그룹은 항상 표시
        if (item.type === 'group') {
          const filteredChildren = item.children ? filterMenuItems(item.children, menuStatus, currentPath) : [];
          return {
            ...item,
            children: filteredChildren
          };
        }

        // collapse 타입은 항상 표시하되 children만 필터링
        if (item.type === 'collapse') {
          const filteredChildren = item.children ? filterMenuItems(item.children, menuStatus, currentPath) : [];
          return {
            ...item,
            children: filteredChildren
          };
        }

        // 일반 item의 경우 - menuStatus가 명시적으로 false가 아닌 경우 또는 현재 경로면 표시
        const isEnabled = menuStatus[item.id] !== false || isCurrentPathMenu;
        return isEnabled ? item : null;
      })
      .filter(Boolean) as NavItemType[];
  };

  // 메뉴 업데이트 함수
  const updateMenuItems = () => {
    try {
      const savedMenuStatus = localStorage.getItem('menuStatus');
      let menuStatus = {};

      if (savedMenuStatus) {
        try {
          menuStatus = JSON.parse(savedMenuStatus);
          // JSON 파싱이 성공했지만 올바른 객체가 아닌 경우 확인
          if (typeof menuStatus !== 'object' || menuStatus === null || Array.isArray(menuStatus)) {
            console.warn('유효하지 않은 menuStatus 형식, 기본값으로 초기화:', menuStatus);
            menuStatus = {};
            localStorage.removeItem('menuStatus'); // 잘못된 데이터 제거
          }
        } catch (parseError) {
          console.error('menuStatus JSON 파싱 오류:', parseError);
          menuStatus = {};
          localStorage.removeItem('menuStatus'); // 잘못된 데이터 제거
        }
      }

      // Supabase 또는 권한 로딩 중이면 현재 메뉴 상태 유지
      if (supabaseLoading || permissionsLoading) {
        console.log('Supabase 메뉴 또는 권한 로딩 중, 현재 상태 유지', { supabaseLoading, permissionsLoading });
        return;
      }

      // Supabase 동적 메뉴 변환 (권한 정보 전달)
      console.log('🔄 [Navigation] 메뉴 변환 시작:', {
        supabaseMenusCount: supabaseMenus?.length,
        permissionsCount: Object.keys(permissions).length,
        permissionsKeys: Object.keys(permissions).slice(0, 5)
      });

      const dynamicMenuItems = convertSupabaseMenusToNavItems(supabaseMenus, permissions);

      console.log('🔄 [Navigation] 변환 결과:', {
        dynamicMenuItemsCount: dynamicMenuItems.length,
        dynamicMenuItems: dynamicMenuItems.map(item => ({
          id: item.id,
          title: item.title,
          childrenCount: item.children?.length
        }))
      });

      // 동적 메뉴가 없으면 기본 메뉴라도 표시
      const combinedItems =
        dynamicMenuItems.length > 0
          ? [...dynamicMenuItems]
          : ([
              {
                id: 'fallback-group',
                title: '메인메뉴',
                type: 'group',
                children: [
                  {
                    id: 'dashboard-default',
                    title: '대시보드',
                    type: 'item',
                    url: '/dashboard/default',
                    icon: Home3,
                    breadcrumbs: false,
                    description: '대시보드'
                  }
                ]
              }
            ] as NavItemType[]);

      // 디버깅용 로그
      console.log('동적 메뉴 업데이트:', {
        pathname,
        dynamicItems: dynamicMenuItems.length,
        totalItems: combinedItems.length,
        supabaseMenusCount: supabaseMenus.length,
        supabaseLoading,
        hasMenus: combinedItems.length > 0
      });

      setMenuItems({ items: combinedItems });
    } catch (error) {
      console.error('메뉴 업데이트 중 오류 발생:', error);
      // 오류 발생 시에도 최소한의 메뉴는 표시
      setMenuItems({
        items: [
          {
            id: 'error-fallback-group',
            title: '메인메뉴',
            type: 'group',
            children: [
              {
                id: 'dashboard-default-fallback',
                title: '대시보드',
                type: 'item',
                url: '/dashboard/default',
                icon: Home3,
                breadcrumbs: false,
                description: '대시보드'
              }
            ]
          }
        ] as NavItemType[]
      });
    }
  };

  useLayoutEffect(() => {
    // Dashboard 메뉴 임시 숨김 처리 - 추후 사용 가능
    // if (menuLoading && !isFound(menuItem, 'group-dashboard-loading')) {
    //   menuItem.items.splice(0, 0, dashboardMenu);
    //   setMenuItems({ items: [...menuItem.items] });
    // } else if (!menuLoading && dashboardMenu?.id !== undefined && !isFound(menuItem, 'group-dashboard')) {
    //   menuItem.items.splice(0, 1, dashboardMenu);
    //   setMenuItems({ items: [...menuItem.items] });
    // } else {
    //   setMenuItems({ items: [...menuItem.items] });
    // }

    console.log('🔄 useLayoutEffect 트리거:', {
      menuLoading,
      pathname,
      supabaseMenusLength: supabaseMenus?.length || 0,
      supabaseLoading,
      permissionsLoading,
      trigger: 'dependencies changed'
    });
    updateMenuItems();
    // eslint-disable-next-line
  }, [menuLoading, pathname, supabaseMenus, supabaseLoading, permissions, permissionsLoading]); // 권한 의존성 추가

  // 메뉴 업데이트 이벤트 리스너 및 전역 에러 핸들러
  useEffect(() => {
    const handleMenuUpdate = () => {
      console.log('🔄 Navigation: MenuUpdate 이벤트 수신 - useSupabaseMenuManagement에서 데이터 새로고침 처리 중');
      // useSupabaseMenuManagement 훅에서 이미 fetchMenus()를 호출하므로
      // 여기서는 별도 처리 불필요 (의존성으로 자동 업데이트됨)
    };

    // 전역 Promise rejection 핸들러
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Navigation 컴포넌트에서 처리되지 않은 Promise rejection:', {
        reason: event.reason,
        reasonType: typeof event.reason,
        reasonString: String(event.reason),
        stack: event.reason?.stack
      });
      // Next.js Dev Overlay에서 [object Event] 에러 방지
      event.preventDefault();
    };

    window.addEventListener('menuUpdated', handleMenuUpdate);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('menuUpdated', handleMenuUpdate);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const lastItem = isHorizontal ? HORIZONTAL_MAX_ITEM : null;
  let lastItemIndex = menuItems.items.length - 1;
  let remItems: NavItemType[] = [];
  let lastItemId: string;

  if (lastItem && lastItem < menuItems.items.length) {
    lastItemId = menuItems.items[lastItem - 1].id!;
    lastItemIndex = lastItem - 1;
    remItems = menuItems.items.slice(lastItem - 1, menuItems.items.length).map((item) => ({
      title: item.title,
      elements: item.children,
      icon: item.icon,
      ...(item.url && {
        url: item.url
      })
    }));
  }

  const navGroups = menuItems.items.slice(0, lastItemIndex + 1).map((item) => {
    switch (item.type) {
      case 'group':
        if (item.url && item.id !== lastItemId) {
          return (
            <Fragment key={item.id}>
              {menuOrientation !== MenuOrientation.HORIZONTAL && <Divider sx={{ my: 0.5 }} />}
              <NavItem item={item} level={1} isParents setSelectedID={() => setSelectedID('')} />
            </Fragment>
          );
        }
        return (
          <NavGroup
            key={item.id}
            selectedID={selectedID}
            setSelectedID={setSelectedID}
            setSelectedItems={setSelectedItems}
            setSelectedLevel={setSelectedLevel}
            selectedLevel={selectedLevel}
            selectedItems={selectedItems}
            lastItem={lastItem!}
            remItems={remItems}
            lastItemId={lastItemId}
            item={item}
          />
        );
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });
  return (
    <Box
      sx={{
        pt: drawerOpen ? (isHorizontal ? 0 : 2) : 0,
        '& > ul:first-of-type': { mt: 0 },
        display: isHorizontal ? { xs: 'block', lg: 'flex' } : 'block',
        alignItems: 'center'
      }}
    >
      {navGroups}
    </Box>
  );
}
