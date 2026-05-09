<template>
  <div class="system-config">
    <div class="page-header">
      <h2>系统配置</h2>
      <p>配置系统参数和安全管理策略</p>
    </div>
    
    <div class="content">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="预约规则" name="reservation">
          <div class="config-section">
            <el-form :model="reservationForm" label-width="180px">
              <el-form-item label="最多可预约天数">
                <el-input-number 
                  v-model="reservationForm.maxAdvanceDays" 
                  :min="1" 
                  :max="365"
                  style="width: 200px"
                />
                <span class="form-tip">天</span>
                <div class="form-desc"><el-icon><Warning /></el-icon>用户最多可以提前多少天预约设备</div>
              </el-form-item>
              
              <el-form-item label="单次预约最长时间">
                <el-input-number 
                  v-model="reservationForm.maxDurationHours" 
                  :min="1" 
                  :max="720"
                  style="width: 200px"
                />
                <span class="form-tip">小时</span>
                <div class="form-desc"><el-icon><Warning /></el-icon>单次预约的最长使用时长（最长30天）</div>
              </el-form-item>
              
              <el-form-item label="审核时限">
                <el-switch 
                  v-model="reviewTimeoutUnlimited"
                  active-text="不限制"
                  inactive-text="限制"
                  style="margin-right: 10px"
                  @change="handleReviewTimeoutChange"
                />
                <el-input-number 
                  v-model="reservationForm.reviewTimeoutHours" 
                  :min="1" 
                  :max="168"
                  :disabled="isReviewTimeoutDisabled"
                  style="width: 150px"
                />
                <span class="form-tip">小时</span>
                <div class="form-desc"><el-icon><Warning /></el-icon>{{ reviewTimeoutUnlimited ? '审核时间不受限制' : '管理员需要在多长时间内完成审核' }}</div>
              </el-form-item>
              
              <el-form-item label="启用冲突检测">
                <el-switch 
                  v-model="reservationForm.conflictCheckEnabled"
                  active-text="启用"
                  inactive-text="禁用"
                />
                <div class="form-desc"><el-icon><Warning /></el-icon>启用后，系统会自动检测预约时间冲突</div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="安全管理" name="security">
          <div class="config-section">
            <el-form :model="securityForm" label-width="180px">
              <el-form-item label="密码最小长度">
                <el-input-number 
                  v-model="securityForm.passwordMinLength" 
                  :min="6" 
                  :max="20"
                  style="width: 200px"
                />
                <span class="form-tip">位</span>
                <div class="form-desc"><el-icon><Warning /></el-icon>用户密码的最小字符长度</div>
              </el-form-item>
              
              <el-form-item label="密码需要特殊字符">
                <el-switch 
                  v-model="securityForm.passwordRequireSpecialChar"
                  active-text="启用"
                  inactive-text="禁用"
                />
                <div class="form-desc"><el-icon><Warning /></el-icon>启用后，密码必须包含特殊字符（如!@#$%^&*）</div>
              </el-form-item>
              
              <el-form-item label="登录失败最大次数">
                <el-input-number 
                  v-model="securityForm.loginMaxAttempts" 
                  :min="3" 
                  :max="10"
                  style="width: 200px"
                />
                <span class="form-tip">次</span>
                <div class="form-desc"><el-icon><Warning /></el-icon>连续登录失败超过此次数将锁定账户</div>
              </el-form-item>
              
              <el-form-item label="登录锁定时间">
                <el-input-number 
                  v-model="securityForm.loginLockoutMinutes" 
                  :min="5" 
                  :max="1440"
                  style="width: 200px"
                />
                <span class="form-tip">分钟</span>
                <div class="form-desc"><el-icon><Warning /></el-icon>账户被锁定后，需要等待多长时间自动解锁</div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <div class="action-buttons">
        <el-button type="primary" @click="saveConfigs" :loading="saving">
          保存配置
        </el-button>
        <el-button @click="resetConfigs">
          重置
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { getSystemConfigs, batchUpdateSystemConfigs } from '@/api/request'

