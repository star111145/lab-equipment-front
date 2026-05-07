<template>
  <div class="menu-prompt">
    <div class="prompt-card">
      <el-icon><Menu /></el-icon>
      <h2>请选择功能菜单</h2>
      <p>点击左侧菜单中的选项开始使用</p>
    </div>
  </div>
</template>

<script>
import { Menu } from '@element-plus/icons-vue'

export default {
  name: 'MenuPrompt',
  setup() {
    return {
      Menu
    }
  }
}
</script>

<style scoped>
.menu-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background: var(--sidebar-bg);
}

.prompt-card {
  background: var(--header-bg);
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
  color: var(--header-text);
  max-width: 400px;
  width: 100%;
}

.prompt-card :deep(.el-icon) {
  font-size: 48px;
  color: var(--sidebar-active);
  margin-bottom: 20px;
}

.prompt-card h2 {
  font-size: 24px;
  margin-bottom: 10px;
  color: var(--header-text);
}

.prompt-card p {
  font-size: 14px;
  color: var(--sidebar-text);
  margin-bottom: 0;
}
</style>