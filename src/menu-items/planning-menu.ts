// assets
import { TrendUp, MoneyRecive, MoneyAdd } from '@wandersonalwes/iconsax-react';

// types
import { NavItemType } from 'types/menu';

// icons
const icons = {
  planning: TrendUp,
  sales: MoneyRecive,
  investment: MoneyAdd
};

// ==============================|| MENU ITEMS - PLANNING MENU ||============================== //

const planningMenu: NavItemType = {
  id: 'group-planning-menu',
  title: '기획메뉴',
  icon: icons.planning,
  type: 'group',
  children: [
    {
      id: 'sales',
      title: '매출관리',
      type: 'item',
      url: '/planning/sales',
      icon: icons.sales,
      breadcrumbs: false
    },
    {
      id: 'investment',
      title: '투자관리',
      type: 'item',
      url: '/planning/investment',
      icon: icons.investment,
      breadcrumbs: false
    }
  ]
};

export default planningMenu;
