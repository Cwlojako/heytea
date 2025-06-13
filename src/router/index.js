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
        const { u, ph } = to.query
        if (u) {
          const { data: isClose } = await axios.get(`${baseUrl}/isLinkClosed?uuid=${u}`)
          if (isClose.data) {
            next({ name: '404'})
          } else {
            const { data: res } = await axios.get(`${baseUrl}/checkOrder?signal=${u}&ph=${ph}`)
            if (res.data) {
              next({ name: 'OrderDetail', params: { u }, query: { ph } })
            } else {
              next()
            }
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
        const { u, ph } = to.query
        if (u) {
          const { data: isClose } = await axios.get(`${baseUrl}/isLinkClosed?uuid=${u}`)
          if (isClose.data) {
            next({ name: '404'})
          } else {
            const { data: res } = await axios.get(`${baseUrl}/checkOrder?signal=${u}&ph=${ph}`)
            if (res.data) {
              next({ name: 'OrderDetail', params: { u }, query: { ph } })
            } else {
              next()
            }
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
      path: '/setting',
      name: 'GenerateUrl',
      component: () => import('@/views/generateUrl.vue')
    },
    {
      path: '/orderDetail/:u',
      name: 'OrderDetail',
      component: () => import('@/views/orderDetail.vue')
    },
    {
      path: '/accountSetting',
      name: 'AccountSetting',
      component: () => import('@/views/accountSetting.vue')
    },
    {
      path: '/404',
      name: '404',
      component: () => import('@/views/404.vue')
    },
    {
      path: '/backstage',
      name: 'Backstage',
      component: () => import('@/views/backstage/index.vue'),
      children: [
        {
          path: 'links',
          name: 'Links',
          component: () => import('@/views/backstage/links.vue')
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('@/views/backstage/accounts.vue')
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/backstage/orders.vue')
        }
      ]
    },
  ]
})

export default router
