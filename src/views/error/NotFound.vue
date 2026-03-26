<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-title">页面不存在</div>
      <div class="error-message">您访问的页面不存在，请检查 URL 是否正确</div>
      <el-button type="primary" @click="goHome">返回首页</el-button>
      <el-button @click="goBack">返回上一页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/platform/home')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 100px);
  background: var(--main-bg);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  padding: 60px 40px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-code {
  font-size: 80px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 20px;
  line-height: 1;
}

.error-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 32px;
  line-height: 1.6;
}

.not-found-content :deep(.el-button) {
  margin: 0 8px;
}

@media (max-width: 768px) {
  .error-code {
    font-size: 60px;
  }
  
  .error-title {
    font-size: 24px;
  }
  
  .error-message {
    font-size: 14px;
  }
}
</style>
