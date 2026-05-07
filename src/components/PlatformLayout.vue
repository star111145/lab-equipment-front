<template>
  <div class="platform-container" :class="currentTheme">
    <PlatformHeader @theme-change="handleThemeCommand" />
    <div class="platform-body" v-if="showSidebar">
      <SidebarMenu v-model:is-collapse="isCollapse" />
      <div class="main-content">
        <router-view />
      </div>
    </div>
    <div class="platform-body" v-else>
      <div class="main-content" style="margin-left: 0;">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PlatformHeader from './PlatformHeader.vue'
import SidebarMenu from './SidebarMenu.vue'
import { applyThemeToRoot, saveTheme, loadTheme } from '@/utils/theme'
import { checkTokenExpire } from '@/utils/auth'

export default {
  name: 'PlatformLayout',
  components: {
      PlatformHeader,
      SidebarMenu
    },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const isCollapse = ref(false)
    const currentTheme = ref('light')
    const showSidebar = ref(false)

    const shouldShowSidebar = computed(() => {
      return !route.path.startsWith('/platform/profile') && 
             !route.path.startsWith('/platform/home') && 
             !(route.path.startsWith('/platform/notice') && !route.path.includes('/list'))
    })

    // 菜单切换逻辑已移至 FloatingOptions 组件

    const handleThemeCommand = (theme) => {
      currentTheme.value = theme
      applyThemeToRoot(theme)
      saveTheme(theme)
    }

    onMounted(() => {
      const token = localStorage.getItem('token')
      if (!token) {
        ElMessage.warning('登录已过期，请重新登录')
        router.push('/login')
        return
      }
      
      checkTokenExpire()
      
      const savedTheme = loadTheme()
      currentTheme.value = savedTheme
      applyThemeToRoot(savedTheme)
      showSidebar.value = shouldShowSidebar.value
      
      // 监听菜单切换事件
      const handleMenuToggle = (e) => {
        showSidebar.value = e.detail
        isCollapse.value = false
      }
      window.addEventListener('menu-toggle', handleMenuToggle)
      
      // 清理事件监听
      return () => {
        window.removeEventListener('menu-toggle', handleMenuToggle)
      }
    })

    watch(route, () => {
      showSidebar.value = shouldShowSidebar.value
    })

    return {
      isCollapse,
      currentTheme,
      showSidebar,
      handleThemeCommand
    }
  }
}
</script>

<style scoped>
.platform-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}

.platform-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px;
  gap: 20px;
  background: var(--body-bg);
}

.main-content {
  flex: 1;
  height: calc(100vh - 100px);
  background: var(--main-bg);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--main-border);
  padding: 20px;
  overflow-y: auto;
}



</style>
