import { createRouter, createWebHistory } from 'vue-router'
import { checkOrder, isLinkClosed } from '@/api/client'
import { decrypt } from '@/utils/crypto'

const userState = JSON.parse(localStorage.getItem('userState') || '{}')
const userInfo = userState.userInfo ? JSON.parse(decrypt(userState.userInfo)) : null
const roles = userInfo?.roles ?? []

function judgeRole(allowedRoles) {
  return allowedRoles.some(role => roles.includes(role))
}

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
        const { u } = to.query
        if (u) {
          try {
            const { data: isClose } = await isLinkClosed(u)
            if (isClose) {
              next({ name: '404'})
            } else {
              const { data: res } = await checkOrder(u)
              if (res) {
                next({ name: 'OrderDetail', params: { u } })
              } else {
                next()
              }
            }
          } catch {
            next({ name: '404'})
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
        const { u } = to.query
        if (u) {
          try {
            const { data: isClose } = await isLinkClosed(u)
            if (isClose) {
              next({ name: '404'})
            } else {
              const { data: res } = await checkOrder(u)
              if (res) {
                next({ name: 'OrderDetail', params: { u } })
              } else {
                next()
              }
            }
          } catch {
            next({ name: '404'})
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
      path: '/orderDetail/:u',
      name: 'OrderDetail',
      component: () => import('@/views/orderDetail.vue')
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login.vue')
    },
    {
      path: '/setting',
      name: 'Setting',
      component: () => import('@/views/generateUrl.vue')
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
          component: () => import('@/views/backstage/links.vue'),
          meta: {
            title: '链接管理',
            roles: ['Developer', 'Admin', 'J']
          },
          beforeEnter: (to, from, next) => {
            if (judgeRole(['Developer', 'Admin', 'J'])) {
              next()
            } else {
              next({ name: '404' })
            }
          }
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('@/views/backstage/accounts.vue'),
          meta: {
            title: '账号管理',
            roles: ['Developer', 'Admin', 'Q']
          },
          beforeEnter: (to, from, next) => {
            if (judgeRole(['Developer', 'Admin', 'Q'])) {
              next()
            } else {
              next({ name: '404' })
            }
          }
        },
        {
          path: 'orders',
          name: 'Orders',
          component: () => import('@/views/backstage/orders.vue'),
          meta: {
            title: '订单管理',
            roles: ['Developer', 'Admin', 'K']
          },
          beforeEnter: (to, from, next) => {
            if (judgeRole(['Developer', 'Admin', 'K'])) {
              next()
            } else {
              next({ name: '404' })
            }
          }
        }
      ]
    }
  ]
})

export default router
