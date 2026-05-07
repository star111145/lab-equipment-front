<template>
  <div class="platform-header">
    <div class="header-logo">
      <img src="@/assets/logo.svg" alt="实验设备管理平台" />
      <span>实验设备管理平台</span>
    </div>
    <div class="header-menu">
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索业务模块..."
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <div v-if="searchSuggestions.length > 0" class="search-suggestions">
          <div
            v-for="item in searchSuggestions"
            :key="item.path"
            class="suggestion-item"
            @click="handleSuggestionClick(item.path)"
          >
            <el-icon><Link /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="header-actions">
      <div class="theme-toggle">
        <el-dropdown @command="handleThemeCommand">
          <span class="theme-icon">
            <el-icon><Switch /></el-icon>
            <span>{{ themeName }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="light" divided>浅色</el-dropdown-item>
              <el-dropdown-item command="apple-red">苹果红</el-dropdown-item>
              <el-dropdown-item command="crystal-lan">水晶兰</el-dropdown-item>
              <el-dropdown-item command="forest-green">森林绿</el-dropdown-item>
              <el-dropdown-item command="golden-sunset">金色夕阳</el-dropdown-item>
              <el-dropdown-item command="dark">深色</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <el-dropdown @command="handleCommand">
        <span class="user-info">
          <el-icon><User /></el-icon>
          <span>{{ realName }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="home">
                <el-icon><House /></el-icon><span>首页</span>
              </el-dropdown-item>
              <el-dropdown-item command="menu">
                <el-icon><Menu /></el-icon><span>功能菜单</span>
              </el-dropdown-item>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon><span>个人中心</span>
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><TurnOff /></el-icon><span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import service from '@/api/request'
import { getThemeName } from '@/utils/theme'
import {
  User,
  Search,
  TurnOff,
  Link,
  Switch,
  ArrowDown,
  Menu,
  House
} from '@element-plus/icons-vue'

export default {
  name: 'PlatformHeader',
  emits: ['theme-change'],
  setup(props, { emit }) {
    const router = useRouter()
    const searchKeyword = ref('')
    const themeName = ref('浅色')

    const realName = ref('')
    const username = ref('')
    const role = ref('')

    onMounted(() => {
      realName.value = localStorage.getItem('realName') || ''
      username.value = localStorage.getItem('username') || ''
      role.value = localStorage.getItem('role') || ''
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        themeName.value = getThemeName(savedTheme)
      }
    })

    const handleCommand = (command) => {
      switch (command) {
        case 'home':
          router.push('/platform/home')
          break
        case 'profile':
          router.push('/platform/profile/info')
          break
        case 'menu':
          window.dispatchEvent(new CustomEvent('menu-toggle', { detail: true }))
          router.push('/platform/menu')
          break
        case 'logout':
          service
            .post('/logout')
            .then(() => {
              console.log('后端退出成功')
              localStorage.removeItem('token')
              localStorage.removeItem('userId')
              localStorage.removeItem('username')
              localStorage.removeItem('realName')
              localStorage.removeItem('role')
              localStorage.removeItem('email')
              localStorage.removeItem('isAdministrator')
              router.push('/login')
            })
            .catch(err => {
              console.error('后端退出失败:', err)
              localStorage.removeItem('token')
              localStorage.removeItem('userId')
              localStorage.removeItem('username')
              localStorage.removeItem('realName')
              localStorage.removeItem('role')
              localStorage.removeItem('email')
              localStorage.removeItem('isAdministrator')
              router.push('/login')
            })
          break
      }
    }

    const handleThemeCommand = (theme) => {
      themeName.value = getThemeName(theme)
      emit('theme-change', theme)
    }

    const roleMenus = {
      admin: ['home', 'equipment', 'borrow', 'return', 'repair', 'reserve', 'warehouse', 'supplier', 'department', 'system', 'notice', 'reserve-admin', 'borrow-admin', 'return-admin', 'repair-admin'],
      teacher: ['home', 'equipment', 'borrow', 'return', 'repair', 'reserve'],
      student: ['home', 'equipment', 'borrow', 'return', 'repair', 'reserve']
    }

    const searchSuggestions = computed(() => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return []
      
      const userRole = role.value
      const allowedModules = roleMenus[userRole] || []
      
      const allMenuItems = [
        { path: '/platform/home', label: '首页', module: 'home' },
        { path: '/platform/equipment/list', label: '查找设备', module: 'equipment' },
        { path: '/platform/user/reserve', label: '我的预约', module: 'equipment' },
        { path: '/platform/equipment/reserve', label: '预约管理', module: 'reserve-admin' },
        { path: '/platform/user/borrow', label: '我的借用', module: 'borrow' },
        { path: '/platform/user/return', label: '我的归还', module: 'return' },
        { path: '/platform/equipment/borrow', label: '借用管理', module: 'borrow-admin' },
        { path: '/platform/equipment/return', label: '归还管理', module: 'return-admin' },
        { path: '/platform/user/repair', label: '我的报修', module: 'repair' },
        { path: '/platform/equipment/repair', label: '报修管理', module: 'repair-admin' },
        { path: '/platform/profile/info', label: '个人信息', module: 'profile' },
        { path: '/platform/user/list', label: '用户管理', module: 'user' },
        { path: '/platform/user/register', label: '用户注册', module: 'user' },
        { path: '/platform/warehouse/info', label: '仓库信息', module: 'warehouse' },
        { path: '/platform/warehouse/stock', label: '出入库信息', module: 'warehouse' },
        { path: '/platform/supplier/info', label: '供应商信息', module: 'supplier' },
        { path: '/platform/notice/list', label: '公告列表', module: 'notice' },
        { path: '/platform/system/config', label: '系统配置', module: 'system' }
      ]
      
      const filteredMenuItems = allMenuItems.filter(item => {
        return allowedModules.includes(item.module)
      })
      
      return filteredMenuItems.filter(item => 
        item.label.toLowerCase().includes(keyword) || 
        item.path.toLowerCase().includes(keyword)
      )
    })

    const handleSuggestionClick = (path) => {
      searchKeyword.value = ''
      router.push(path)
    }

    const handleSearch = () => {
      const keyword = searchKeyword.value.trim().toLowerCase()
      if (!keyword) return
      
      const userRole = role.value
      const allowedModules = roleMenus[userRole] || []
      
      const allMenuItems = [
        { path: '/platform/home', label: '首页', module: 'home' },
        { path: '/platform/equipment/list', label: '查找设备', module: 'equipment' },
        { path: '/platform/user/reserve', label: '我的预约', module: 'equipment' },
        { path: '/platform/equipment/reserve', label: '预约管理', module: 'reserve-admin' },
        { path: '/platform/user/borrow', label: '我的借用', module: 'borrow' },
        { path: '/platform/user/return', label: '我的归还', module: 'return' },
        { path: '/platform/equipment/borrow', label: '借用管理', module: 'borrow-admin' },
        { path: '/platform/equipment/return', label: '归还管理', module: 'return-admin' },
        { path: '/platform/user/repair', label: '我的报修', module: 'repair' },
        { path: '/platform/equipment/repair', label: '报修管理', module: 'repair-admin' },
        { path: '/platform/profile/info', label: '个人信息', module: 'profile' },
        { path: '/platform/user/list', label: '用户管理', module: 'user' },
        { path: '/platform/user/register', label: '用户注册', module: 'user' },
        { path: '/platform/warehouse/info', label: '仓库信息', module: 'warehouse' },
        { path: '/platform/warehouse/stock', label: '出入库信息', module: 'warehouse' },
        { path: '/platform/supplier/info', label: '供应商信息', module: 'supplier' },
        { path: '/platform/notice/list', label: '公告列表', module: 'notice' },
        { path: '/platform/system/config', label: '系统配置', module: 'system' }
      ]
      
      const filteredMenuItems = allMenuItems.filter(item => {
        return allowedModules.includes(item.module)
      })
      
      const matchedItem = filteredMenuItems.find(item => 
        item.label.toLowerCase().includes(keyword) || 
        item.path.toLowerCase().includes(keyword)
      )
      
      if (matchedItem) {
        router.push(matchedItem.path)
      } else {
        ElMessage({
          message: '未找到匹配的业务模块',
          type: 'warning',
          duration: 1500
        })
      }
    }

    return {
      searchKeyword,
      searchSuggestions,
      realName,
      username,
      role,
      themeName,
      handleCommand,
      handleThemeCommand,
      handleSearch,
      handleSuggestionClick,
      User,
      Search,
      TurnOff,
      Link,
      Switch,
      ArrowDown,
      Menu,
      House
    }
  }
}
</script>

