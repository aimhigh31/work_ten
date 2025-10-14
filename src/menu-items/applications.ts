// project-imports
import { NavActionType } from 'config';

// assets
import { Home3, Calendar1, TrendUp, Task, Link1, Money, Book1 } from '@wandersonalwes/iconsax-react';

// types
import { NavItemType } from 'types/menu';

// icons
const icons = {
  mainMenu: Home3,
  dashboard: Home3,
  task: Task,
  calendar: Calendar1,
  kpi: TrendUp,
  education: Book1,
  cost: Money,
  link: Link1
};

// ==============================|| MENU ITEMS - MAIN MENU ||============================== //

const applications: NavItemType = {
  id: 'group-main-menu',
  title: '메인메뉴',
  icon: icons.mainMenu,
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: '대시보드',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.dashboard,
      breadcrumbs: false
    },
    {
      id: 'task',
      title: '업무관리',
      type: 'item',
      icon: icons.task,
      url: '/apps/task',
      breadcrumbs: false
    },
    {
      id: 'kpi',
      title: 'KPI관리',
      type: 'item',
      icon: icons.kpi,
      url: '/apps/kpi',
      breadcrumbs: false
    },
    {
      id: 'calendar',
      title: '일정관리',
      type: 'item',
      url: '/apps/calendar',
      icon: icons.calendar,
      breadcrumbs: false,
      actions: [
        {
          type: NavActionType.LINK,
          label: 'Full Calendar',
          icon: icons.link,
          url: 'https://fullcalendar.io/docs/react',
          target: true
        }
      ]
    },
    {
      id: 'education',
      title: '개인교육관리',
      type: 'item',
      url: '/apps/education',
      icon: icons.education,
      breadcrumbs: false
    },
    {
      id: 'cost',
      title: '비용관리',
      type: 'item',
      url: '/apps/cost',
      icon: icons.cost,
      breadcrumbs: false
    }
  ]
};

export default applications;
