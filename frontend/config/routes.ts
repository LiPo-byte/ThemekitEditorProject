export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './user/login',
      },
    ],
  },
  {
    name: 'editor',
    layout: false,
    icon: 'edit',
    path: '/editor',
    component: './editor',
  },
  {
    name: 'designer-list',
    icon: 'team',
    access: 'canAdmin',
    path: '/designer-list',
    component: './designer-list',
  },
  {
    name: 'component-list',
    icon: 'appstore',
    access: 'canAdmin',
    path: '/component-list',
    component: './component-list',
  },
  {
    name: 'account',
    icon: 'user',
    path: '/account',
    routes: [
      {
        path: '/account',
        redirect: '/account/center',
      },
      {
        name: 'center',
        path: '/account/center',
        component: './account/center',
      },
      {
        name: 'settings',
        path: '/account/settings',
        component: './account/settings',
      },
    ],
  },
  {
    path: '/',
    redirect: '/account/center',
  },
  {
    component: './exception/404',
    path: '/*',
  },
];
