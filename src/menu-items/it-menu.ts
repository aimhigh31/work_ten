// assets
import { Code, MessageQuestion, Monitor, CodeCircle, Setting2, Book1 } from '@wandersonalwes/iconsax-react';

// types
import { NavItemType } from 'types/menu';

// icons
const icons = {
  it: Code,
  voc: MessageQuestion,
  solution: Setting2,
  hardware: Monitor,
  software: CodeCircle,
  education: Book1
};

// ==============================|| MENU ITEMS - IT MENU ||============================== //

const itMenu: NavItemType = {
  id: 'group-it-menu',
  title: 'IT메뉴',
  icon: icons.it,
  type: 'group',
  children: [
    {
      id: 'voc',
      title: 'VOC관리',
      type: 'item',
      url: '/it/voc',
      icon: icons.voc,
      breadcrumbs: false
    },
    {
      id: 'solution',
      title: '솔루션관리',
      type: 'item',
      url: '/it/solution',
      icon: icons.solution,
      breadcrumbs: false
    },
    {
      id: 'hardware',
      title: '하드웨어관리',
      type: 'item',
      url: '/it/hardware',
      icon: icons.hardware,
      breadcrumbs: false
    },
    {
      id: 'software',
      title: '소프트웨어관리',
      type: 'item',
      url: '/it/software',
      icon: icons.software,
      breadcrumbs: false
    },
    {
      id: 'it-education',
      title: 'IT교육관리',
      type: 'item',
      url: '/it/education',
      icon: icons.education,
      breadcrumbs: false
    }
  ]
};

export default itMenu;
