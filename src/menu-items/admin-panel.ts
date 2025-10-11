// assets
import { Setting2, TaskSquare, Profile, Code } from '@wandersonalwes/iconsax-react';

// types
import { NavItemType } from 'types/menu';

// icons
const icons = {
  systemSettings: Setting2,
  checklist: TaskSquare,
  userSettings: Profile,
  masterCode: Code
};

// ==============================|| MENU ITEMS - ADMIN PANEL ||============================== //

const adminPanel: NavItemType = {
  id: 'group-admin-panel',
  title: '관리자메뉴',
  icon: icons.dashboard,
  type: 'group',
  children: [
    {
      id: 'system-settings',
      title: '시스템 설정',
      type: 'item',
      icon: icons.systemSettings,
      url: '/admin-panel/system-settings',
      breadcrumbs: false
    },
    {
      id: 'master-code',
      title: '마스터코드관리',
      type: 'item',
      icon: icons.masterCode,
      url: '/admin-panel/master-code',
      breadcrumbs: false
    },
    {
      id: 'checklist-management',
      title: '체크리스트관리',
      type: 'item',
      icon: icons.checklist,
      url: '/admin-panel/checklist-management',
      breadcrumbs: false
    },
    {
      id: 'user-settings',
      title: '사용자설정',
      type: 'item',
      icon: icons.userSettings,
      url: '/admin-panel/user-settings',
      breadcrumbs: false
    }
  ]
};

export default adminPanel;
