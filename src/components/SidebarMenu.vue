<template>
  <div class="sidebar" :class="{ collapsed: localCollapse }">
    <div class="sidebar-header">
      <span v-if="!localCollapse" class="sidebar-title">功能菜单</span>
      <el-icon class="collapse-icon" @click="handleCollapse">
        <Fold v-if="!localCollapse" />
        <Expand v-else />
      </el-icon>
    </div>
    <el-menu
      :default-active="$route.path"
      :collapse="localCollapse"
      router
      class="sidebar-menu"
    >
      <el-menu-item v-if="showMenu('home')" index="/platform/home">
        <el-icon><House /></el-icon>
        <span>首页</span>
      </el-menu-item>
      <el-sub-menu v-if="showMenu('equipment')" index="1">
        <template #title>
          <el-icon><Folder /></el-icon>
          <span>设备信息管理</span>
        </template>
        <el-menu-item index="/platform/equipment/list">查找设备</el-menu-item>
        <el-menu-item index="/platform/user/reserve">我的预约</el-menu-item>
        <el-menu-item v-if="showUserMenu" index="/platform/equipment/reserve">预约管理</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showMenu('borrow')" index="2">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>设备操作管理</span>
        </template>
        <el-menu-item index="/platform/user/borrow">我的借用</el-menu-item>
        <el-menu-item index="/platform/user/return">我的归还</el-menu-item>
        <el-menu-item v-if="showUserMenu" index="/platform/equipment/borrow">借用管理</el-menu-item>
        <el-menu-item v-if="showUserMenu" index="/platform/equipment/return">归还管理</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showMenu('repair')" index="3">
        <template #title>
          <el-icon><Notebook /></el-icon>
          <span>设备报修管理</span>
        </template>
        <el-menu-item index="/platform/user/repair">我的报修</el-menu-item>
        <el-menu-item v-if="showUserMenu" index="/platform/equipment/repair">报修管理</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showUserMenu" index="3">
        <template #title>
          <el-icon><Notebook /></el-icon>
          <span>用户管理</span>
        </template>
        <el-menu-item index="/platform/user/list">用户列表</el-menu-item>
        <el-menu-item index="/platform/user/register">用户注册</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showWarehouseMenu" index="4">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>仓库管理</span>
        </template>
        <el-menu-item index="/platform/warehouse/info">仓库信息</el-menu-item>
        <el-menu-item index="/platform/warehouse/stock">出入库记录</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showSupplierMenu" index="5">
        <template #title>
          <el-icon><ShoppingBag /></el-icon>
          <span>供应商管理</span>
        </template>
        <el-menu-item index="/platform/supplier/info">供应商信息</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showNoticeMenu" index="6">
        <template #title>
          <el-icon><Bell /></el-icon>
          <span>公告管理</span>
        </template>
        <el-menu-item index="/platform/notice/list">公告列表</el-menu-item>
      </el-sub-menu>
      <el-sub-menu v-if="showSystemMenu" index="7">
        <template #title>
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </template>
        <el-menu-item index="/platform/system/config">系统配置</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  House,
  Folder,
  Document,
  Notebook,
  Box,
  ShoppingBag,
  Bell,
  Setting,
  Fold,
  Expand
} from '@element-plus/icons-vue'

export default {
  name: 'SidebarMenu',
  props: {
    isCollapse: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:isCollapse'],
  setup(props, { emit }) {
    const route = useRoute()
    const localCollapse = ref(props.isCollapse)

    const showMenu = (module) => {
      const roleMenus = {
        admin: ['home', 'equipment', 'borrow', 'return', 'repair', 'reserve', 'warehouse', 'supplier', 'department', 'system', 'notice'],
        teacher: ['home', 'equipment', 'borrow', 'return', 'repair', 'reserve'],
        student: ['home', 'equipment', 'borrow', 'return', 'repair', 'reserve']
      }
      const role = localStorage.getItem('role') || 'student'
      return roleMenus[role]?.includes(module) || false
    }

    const showUserMenu = computed(() => {
      const role = localStorage.getItem('role') || 'student'
      return role === 'admin'
    })

    const showWarehouseMenu = computed(() => {
      const role = localStorage.getItem('role') || 'student'
      return role === 'admin'
    })

    const showSupplierMenu = computed(() => {
      const role = localStorage.getItem('role') || 'student'
      return role === 'admin'
    })

    const showNoticeMenu = computed(() => {
      const role = localStorage.getItem('role') || 'student'
      return role === 'admin'
    })

    const showSystemMenu = computed(() => {
      const role = localStorage.getItem('role') || 'student'
      return role === 'admin'
    })

    const handleCollapse = () => {
      localCollapse.value = !localCollapse.value
      emit('update:isCollapse', localCollapse.value)
    }

    return {
      route,
      localCollapse,
      handleCollapse,
      showMenu,
      showUserMenu,
      showWarehouseMenu,
      showSupplierMenu,
      showNoticeMenu,
      showSystemMenu,
      House,
      Folder,
      Document,
      Notebook,
      Box,
      ShoppingBag,
      Bell,
      Setting,
      Fold,
      Expand
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: calc(100vh - 100px);
  background: var(--sidebar-bg);
  transition: all 0.3s;
  overflow-y: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--sidebar-text);
}

.collapse-icon {
  cursor: pointer;
  color: var(--sidebar-text);
  font-size: 20px;
  transition: transform 0.3s;
}

.collapse-icon:hover {
  transform: rotate(15deg);
}

.sidebar-menu {
  --el-menu-bg-color: var(--sidebar-bg);
  --el-menu-text-color: var(--sidebar-text);
  --el-menu-active-color: var(--sidebar-active);
  --el-menu-border-color: var(--sidebar-border);
}

</style>
