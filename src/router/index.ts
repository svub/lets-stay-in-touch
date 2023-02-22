import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';

export type NamedRouteRecord = RouteRecordRaw & {
  title: string;
}

export const profileRoute: NamedRouteRecord = {
  title: 'Profile',
  path: '/profile',
  component: () => import('../views/ProfilePage.vue'),
};

export const contactsRoute: NamedRouteRecord = {
  title: 'Contacts',
  path: '/contacts',
  component: () => import('../views/ContactsPage.vue'),
};

export const addRoute: NamedRouteRecord = {
  title: 'Add contact',
  path: '/add',
  component: () => import('../views/AddPage.vue'),
};

export const contactRoute: NamedRouteRecord = {
  title: 'Contact details',
  path: '/contact/:id',
  component: () => import('../views/ContactPage.vue'),
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '',
    redirect: '/contacts',
  },
  contactsRoute,
  profileRoute,
  addRoute,
  contactRoute,
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
