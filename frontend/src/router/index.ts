import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EmbeddedLayout from '@/views/layouts/EmbeddedLayout.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/embedded',
      component: EmbeddedLayout,
      children: [
        {
          path: 'company-goods',
          component: () => import('@/views/embedded/CompanyGoodsTab.vue')
        },
        {
          path: 'deal-tab',
          component: () => import('@/views/embedded/DealTab.vue')
        }
      ]
    }
  ],
})

export default router