<style scoped>
.platform-header {
  height: 60px;
  background: var(--header-bg);
  color: var(--header-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px var(--header-shadow);
  z-index: 100;
  border-bottom: 1px solid var(--sidebar-border);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo img {
  width: 32px;
  height: 32px;
}

.header-logo span {
  font-size: 18px;
  font-weight: bold;
}

.header-menu {
  flex: 1;
  margin: 0 20px;
  max-width: 400px;
}

.header-menu :deep(.el-input) {
  --el-input-bg-color: var(--header-bg);
  --el-input-text-color: var(--header-text);
  --el-input-border-color: var(--sidebar-border);
  --el-input-hover-border-color: var(--sidebar-active);
}

.header-menu :deep(.el-input__inner) {
  background: var(--header-bg);
  color: var(--header-text);
  border-color: var(--sidebar-border);
}

.header-menu :deep(.el-input__prefix) {
  color: var(--sidebar-text);
}

.header-menu :deep(.el-input__suffix) {
  color: var(--sidebar-text);
}

.header-menu :deep(.el-input__clear) {
  cursor: pointer;
  color: var(--sidebar-text);
}

.header-menu :deep(.el-input__clear:hover) {
  color: var(--sidebar-active);
}

.search-container {
  position: relative;
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--header-bg);
  border: 1px solid var(--sidebar-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
}

.search-suggestions :deep(.suggestion-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.2s;
  color: var(--sidebar-text);
}

.search-suggestions :deep(.suggestion-item:hover) {
  background: rgba(0, 0, 0, 0.05);
}

.platform-container.dark .search-suggestions :deep(.suggestion-item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

.search-suggestions :deep(.el-icon) {
  color: var(--sidebar-active);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-toggle {
  cursor: pointer;
}

.theme-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s;
  color: var(--header-text);
}

.theme-icon:hover {
  background: rgba(0, 0, 0, 0.05);
}

.platform-container.dark .theme-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s;
  color: var(--header-text);
}

.user-info:hover {
  background: rgba(0, 0, 0, 0.05);
}

.platform-container.dark .user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-info :deep(.el-icon) {
  font-size: 18px;
}


</style>
