import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/contacts',
  },
  {
    path: '/contacts',
    component: () => import('../views/ContactsPage.vue'),
  },
  {
    path: '/add',
    component: () => import('../views/AddPage.vue'),
  },
  {
    path: '/contact/:id',
    component: () => import('../views/ContactPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
