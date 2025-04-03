import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Store',
      component: () => import('@/views/store.vue'),
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/goods/:id',
      name: 'Goods',
      component: () => import('@/views/goods.vue')
    }
  ]
})

export default router