export default {
  name: 'SystemConfig',
  setup() {
    const activeTab = ref('reservation')
    const saving = ref(false)
    const loading = ref(false)
    
    const reservationForm = ref({
      maxAdvanceDays: 30,
      maxDurationHours: 720,
      reviewTimeoutHours: 24,
      conflictCheckEnabled: true
    })
    
    const reviewTimeoutUnlimited = ref(false)
    
    const isReviewTimeoutDisabled = computed(() => reviewTimeoutUnlimited.value)
    
    const handleReviewTimeoutChange = (val) => {
      reviewTimeoutUnlimited.value = val
    }
     
     const securityForm = ref({
      passwordMinLength: 8,
      passwordRequireSpecialChar: true,
      loginMaxAttempts: 5,
      loginLockoutMinutes: 30
    })
    
    const loadConfigs = async () => {
      loading.value = true
      try {
        const res = await getSystemConfigs()
        if (res.code === 200 && res.data) {
          if (res.data.reservation) {
            res.data.reservation.forEach(config => {
              switch (config.configKey) {
                case 'reservation.max_advance_days':
                  reservationForm.value.maxAdvanceDays = parseInt(config.configValue)
                  break
                case 'reservation.max_duration_hours':
                  reservationForm.value.maxDurationHours = parseInt(config.configValue)
                  break
                case 'reservation.review_timeout_hours': {
                  const timeoutVal = parseInt(config.configValue)
                  reservationForm.value.reviewTimeoutHours = timeoutVal <= 0 ? 24 : timeoutVal
                  reviewTimeoutUnlimited.value = timeoutVal <= 0
                  break
                }
                case 'reservation.conflict_check_enabled':
                  reservationForm.value.conflictCheckEnabled = config.configValue === 'true'
                  break
              }
            })
          }
          
          if (res.data.security) {
            res.data.security.forEach(config => {
              switch (config.configKey) {
                case 'security.password_min_length':
                  securityForm.value.passwordMinLength = parseInt(config.configValue)
                  break
                case 'security.password_require_special_char':
                  securityForm.value.passwordRequireSpecialChar = config.configValue === 'true'
                  break
                case 'security.login_max_attempts':
                  securityForm.value.loginMaxAttempts = parseInt(config.configValue)
                  break
                case 'security.login_lockout_minutes':
                  securityForm.value.loginLockoutMinutes = parseInt(config.configValue)
                  break
              }
            })
          }
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        ElMessage.error('加载配置失败')
      } finally {
        loading.value = false
      }
    }
    
    const saveConfigs = async () => {
      saving.value = true
      try {
        const configs = []
        
        configs.push(
          { configKey: 'reservation.max_advance_days', configValue: String(reservationForm.value.maxAdvanceDays), category: 'reservation', id: 1 },
          { configKey: 'reservation.max_duration_hours', configValue: String(reservationForm.value.maxDurationHours), category: 'reservation', id: 2 },
          { configKey: 'reservation.review_timeout_hours', configValue: String(reviewTimeoutUnlimited.value ? 0 : reservationForm.value.reviewTimeoutHours), category: 'reservation', id: 3 },
          { configKey: 'reservation.conflict_check_enabled', configValue: String(reservationForm.value.conflictCheckEnabled), category: 'reservation', id: 4 },
          { configKey: 'security.password_min_length', configValue: String(securityForm.value.passwordMinLength), category: 'security', id: 5 },
          { configKey: 'security.password_require_special_char', configValue: String(securityForm.value.passwordRequireSpecialChar), category: 'security', id: 6 },
          { configKey: 'security.login_max_attempts', configValue: String(securityForm.value.loginMaxAttempts), category: 'security', id: 7 },
          { configKey: 'security.login_lockout_minutes', configValue: String(securityForm.value.loginLockoutMinutes), category: 'security', id: 8 }
        )
        
        const res = await batchUpdateSystemConfigs(configs)
        if (res.code === 200) {
          ElMessage.success('配置保存成功')
        } else {
          ElMessage.error(res.message || '保存失败')
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        ElMessage.error('保存配置失败')
      } finally {
        saving.value = false
      }
    }
    
    const resetConfigs = () => {
      reservationForm.value = {
        maxAdvanceDays: 30,
        maxDurationHours: 720,
        reviewTimeoutHours: 24,
        conflictCheckEnabled: true
      }
      securityForm.value = {
        passwordMinLength: 8,
        passwordRequireSpecialChar: true,
        loginMaxAttempts: 5,
        loginLockoutMinutes: 30
      }
      ElMessage.info('已重置为默认值')
    }
    
    onMounted(() => {
      loadConfigs()
    })
    
    return {
      activeTab,
      saving,
      loading,
      reservationForm,
      securityForm,
      reviewTimeoutUnlimited,
      isReviewTimeoutDisabled,
      handleReviewTimeoutChange,
      saveConfigs,
      resetConfigs,
      Warning
    }
  }
}
</script>

<style scoped>
.system-config {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
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
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.config-section {
  max-width: 800px;
  margin: 0 auto;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
}

.form-desc {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.5;
}

.form-desc .el-icon {
  margin-right: 4px;
  margin-left: 8px;
  color: #E6A23C;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}

.action-buttons .el-button {
  min-width: 120px;
}

@media (max-width: 768px) {
  .system-config {
    padding: 15px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .config-section {
    max-width: 100%;
  }
  
  :deep(.el-form-item__label) {
    font-size: 14px;
  }
}
</style>
