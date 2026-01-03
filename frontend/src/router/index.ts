import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

import About from '@/views/About.vue'
import Home from '@/views/Home.vue'
import Play from '@/views/Play.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/play',
    name: 'Play',
    component: Play,
  },
  {
    path: '/about',
    name: 'About',
    component: About,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
