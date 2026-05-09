<template>
  <div class="mobile-profile-container">
    <div class="header">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h2>个人信息</h2>
    </div>
    
    <div v-loading="loading" class="profile-content">
      <div class="profile-card">
        <div class="avatar-section">
          <el-avatar
            v-if="profileForm.avatar && profileForm.avatar !== '' && profileForm.avatar !== '未设置'"
            :src="profileForm.avatar"
            :size="80"
            shape="square"
            class="user-avatar"
          />
          <el-avatar
            v-else
            :size="80"
            shape="square"
            :src="defaultAvatar"
            class="user-avatar"
          />
          <div class="user-name">{{ profileForm.realName || profileForm.username }}</div>
          <div class="user-role">
            <el-tag type="success" size="small">{{ roleText }}</el-tag>
            <el-tag :type="profileForm.status === 1 ? 'success' : 'danger'" size="small">
              {{ profileForm.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </div>
        </div>
        
        <div class="info-section">
          <div class="info-item">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ profileForm.username }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">学号/工号</span>
            <span class="info-value">{{ profileForm.studentId || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">真实姓名</span>
            <span class="info-value">{{ profileForm.realName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ profileForm.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ profileForm.phone || '未绑定' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">性别</span>
            <span class="info-value">{{ genderText }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ profileForm.registerTime }}</span>
          </div>
        </div>
      </div>
      
      <div class="action-section">
        <el-button type="primary" size="large" class="action-btn" @click="handleEdit">
          <el-icon><Edit /></el-icon>
          编辑信息
        </el-button>
        <el-button size="large" class="action-btn" @click="showPasswordDialog = true">
          <el-icon><Lock /></el-icon>
          修改密码
        </el-button>
      </div>
    </div>
    
    <el-dialog v-model="showEditDialog" title="编辑个人信息" width="90%">
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="90%">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Lock } from '@element-plus/icons-vue'
import service from '@/api/request'

const router = useRouter()
const loading = ref(true)

const profileForm = reactive({
  username: '',
  realName: '',
  email: '',
  phone: '',
  gender: 0,
  avatar: '',
  role: '',
  status: 1,
  registerTime: '',
  studentId: ''
})

const editForm = reactive({
  username: '',
  email: '',
  gender: 0,
  avatar: ''
})

const showEditDialog = ref(false)
const editFormRef = ref(null)

const passwordFormRef = ref(null)
const showPasswordDialog = ref(false)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const editRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ]
}

const defaultAvatar = require('@/assets/default_avatar.png')

const roleText = computed(() => {
  if (profileForm.role === 'admin') return '管理员'
  if (profileForm.role === 'teacher') return '教师'
  return '学生'
})

const genderText = computed(() => {
  if (profileForm.gender === 1) return '男'
  if (profileForm.gender === 2) return '女'
  return '未知'
})

const goBack = () => {
  router.back()
}

const loadProfile = () => {
  loading.value = true
  service.get('/user/profile')
    .then(res => {
      const data = res.data
      profileForm.username = data.username
      profileForm.studentId = data.studentId || ''
      profileForm.realName = data.realName
      profileForm.email = data.email
      profileForm.phone = data.phone || ''
      profileForm.gender = data.gender || 0
      profileForm.avatar = data.avatar || ''
      profileForm.role = data.role
      profileForm.status = data.status
      profileForm.registerTime = data.registerTime ? new Date(data.registerTime).toLocaleString('zh-CN') : ''
      
      editForm.username = data.username
      editForm.email = data.email
      editForm.gender = data.gender || 0
      editForm.avatar = data.avatar || ''
    })
    .catch(err => {
      console.error('获取个人信息失败:', err)
      ElMessage.error('获取个人信息失败')
    })
    .finally(() => {
      loading.value = false
    })
}

const handleEdit = () => {
  showEditDialog.value = true
}

const handleEditSubmit = () => {
  editFormRef.value.validate(valid => {
    if (valid) {
      service.put('/user/profile', {
        username: editForm.username,
        email: editForm.email,
        gender: editForm.gender
      })
        .then(() => {
          profileForm.username = editForm.username
          profileForm.email = editForm.email
          profileForm.gender = editForm.gender
          ElMessage.success('个人信息更新成功')
          showEditDialog.value = false
        })
        .catch(err => {
          console.error('更新失败:', err)
          ElMessage.error(err.response?.data?.message || '更新失败')
        })
    }
  })
}

const handlePasswordSubmit = () => {
  passwordFormRef.value.validate(valid => {
    if (valid) {
      service.put('/user/password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
        .then(() => {
          ElMessage.success('密码修改成功，请重新登录')
          setTimeout(() => {
            localStorage.clear()
            router.push('/mobile/login')
          }, 1500)
        })
        .catch(err => {
          console.error('修改密码失败:', err)
          ElMessage.error(err.response?.data?.message || '修改失败')
        })
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.mobile-profile-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  color: white;
  font-size: 20px;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.profile-content {
  padding: 16px;
}

.profile-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.avatar-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30px;
  text-align: center;
  color: white;
}

.avatar-section .user-avatar {
  border: 4px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  margin-top: 12px;
}

.user-role {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.info-section {
  padding: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.action-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-radius: 12px;
}

@media (min-width: 768px) {
  .mobile-profile-container {
    max-width: 500px;
    margin: 0 auto;
  }
  
  :deep(.el-dialog) {
    max-width: 450px;
  }
}
</style>
