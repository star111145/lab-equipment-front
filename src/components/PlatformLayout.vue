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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PlatformHeader from './PlatformHeader.vue'
import SidebarMenu from './SidebarMenu.vue'
import { applyThemeToRoot, saveTheme, loadTheme } from '@/utils/theme'

export default {
  name: 'PlatformLayout',
  components: {
    PlatformHeader,
    SidebarMenu
  },
  setup() {
    const route = useRoute()
    const isCollapse = ref(false)
    const currentTheme = ref('light')

    const showSidebar = computed(() => {
      return !route.path.startsWith('/platform/profile')
    })

    const handleThemeCommand = (theme) => {
      currentTheme.value = theme
      applyThemeToRoot(theme)
      saveTheme(theme)
    }

    onMounted(() => {
      const savedTheme = loadTheme()
      currentTheme.value = savedTheme
      applyThemeToRoot(savedTheme)
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
