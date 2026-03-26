<template>
  <div class="system-config">
    <div class="page-header">
      <h2>系统配置</h2>
      <p>配置系统参数</p>
    </div>
    <div class="content">
      <p>系统配置功能开发中...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SystemConfig'
}
</script>

<style scoped>
.system-config {
  padding: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #606266;
  font-size: 14px;
}

.content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 400px;
}

@media (max-width: 768px) {
  .system-config {
    padding: 15px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .page-header p {
    font-size: 13px;
  }
  
  .content {
    padding: 15px;
  }
}
</style>
