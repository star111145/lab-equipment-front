<template>
  <div class="mobile-login-container">
    <div class="login-wrapper">
      <div class="login-header">
      <h1>实验室设备管理系统</h1>
      <p>移动端登录</p>
    </div>
    
    <div class="login-form">
      <div class="form-item">
        <el-input
          v-model="loginForm.identifier"
          placeholder="请输入学号/工号/手机号"
          prefix-icon="User"
          size="large"
          @keyup.enter="handleLogin"
        />
      </div>
      
      <div class="form-item">
        <el-input
          v-model="loginForm.password"
          :type="passwordVisible ? 'text' : 'password'"
          placeholder="请输入密码"
          prefix-icon="Lock"
          size="large"
          show-password
          @keyup.enter="handleLogin"
        />
      </div>
      
      <div class="form-item">
        <div class="captcha-wrapper">
          <el-input
            v-model="loginForm.captcha"
            placeholder="请输入验证码"
            size="large"
            @keyup.enter="handleLogin"
          />
          <div class="captcha-img" @click="generateCaptcha">
            <span v-for="(char, index) in captchaText" :key="index" :style="{ color: getRandomColor() }">
              {{ char }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="form-item">
        <el-radio-group v-model="loginForm.role" class="role-group">
          <el-radio value="user">普通用户</el-radio>
          <el-radio value="admin">管理员</el-radio>
        </el-radio-group>
      </div>
      
      <el-button 
        type="primary" 
        size="large" 
        class="login-btn"
        :loading="loading"
        @click="handleLogin"
      >
        登录
      </el-button>
      
      <div class="back-home">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import service from '@/api/request'
import { setUserInfo } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const passwordVisible = ref(false)
const captchaText = ref('')
const storedCaptcha = ref('')

const darkColors = ['#000000', '#1a237e', '#283593', '#311b92', '#4a148c', '#6a1b9a', '#4e342e', '#1b5e20', '#00695c', '#004d40', '#bf360c', '#3e2723']

const getRandomColor = () => {
  return darkColors[Math.floor(Math.random() * darkColors.length)]
}

const loginForm = reactive({
  identifier: '',
  password: '',
  captcha: '',
  role: 'user'
})

const generateCaptcha = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaText.value = result
  storedCaptcha.value = result
}

const goBack = () => {
  router.back()
}

const handleLogin = () => {
  if (!loginForm.identifier) {
    ElMessage.warning('请输入学号/工号/手机号')
    return
  }
  if (!loginForm.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (!loginForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  
  if (loginForm.captcha.toUpperCase() !== storedCaptcha.value.toUpperCase()) {
    ElMessage.warning('验证码错误，请重新输入')
    generateCaptcha()
    loginForm.captcha = ''
    return
  }
  
  loading.value = true
  
  service.post('/login', loginForm)
    .then(res => {
      if (res.code !== 200) {
        ElMessage.error(res.msg || '登录失败')
        generateCaptcha()
        loginForm.captcha = ''
        loading.value = false
        return
      }
      
      const selectedRole = loginForm.role
      const userRole = res.data.role
      const userIsAdmin = res.data.isAdministrator
      
      if (userIsAdmin && selectedRole === 'user') {
        ElMessage.error('您是管理员，请使用管理员身份登录')
        generateCaptcha()
        loginForm.captcha = ''
        loading.value = false
        return
      }
      
      if (selectedRole === 'admin' && !userIsAdmin) {
        ElMessage.error('您不是管理员，无权进入管理员页面')
        generateCaptcha()
        loginForm.captcha = ''
        loading.value = false
        return
      }
      
      const userData = {
        token: res.data.token,
        userId: res.data.userId,
        username: res.data.username,
        realName: res.data.realName,
        phone: res.data.phone,
        role: userRole,
        isAdministrator: userIsAdmin,
        tokenExpireTime: res.data.tokenExpireTime
      }
      setUserInfo(userData)
      
      ElMessage.success('登录成功')
      
      const redirect = route.query.redirect
      if (redirect) {
        router.push(redirect)
      } else {
        router.back()
      }
    })
    .catch(err => {
      console.error('登录失败:', err)
      ElMessage.error('登录失败，请检查用户名和密码')
      generateCaptcha()
      loginForm.captcha = ''
      loading.value = false
    })
}

onMounted(() => {
  generateCaptcha()
})
</script>

<style scoped>
.mobile-login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
}

.login-header p {
  font-size: 14px;
  opacity: 0.9;
}

.login-form {
  background: white;
  border-radius: 16px;
  padding: 30px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.form-item {
  margin-bottom: 20px;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;
}

.captcha-wrapper .el-input {
  flex: 1;
}

.captcha-img {
  width: 100px;
  height: 40px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 4px;
  cursor: pointer;
  user-select: none;
}

.role-group {
  display: flex;
  justify-content: center;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  margin-top: 10px;
}

.back-home {
  text-align: center;
  margin-top: 20px;
}

@media (min-width: 768px) {
  .mobile-login-container {
    max-width: 500px;
    margin: 0 auto;
  }
}
</style>
