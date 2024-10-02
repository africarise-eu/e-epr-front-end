const AuthRoutes = {
  path: '/auth',
  component: () => import('@/layouts/blank/BlankLayout.vue'),
  meta: {
    requiresAuth: false
  },
  children: [
    {
      name: 'Login',
      path: '/login',
      component: () => import('@/views/authentication/auth/LoginPage.vue')
    },
    {
      name: 'Register',
      path: '/register',
      component: () => import('@/views/authentication/auth/RegisterPage.vue')
    },
    {
      name: 'Reset Password',
      path: '/reset-password',
      component: () => import('@/views/authentication/auth/ResetPasswordPage.vue')
    },
    {
      name: 'Error 404',
      path: '/error',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    {
      name: 'Set Password',
      path: '/verify/user/:token',
      component: () => import('@/views/authentication/auth/SetPasswordPage.vue')
    }
  ]
};

export default AuthRoutes;
