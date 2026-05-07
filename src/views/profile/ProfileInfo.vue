<template>
  <div class="profile-info">
    <div class="page-header">
      <div class="header-top">
        <el-button type="primary" link @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
      <h2>个人信息</h2>
      <p>查看和管理个人信息</p>
    </div>
    <div class="content">
      <el-card class="profile-card">
        <div class="profile-layout">
        <div class="profile-sidebar">
          <div class="sidebar-avatar">
            <el-avatar
              v-if="profileForm.avatar && profileForm.avatar !== '' && profileForm.avatar !== '未设置'"
              :src="profileForm.avatar"
              size="large"
              shape="square"
              class="user-avatar"
              @error="handleAvatarError"
            />
            <el-avatar
              v-else
              size="large"
              shape="square"
              :src="defaultAvatar"
              class="user-avatar"
            />
          </div>
          <div class="sidebar-info">
            <div class="info-item">
              <span class="info-label">性别：</span>
              <div class="gender-tags">
                <el-tag v-if="profileForm.gender === 0" type="info" size="small" disable-transitions>
                  <el-icon><IceCreamRound /></el-icon>
                  <span>未知</span>
                </el-tag>
                <el-tag v-else-if="profileForm.gender === 1" type="primary" size="small" disable-transitions>
                  <el-icon><Male /></el-icon>
                  <span>男</span>
                </el-tag>
                <el-tag v-else type="danger" size="small" disable-transitions>
                  <el-icon><Female /></el-icon>
                  <span>女</span>
                </el-tag>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">角色：</span>
              <el-tag type="success" size="small">{{ roleText }}</el-tag>
            </div>
            <div class="info-item">
              <span class="info-label">状态：</span>
              <el-tag :type="profileForm.status === 1 ? 'success' : 'danger'" size="small">
                {{ profileForm.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </div>
            <div v-if="isAdministrator" class="info-item">
              <span class="info-label">是否管理员：</span>
              <el-tag type="warning" size="small">
                {{ profileForm.isAdministrator ? '是' : '否' }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="profile-main">
          <div class="info-card">
            <div class="card-section">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">用户名：</span>
                  <span class="info-value">{{ profileForm.username }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">学号/工号：</span>
                  <span class="info-value">{{ profileForm.studentId }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">真实姓名：</span>
                  <span class="info-value">{{ profileForm.realName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">邮箱：</span>
                  <span class="info-value">{{ profileForm.email }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">手机号：</span>
                  <span class="info-value">{{ profileForm.phone || '未绑定' }}</span>
                </div>
  
                <div class="info-item">
                  <span class="info-label">注册时间：</span>
                  <span class="info-value">{{ profileForm.registerTime }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">更新时间：</span>
                  <span class="info-value">{{ profileForm.updateTime }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="action-buttons">
            <el-button type="primary" @click="handleEdit">编辑信息</el-button>
            <el-button link type="primary" @click="showPasswordDialog = true" style="margin-left: 20px;">修改密码</el-button>
          </div>
        </div>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="showEditDialog"
      :title="isAdministrator ? '编辑个人信息' : '编辑我的信息'"
      width="600px"
      :before-close="handleCloseEditDialog"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="用户名" >
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName" v-if="isAdministrator">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="学号/工号" prop="studentId" v-if="isAdministrator">
          <el-input v-model="editForm.studentId" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号" v-if="isAdministrator" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="0">未知</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload-container">
            <div class="avatar-preview-box">
              <el-avatar
                v-if="editForm.avatar && editForm.avatar !== '' && editForm.avatar !== '未设置'"
                :src="editForm.avatar"
                size="large"
                shape="square"
                class="user-avatar"
                @error="handleAvatarError"
              />
              <el-avatar
                v-else
                size="large"
                :src="defaultAvatar"
                shape="square"
                class="user-avatar"
              />
            </div>
            <div class="avatar-actions">
               <div class="upload-hint">
                <el-icon><InfoFilled /></el-icon>
                <span>支持上传 PNG、JPG、JPEG、WEBP 格式图片</span>
              </div>
              <el-upload
                v-model:file-list="avatarFileList"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarFileChange"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                :limit="1"
                class="upload-btn"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>选择图片</el-button>
              </el-upload>
              <el-button
                v-if="editForm.avatar && editForm.avatar !== '' && editForm.avatar !== '未设置'"
                type="danger"
                size="small"
                @click="clearAvatar"
              >
                清除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseEditDialog">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="500px"
      :before-close="handleClosePasswordDialog"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import service from '@/api/request'
import { ArrowLeft, Female, IceCreamRound, Male, Upload } from '@element-plus/icons-vue'

export default {
  name: 'ProfileInfo',
  setup() {
    const router = useRouter()
    const isAdministrator = ref(false)
    const roleText = ref('')

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
      updateTime: '',
      isAdministrator: false
    })

    const editForm = reactive({
      username: '',
      studentId: '',
      realName: '',
      email: '',
      phone: '',
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

    const passwordRules = reactive({
      oldPassword: [
        { required: true, message: '请输入原密码', trigger: 'blur' },
        { min: 8, message: '密码长度至少 8 位', trigger: 'blur' },
        { 
          pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
          message: '密码必须包含字母和数字', 
          trigger: 'blur' 
        }
      ],
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, message: '密码长度至少 8 位', trigger: 'blur' },
        { 
          pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
          message: '密码必须包含字母和数字', 
          trigger: 'blur' 
        }
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
    })

    const avatarFileList = ref([])
    const defaultAvatar = require('@/assets/default_avatar.png')
    const editRules = reactive({
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { 
          pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
          message: '请输入有效的邮箱地址', 
          trigger: 'blur' 
        }
      ],
       phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { 
          pattern: /^1[3-9]\d{9}$/,
          message: '请输入有效的手机号', 
          trigger: 'blur' 
        }
      ],
      studentId: [
        { required: true, message: '请输入学号/工号', trigger: 'blur' },
        { 
          pattern: /^\d{8,11}$/,
          message: '学号/工号必须是8-11位数字', 
          trigger: 'blur' 
        }
      ],
    })

    onMounted(() => {
      service
        .get('/user/profile')
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
          profileForm.updateTime = data.updateTime ? new Date(data.updateTime).toLocaleString('zh-CN') : ''
          profileForm.isAdministrator = data.isAdministrator
        
          isAdministrator.value = data.isAdministrator
          
          if (data.role === 'admin') {
            roleText.value = '管理员'
          } else if (data.role === 'teacher') {
            roleText.value = '教师'
          } else {
            roleText.value = '学生'
          }
          
          editForm.username = data.username
          editForm.studentId = data.studentId || ''
          editForm.realName = data.realName
          editForm.email = data.email
          editForm.phone = data.phone || ''
          editForm.gender = data.gender || 0
          editForm.avatar = data.avatar || ''
        })
        .catch(err => {
          console.error('获取个人信息失败:', err)
          console.error('错误响应:', err.response)
          ElMessage({
            message: '获取个人信息失败',
            type: 'error',
            duration: 1500
          })
        })
    })

    const handleEdit = () => {
      showEditDialog.value = true
    }

    const handleEditSubmit = () => {
      editFormRef.value.validate(valid => {
        if (valid) {
          const updateData = {
            username: editForm.username,
            studentId: editForm.studentId,
            email: editForm.email,
            avatar: editForm.avatar,
            gender: editForm.gender
          }
          
          const apiUrl = isAdministrator.value ? '/user/admin/profile' : '/user/profile'
          
          if (isAdministrator.value) {
            updateData.realName = editForm.realName
            updateData.phone = editForm.phone
          }
          
          service
            .put(apiUrl, updateData)
            .then(() => {
              profileForm.username = editForm.username
              profileForm.studentId = editForm.studentId
              profileForm.email = editForm.email
              profileForm.avatar = editForm.avatar
              profileForm.gender = editForm.gender
              
              if (isAdministrator.value) {
                profileForm.realName = editForm.realName
                profileForm.phone = editForm.phone
              }
              
              localStorage.setItem('realName', editForm.realName)
              localStorage.setItem('email', editForm.email)
              ElMessage({
                message: '个人信息更新成功',
                type: 'success',
                duration: 1500
              })
              showEditDialog.value = false
            })
            .catch(err => {
              console.error('更新个人信息失败:', err)
              console.error('错误响应:', err.response)
              const errorMsg = err.response?.data?.message || err.response?.data || '更新失败'
              ElMessage({
                message: errorMsg,
                type: 'error',
                duration: 3000
              })
            })
        }
      })
    }

    const handleCloseEditDialog = () => {
      showEditDialog.value = false
      editFormRef.value.resetFields()
    }

    const handleClosePasswordDialog = () => {
      showPasswordDialog.value = false
      passwordFormRef.value.resetFields()
    }

    const handlePasswordSubmit = () => {
      passwordFormRef.value.validate(valid => {
        if (valid) {
          service
            .put('/user/password', {
              oldPassword: passwordForm.oldPassword,
              newPassword: passwordForm.newPassword
            })
            .then(() => {
              ElMessage({
                message: '密码修改成功，请重新登录',
                type: 'success',
                duration: 1500
              })
              setTimeout(() => {
                localStorage.removeItem('token')
                localStorage.removeItem('userId')
                localStorage.removeItem('username')
                localStorage.removeItem('realName')
                localStorage.removeItem('role')
                localStorage.removeItem('email')
                localStorage.removeItem('isAdministrator')
                window.location.href = '/login'
              }, 1500)
            })
            .catch(err => {
              console.error('修改密码失败:', err)
              ElMessage({
                message: err.response?.data?.message || '修改失败',
                type: 'error',
                duration: 1500
              })
            })
        }
      })
    }

    const goBack = () => {
      router.back()
    }

    const handleAvatarError = () => {
      editForm.avatar = ''
    }

    const clearAvatar = () => {
      editForm.avatar = ''
      avatarFileList.value = []
    }

    const handleAvatarFileChange = async (file) => {
      console.log('handleAvatarFileChange 被调用', file)
      if (!file.raw) {
        console.log('file.raw 为空')
        return
      }
      
      const formData = new FormData()
      formData.append('file', file.raw)
      
      try {
        const res = await service.post('/user/upload-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log('上传成功', res)
        console.log('上传成功 - data', res.data)
        editForm.avatar = res.data
        ElMessage.success('头像上传成功')
        avatarFileList.value = []
      } catch (err) {
        console.error('头像上传失败:', err)
        ElMessage.error('头像上传失败')
      }
    }

    return {
      profileForm,
      editRules,
      roleText,
      isAdministrator,
      handleEdit,
      handleEditSubmit,
      showEditDialog,
      editFormRef,
      editForm,
      showPasswordDialog,
      passwordFormRef,
      passwordForm,
      passwordRules,
      handleCloseEditDialog,
      handleClosePasswordDialog,
      handlePasswordSubmit,
      goBack,
      handleAvatarError,
      clearAvatar,
      handleAvatarFileChange,
      avatarFileList,
      ArrowLeft,
      IceCreamRound,
      Male,
      Female,
      Upload,
      defaultAvatar,
    }
  }
}
</script>

<style scoped>
.profile-info {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-header .header-top {
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

.profile-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.profile-layout {
  display: flex;
  gap: 30px;
}

.profile-sidebar {
  flex-shrink: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.sidebar-avatar {
  margin: 30px;
}

.sidebar-avatar .el-avatar {
  width: 70px !important;
  height: 70px !important;
  min-width: 70px !important;
  min-height: 70px !important;
}

.user-avatar {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 1px solid #dcdde6;
}

.sidebar-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #606266;
  font-size: 14px;
}

.info-label {
  font-weight: 500;
  color: #303133;
}

.gender-tags {
  display: flex;
  gap: 10px;
}

.gender-tags .el-tag {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 10px;
}

.gender-tags .el-tag .el-icon {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  margin-inline-end: 2px;
}

.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-section {
  margin-bottom: 30px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
}

.info-label {
  font-weight: 500;
  color: #303133;
  min-width: 80px;
}

.info-value {
  color: #303133;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.upload-btn {
  margin-bottom: 5px;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
  }
  
  .profile-sidebar {
    width: 100%;
  }
  
  .sidebar-avatar {
    margin: 20px;
  }
  
  .sidebar-avatar .el-avatar {
    width: 60px !important;
    height: 60px !important;
    min-width: 60px !important;
    min-height: 60px !important;
  }
  
  .user-avatar {
    width: 60px;
    height: 60px;
  }
  
  .info-label {
    min-width: 60px;
    font-size: 13px;
  }
  
  .info-item {
    gap: 8px;
    font-size: 13px;
  }
}

</style>