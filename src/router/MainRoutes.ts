import path from 'path';
const MainRoutes = {
  path: '/main',
  meta: {
    requiresAuth: true
  },
  redirect: '/main',
  component: () => import('@/layouts/dashboard/DashboardLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '/',
      component: () => import('@/views/dashboard/DefaultDashboard.vue')
    },
    {
      name: 'VerifierLandingPage',
      path: '/verifier-dashboard',
      component: () => import('@/views/dashboard/VerifierDashboard.vue')
    },    
    {
      name: 'UserLandingPage',
      path: '/user-dashboard',
      component: () => import('@/views/dashboard/UserDashboard.vue')
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      component: () => import('@/views/dashboard/DefaultDashboard.vue')
    },
    {
      name: 'AddProduct',
      path: '/products/add',
      component: () => import('@/views/product/AddProductPage.vue')
    },
    {
      name: 'UpdateProduct',
      path: '/products/update/:id',
      component: () => import('@/views/product/UpdateProductPage.vue'),
      props: true
    },
    {
      name: 'ViewProduct',
      path: '/products/view/:id',
      component: () => import('@/views/product/ViewProductPage.vue'),
      props: (route: any) => ({ id: route.query.id })
    },
    {
      name: 'ProductList',
      path: '/products',
      component: () => import('@/views/product/ProductListPage.vue')
    },
    {
      name: 'ChangePassword',
      path: '/change-password',
      component: () => import('@/views/authentication/auth/ChangePasswordPage.vue')
    },
    {
      name: 'ViewCompanyProfile',
      path: '/company/profile',
      component: () => import('@/views/company/ViewCompanyProfilePage.vue')
    },
    {
      name: 'AddCompanyProfile',
      path: '/company/profile/add',
      component: () => import('@/views/company/AddCompanyProfilePage.vue')
    },
    {
      name: 'UpdateCompanyProfile',
      path: '/company/profile/update',
      component: () => import('@/views/company/UpdateCompanyProfilePage.vue')
    },
    {
      name: 'Team',
      path: '/company/user',
      component: () => import('@/views/company/ViewCompanyTeamPage.vue')
    },
    {
      name:'ProductionPlanList',
      path: '/productionplanlist',
      component: () => import('@/views/production/ProductionPlanListPage.vue')
    },
    {
      name: 'ProductionPlan',
      path: '/production',
      component: () => import('@/views/production/ViewProductionPlan.vue')
    },
    {
      name: 'ProductionTaeStatus',
      path: '/production/taeStatus',
      component: () => import('@/views/production/ProductionTaeStatus.vue')
    },
    {
      name: 'AddProductionPlan',
      path: '/production/add',
      component: () => import('@/views/production/AddProductionPage.vue')
    },
    {
      name: 'UpdateProductionPlan',
      path: '/production/update/:id',
      component: () => import('@/views/production/UpdateProductionPage.vue'),
      props: true
    },
    {
      name: 'EndDestinations',
      path: '/end-destinations',
      component: () => import('@/views/endDestinations/EndDestinationListPage.vue')
    },    
    {
      name: 'AddEndDestination',
      path: '/end-destinations/add',
      component: () => import('@/views/endDestinations/AddEndDestinationPage.vue')
    },    
    {
      name: 'UpdateEndDestination',
      path: '/end-destinations/update/:id',
      component: () => import('@/views/endDestinations/UpdateEndDestinationPage.vue')
    },  
    {
      name: 'ViewEndDestination',
      path: '/end-destinations/view/:id',
      component: () => import('@/views/endDestinations/ViewEndDestinationPage.vue')
    },
    {
      name: 'UserTaePayments',
      path: '/usertaepayments',
      component: () => import('@/views/taePayments/TaePayments.vue')
    },
    {
      name: 'AddImportShipment',
      path: '/imports/add',
      component: () => import('@/views/imports/AddImportShipmentPage.vue')
    },
    {
      name: 'UpdateImportShipment',
      path: '/imports/update/:id',
      component: () => import('@/views/imports/UpdateImportShipmentPage.vue')
    },
    {
      name: 'ImportShipmentList',
      path: '/imports',
      component: () => import('@/views/imports/ImportShipmentListPage.vue')
    },    
    {
      name: 'ViewImportShipment',
      path: '/imports/view/:id',
      component: () => import('@/views/imports/ViewImportShipmentPage.vue')
    },
    {
      name: 'ViewTaeStatus',
      path: '/imports/taestatus',
      component: () => import('@/views/imports/ViewTaeStatus.vue')
    },
    {
      name: 'AddCompensation',
      path: '/compensations/add',
      component: () => import('@/views/compensation/AddCompensationPage.vue')
    },
    {
      name: 'CompensationList',
      path: '/compensation/requests',
      component: () => import('@/views/compensation/CompensationRequestListPage.vue')
    },
    {
      name: 'UpdateCompensation',
      path: '/compensation/requests/update/:id',
      component: () => import('@/views/compensation/UpdateCompensationRequestPage.vue')
    },
    {
      name: 'ViewCompensation',
      path: '/compensation/requests/view/:id',
      component: () => import('@/views/compensation/ViewCompensationRequestPage.vue')
    },
    {
      name: 'Compensation',
      path: '/compensations',
      component: () => import('@/views/compensation/CompensationPage.vue')
    },
    {
      name: 'MyAccount',
      path: '/myaccount',
      component: () => import('@/views/myAccount/MyAccount.vue')
    },
    {
      name:"VerifierList",
      path: '/verifiers',
      component: () => import('@/views/verifier/VerifiersList.vue')
    },
    {
      name:"VerifierTaskLog",
      path: '/verifiers/:id',
      component: () => import('@/views/verifier/VerifierTaskLog.vue')
    },
    {
      name: 'CompanyList',
      path: '/companies',
      component: () => import('@/views/verifier/Company/CompanyListPage.vue')
    },
    {
      name:'ViewCompany',
      path: '/companies/:id',
      component: () => import('@/views/verifier/Company/ViewCompanyPage.vue'),
    },
    {
      name:'ViewProductsByCompany',
      path:'/verify/products',
      component: () => import('@/views/verifier/Product/CompanyProductListPage.vue')
    },
    {
      name:'ViewProductsDetailByCompany',
      path:'/verify/products/:id',
      component: () => import('@/views/verifier/Product/CompanyProductDetailPage.vue')
    },
    {
      name:'ViewCompanyProducts',
      path:'/companies/:companyId/product',
      component: () => import('@/views/verifier/Product/CompanyProductListPage.vue')
    },
    {
      name:'ViewCompanyProductDetail',
      path:'/companies/:companyId/product/:id',
      component: () => import('@/views/verifier/Product/CompanyProductDetailPage.vue')
    },
    {
      name:'VerifyProductionPlanList',
      path:'/verify/productionplan/:companyId',
      component: () => import('@/views/verifier/ProductionPlan/ProductionPlanList.vue')
    },
    {
      name:'VerifyProductionList',
      path:'/verify/production',
      component: () => import('@/views/verifier/ProductionPlan/ProductionList.vue')
    },
    {
      name:'VerifyProductionPlanListCompany',
      path:'/verify/productionplan/:companyId',
      component: () => import('@/views/verifier/ProductionPlan/ProductionPlanList.vue')
    },
    {
      name:'ViewProductionPlanDetail',
      path:'/verify/productionplan/:companyId/:id',
      component: () => import('@/views/verifier/ProductionPlan/ProductionPlanDetail.vue')
    },
    {
      name:'VerifyImportShipmentList',
      path:'/verify/imports',
      component: () => import('@/views/verifier/Imports/ImportsListPage.vue')
    },   
    {
      name: 'ViewVerifyImportShipment',
      path: 'verify/imports/view/:id',
      component: () => import('@/views/imports/ViewImportShipmentPage.vue')
    },
    {
      name:'VerifyCompensationList',
      path:'/verify/compensation',
      component: () => import('@/views/verifier/Compensation/CompensationListpage.vue')
    },
    {
      name: 'ViewVerifyCompensation',
      path: '/verify/compensation/view/:id',
      component: () => import('@/views/compensation/ViewCompensationRequestPage.vue')
    },
    {
      name: 'VerifyEndDestinationList',
      path:'/verify/end_destination',
      component: () => import('@/views/verifier/EndDestination/EndDestinationListPage.vue')
    },
    {
      name: 'VerifyTaePaymentStatus',
      path: '/verify/taePaymentStatus',
      component: () => import('@/views/verifier/TAEPaymentStatus/TAEPaymentStatusPage.vue')
    },
    {
      name:'AdminInviteUser',
      path: '/admin/invite',
      component: () => import('@/views/admin/InviteUserPage.vue')
    },
    // admin routes
    {
      name: 'Teafees',
      path: '/taeFees',
      component: () => import('@/views/admin/TaeFees.vue')
    },
    {
      name: 'Users',
      path: '/users',
      component: () => import('@/views/admin/Users.vue')
    },
    {
      name: 'TaePayments',
      path: '/taepayments',
      component: () => import('@/views/admin/TaePayments.vue')
    }
  ]
};

export default MainRoutes;
