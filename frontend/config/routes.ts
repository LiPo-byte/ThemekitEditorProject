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
    name: 'editor-detail',
    layout: false,
    path: '/editor/:projectId',
    component: './editor',
  },
  {
    name: 'project-list',
    icon: 'appstore',
    path: '/project-list',
    component: './project-list',
  },
  {
    name: 'designer-list',
    icon: 'team',
    access: 'canAdmin',
    path: '/designer-list',
    component: './designer-list',
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
