// project-imports
import adminPanel from './admin-panel';
import applications from './applications';
import planningMenu from './planning-menu';
import itMenu from './it-menu';
import securityMenu from './security-menu';
// import formsTables from './forms-tables'; // 임시 숨김 처리 - 추후 사용 가능
// import chartsMap from './charts-map'; // 임시 숨김 처리 - 추후 사용 가능
// import support from './support'; // 임시 숨김 처리 - 추후 사용 가능

// types
import { NavItemType } from 'types/menu';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [adminPanel, applications, planningMenu, itMenu, securityMenu /* formsTables, chartsMap, support */] // Forms&Tables, Charts & Map, Others 임시 숨김
};

export default menuItems;
