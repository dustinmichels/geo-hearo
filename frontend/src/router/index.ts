import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
