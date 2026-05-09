import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/LoginPage.vue'
import Platform from '@/components/PlatformLayout.vue'
import HomePage from '@/views/HomePage.vue'
import MenuPrompt from '@/components/MenuPrompt.vue'
import EquipmentList from '@/views/equipment/EquipmentList.vue'
import EquipmentBorrow from '@/views/admin/management/EquipmentBorrow.vue'
import EquipmentRepair from '@/views/admin/management/EquipmentRepair.vue'
import EquipmentReturn from '@/views/admin/management/EquipmentReturn.vue'
import EquipmentReserve from '@/views/admin/management/EquipmentReserve.vue'
import UserBorrow from '@/views/operation/UserBorrow.vue'
import UserReturn from '@/views/operation/UserReturn.vue'
import UserRepair from '@/views/operation/UserRepair.vue'
import UserReserve from '@/views/operation/UserReserve.vue'
import MobileLogin from '@/views/mobile/MobileLogin.vue'
import MobileDevice from '@/views/mobile/MobileDevice.vue'
import MobileProfile from '@/views/mobile/MobileProfile.vue'
import MobileRecords from '@/views/mobile/MobileRecords.vue'

import ProfileInfo from '@/views/profile/ProfileInfo.vue'
import UserList from '@/views/admin/user/UserList.vue'
import UserRegister from '@/views/admin/user/UserRegister.vue'
import WarehouseInfo from '@/views/admin/warehouse/WarehouseInfo.vue'
import WarehouseStock from '@/views/admin/warehouse/WarehouseStock.vue'
import SupplierInfo from '@/views/admin/supplier/SupplierInfo.vue'
import NoticeList from '@/views/admin/notice/NoticeList.vue'  
import SystemConfig from '@/views/admin/system/SystemConfig.vue'
import NotFound from '@/views/error/NotFound.vue'
import { checkTokenExpire } from '@/utils/auth'

const routes = [
  {
    path: '/mobile/device',
    name: 'MobileDevice',
    component: MobileDevice
  },
  {
    path: '/mobile/login',
    name: 'MobileLogin',
    component: MobileLogin
  },
  {
    path: '/mobile/profile',
    name: 'MobileProfile',
    component: MobileProfile
  },
  {
    path: '/mobile/records',
    name: 'MobileRecords',
    component: MobileRecords
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
 
  {
    path: '/platform',
    component: Platform,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/platform/home'
      },
      {
        path: 'home',
        component: HomePage
      },
      {
        path: 'notice',
        component: () => import('@/views/NoticeDetail.vue')
      },
      {
        path: 'menu',
        component: MenuPrompt
      },
      {
        path: 'equipment',
        children: [
          {
            path: 'list',
            component: EquipmentList
          },
          {
            path: 'borrow',
            component: EquipmentBorrow
          },
          {
            path: 'repair',
            component: EquipmentRepair
          },
          {
            path: 'return',
            component: EquipmentReturn
          },
          {
            path: 'reserve',
            component: EquipmentReserve
          }
        ]
      },
      {
        path: 'user/borrow',
        component: UserBorrow
      },
      {
        path: 'user/return',
        component: UserReturn
      },
      {
        path: 'user/repair',
        component: UserRepair
      },
      {
        path: 'user/reserve',
        component: UserReserve
      },
      
      {
        path: 'profile/info',
        component: ProfileInfo,
        meta: { requiresAuth: true }
      },
      {
        path: 'user',
        children: [
          {
            path: 'list',
            component: UserList
          },
          {
            path: 'register',
            component: UserRegister
          }
        ]
      },
      {
        path: 'warehouse',
        children: [
          {
            path: 'info',
            component: WarehouseInfo
          },
          {
            path: 'stock',
            component: WarehouseStock
          }
        ]
      },
      {
        path: 'supplier',
        children: [
          {
            path: 'info',
            component: SupplierInfo
          }
        ]
      },
      {
        path: 'notice',
        children: [
          {
            path: 'list',
            component: NoticeList
          }
        ]
      },
      {
        path: 'system',
        children: [
          {
            path: 'config',
            component: SystemConfig
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: NotFound
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')
  
  if (to.meta.requiresAuth && !token) {
    return '/login'
  }
  
  if (to.meta.role && role !== to.meta.role) {
    return '/platform/home'
  }
  
  // 检查token是否有效（防止用户手动删除token后直接访问页面）
  if (to.meta.requiresAuth && token) {
    checkTokenExpire()
  }
})

export default router
