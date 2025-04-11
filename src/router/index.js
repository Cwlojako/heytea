import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'

const baseUrl = import.meta.env.VITE_BASE_URL


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Store',
      component: () => import('@/views/store.vue'),
      meta: {
        keepAlive: true
      },
      beforeEnter: async (to, from, next) => {
        const u = to.query.u
        if (u) {
          const { data: res } = await axios.get(`${baseUrl}/checkOrder?signal=${u}`)
          if (res.data) {
            next({ name: 'OrderDetail', params: { u } })
          } else {
            next()
          }
        } else {
          next({ name: '404'})
        }
      }
    },
    {
      path: '/store',
      name: 'Store',
      component: () => import('@/views/store.vue'),
      meta: {
        keepAlive: true
      },
      beforeEnter: async (to, from, next) => {
        const u = to.query.u
        if (u) {
          const { data: res } = await axios.get(`${baseUrl}/checkOrder?signal=${u}`)
          if (res.data) {
            next({ name: 'OrderDetail', params: { u } })
          } else {
            next()
          }
        } else {
          next({ name: '404'})
        }
      }
    },
    {
      path: '/goods/:id',
      name: 'Goods',
      component: () => import('@/views/goods.vue')
    },
    {
      path: '/generateUrl',
      name: 'GenerateUrl',
      component: () => import('@/views/generateUrl.vue')
    },
    {
      path: '/orderDetail/:u',
      name: 'OrderDetail',
      component: () => import('@/views/orderDetail.vue')
    },
    {
      path: '/404',
      name: '404',
      component: () => import('@/views/404.vue')
    }
  ]
})

export default router
