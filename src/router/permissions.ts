import { ROLE } from '@/composables/role';
import {
  DashboardOutlined,
  ProfileOutlined,
  ImportOutlined,
  FileTextOutlined,
  HomeOutlined,
  HddOutlined,
  ShoppingOutlined,
  UsergroupAddOutlined,
  DollarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  MessageOutlined
} from '@ant-design/icons-vue';

export enum PageType {
  DASHBOARD = 'dashboard',
  MYACCOUNT = 'myaccount',
  VERIFIER = 'verifier',
  MESSAGES = 'messages',
  COMPANY = 'company',
  PRODUCT = 'product',
  PRODUCTION = 'production',
  IMPORTS = 'imports',
  COMPENSATIONS = 'compensations',
  END_DESTINATION = 'endDestination',
  LATE_TAE_PAYMENTS = 'lateTaePayments'
}
export const data: MenuData = {
  [ROLE.ADMIN] : {
    items: [
      {
        title: 'menu.title.dashboard',
        to: '/dashboard',
        icon: DashboardOutlined
      },
      {
        title: 'menu.title.myAccount',
        to: '/myaccount',
        icon: ProfileOutlined
      },
      {
        title: 'menu.title.inviteUser',
        to: '/admin/invite',
        icon: UsergroupAddOutlined
      },
      {
        title: 'menu.title.taeFees',
        to: '/taeFees',
        icon: DollarOutlined
      },
      {
        title: 'menu.title.users',
        to: '/users',
        icon: TeamOutlined
      },
      {
        title: 'menu.title.taePayments',
        to: '/taepayments',
        icon: DollarOutlined
      },
    ]
  },
  [ROLE.VERIFIER]: {
    items: [
      {
        title: 'menu.title.dashboard',
        pageType: PageType.DASHBOARD,
        to: '/verifier-dashboard',
        icon: DashboardOutlined
      },
      {
        title: 'menu.title.myAccount',
        pageType: PageType.MYACCOUNT,
        to: '/myaccount',
        icon: ProfileOutlined
      },
      {
        title: 'menu.title.verifiers',
        pageType: PageType.VERIFIER,
        to: '/verifiers',
        icon: HomeOutlined
      },
      {
        title: 'menu.title.messages',
        pageType: PageType.MESSAGES,
        icon: MessageOutlined
      },
      {
        title: 'menu.title.companies',
        pageType: PageType.COMPANY,
        to: '/companies',
        icon: ShopOutlined
      },
      {
        title: 'menu.title.products',
        pageType: PageType.PRODUCT,
        to: '/verify/products',
        icon: ShoppingOutlined
      },
      {
        title: 'menu.title.productionPlans',
        pageType: PageType.PRODUCTION,
        to: '/verify/production',
        icon: FileTextOutlined
      },
      {
        title: 'menu.title.imports',
        pageType: PageType.IMPORTS,
        to: '/verify/imports',
        icon: ImportOutlined
      },
      {
        title: 'menu.title.compensations',
        pageType: PageType.COMPENSATIONS,
        to: '/verify/compensation',
        icon: HddOutlined
      },
      {
        title: 'menu.title.endDestinations',
        pageType: PageType.END_DESTINATION,
        to: '/verify/end_destination',
        icon: EnvironmentOutlined
      },
      {
        title: 'menu.title.lateTaePayments',
        pageType: PageType.LATE_TAE_PAYMENTS,
        to: '/verify/taePaymentStatus',
        icon: DollarOutlined
      }
    ]
  },
  [ROLE.COMPANY]: {
    items: [
      {
        title: 'menu.title.dashboard',
        to: '/user-dashboard',
        icon: DashboardOutlined
      },
      {
        title: 'menu.title.myAccount',
        to: '/myaccount',
        icon: ProfileOutlined
      },
      {
        title: 'menu.title.myCompany',
        icon: HomeOutlined,
        children:[
          {
            title: 'menu.title.viewProfile',
            to: '/company/profile',
          },{
            title: 'menu.title.team',
            to: '/company/user',
          }

        ]
      },
      {
        title: 'menu.title.myProducts',
        to: '/products',
        icon: ShoppingOutlined,
      },
      {
        title: 'menu.title.production',
        to: '/production',
        icon: FileTextOutlined
      },
      {
        title: 'menu.title.imports',
        to: '/imports',
        icon: ImportOutlined
      },
      {
        title: 'menu.title.compensations',
        to: '/compensations',
        icon: HddOutlined
      },      
      {
        title: 'menu.title.endDestinations',
        to: '/end-destinations',
        icon: EnvironmentOutlined
      },
      {
        title: 'menu.title.taePayments',
        to: '/usertaepayments',
        icon: DollarOutlined
      },
    ]
  },
  [ROLE.USER]: {
    items: [
      {
        title: 'menu.title.dashboard',
        to: '/user-dashboard',
        icon: DashboardOutlined
      },
      {
        title: 'menu.title.myAccount',
        to: '/myaccount',
        icon: ProfileOutlined
      },
      {
        title: 'menu.title.products',
        to: '/products',
        icon: ShoppingOutlined
      },
      {
        title: 'menu.title.production',
        to: '/production',
        icon: FileTextOutlined
      },
      {
        title: 'menu.title.imports',
        to: '/imports',
        icon: ImportOutlined
      },
      {
        title: 'menu.title.compensations',
        to: '/compensations',
        icon: HddOutlined
      },
      {
        title: 'menu.title.endDestinations',
        to: '/end-destinations',
        icon: EnvironmentOutlined
      },
      {
        title: 'menu.title.taePayments',
        to: '/usertaepayments',
        icon: DollarOutlined
      },
    ]
  }
};

export interface MenuItem {
  title: string;
  pageType ?: PageType;
  to?: string;
  icon?: object;
  children?: MenuItem[];
  chip?: number;
}

interface RoleData {
  items: MenuItem[];
}

interface MenuData {
  [key: number]: RoleData;
}

export function getMenuItems(userType: number): MenuItem[] | null {
  const userMenu = data[userType];
  return userMenu ? userMenu.items : null;
}
