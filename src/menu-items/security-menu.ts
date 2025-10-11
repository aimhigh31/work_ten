// assets
import { Shield, SearchStatus, Book1, Warning2, DocumentText } from '@wandersonalwes/iconsax-react';

// types
import { NavItemType } from 'types/menu';

// icons
const icons = {
  security: Shield,
  inspection: SearchStatus,
  education: Book1,
  incident: Warning2,
  regulation: DocumentText
};

// ==============================|| MENU ITEMS - SECURITY MENU ||============================== //

const securityMenu: NavItemType = {
  id: 'group-security-menu',
  title: '보안메뉴',
  icon: icons.security,
  type: 'group',
  children: [
    {
      id: 'security-inspection',
      title: '보안점검관리',
      type: 'item',
      url: '/security/inspection',
      icon: icons.inspection,
      breadcrumbs: false
    },
    {
      id: 'security-education',
      title: '보안교육관리',
      type: 'item',
      url: '/security/education',
      icon: icons.education,
      breadcrumbs: false
    },
    {
      id: 'incident',
      title: '보안사고관리',
      type: 'item',
      url: '/security/incident',
      icon: icons.incident,
      breadcrumbs: false
    },
    {
      id: 'regulation',
      title: '보안규정관리',
      type: 'item',
      url: '/security/regulation',
      icon: icons.regulation,
      breadcrumbs: false
    }
  ]
};

export default securityMenu;
