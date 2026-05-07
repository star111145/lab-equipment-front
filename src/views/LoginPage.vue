<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <div class="login-left-content">
          <div class="logo-section">
            <div class="logo-icon">
              <img src="@/assets/logo.svg" alt="实验设备管理平台" class="logo-svg" />
            </div>
            <h1 class="platform-name">实验设备管理平台</h1>
            <p class="welcome-text">欢迎登录</p>
          </div>
          <div class="features">
            <div class="feature-item">
              <el-icon :size="20" color="#409eff"><TrendCharts /></el-icon>
              <span>设备管理</span>
            </div>
            <div class="feature-item">
              <el-icon :size="20" color="#67c23a"><ChatLineRound /></el-icon>
              <span>在线预约</span>
            </div>
            <div class="feature-item">
              <el-icon :size="20" color="#e6a23c"><VideoCamera /></el-icon>
              <span>实时监控</span>
            </div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2 class="form-title">用户登录</h2>
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form"
            autocomplete="on"
          >
            <el-form-item prop="identifier">
              <el-input
                v-model="loginForm.identifier"
                type="text"
                autocomplete="on"
                placeholder="请输入学号/工号/手机号"
                @focus="showClearUsername = true"
                @blur="showClearUsername = false"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon class="el-input__icon">
                    <User />
                  </el-icon>
                </template>
                <template #suffix>
                  <el-icon
                    v-if="showClearUsername && loginForm.identifier"
                    class="el-input__icon clear-icon"
                    @click="clearUsername"
                  >
                    <Close />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                :type="passwordVisible ? 'text' : 'password'"
                autocomplete="on"
                placeholder="请输入密码"
                @focus="showClearPassword = true"
                @blur="showClearPassword = false"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <el-icon class="el-input__icon">
                    <Lock />
                  </el-icon>
                </template>
                <template #suffix>
                  <el-icon
                    v-if="showClearPassword && loginForm.password"
                    class="el-input__icon clear-icon"
                    @click="clearPassword"
                  >
                    <Close />
                  </el-icon>
                  <el-icon
                    class="el-input__icon"
                    @click="passwordVisible = !passwordVisible"
                  >
                    <View v-if="passwordVisible" />
                    <Hide v-else />
                  </el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item prop="captcha">
              <div class="captcha-wrapper">
                <el-input
                  v-model="loginForm.captcha"
                  autocomplete="off"
                  placeholder="请输入验证码"
                  @focus="showClearCaptcha = true"
                  @blur="showClearCaptcha = false"
                  @keyup.enter="handleLogin"
                >
                  <template #prefix>
                    <el-icon class="el-input__icon">
                      <Message />
                    </el-icon>
                  </template>
                  <template #suffix>
                    <el-icon
                      v-if="showClearCaptcha && loginForm.captcha"
                      class="el-input__icon clear-icon"
                      @click="clearCaptcha"
                    >
                      <Close />
                    </el-icon>
                  </template>
                </el-input>
                <div class="captcha-img" :style="captchaStyles" @click="generateCaptcha">
                  <span v-for="(char, index) in captchaText" :key="index" :style="{ color: getRandomColor(), marginRight: index < 3 ? '2px' : '0' }">
                    {{ char }}
                  </span>
                  <!-- <el-icon class="refresh-icon" @click.stop="generateCaptcha">
                    <Refresh />
                  </el-icon> -->
                </div>
              </div>
            </el-form-item>
            <el-form-item>
              <el-radio-group v-model="loginForm.role">
                <el-radio value="user">普通用户</el-radio>
                <el-radio value="admin">管理员</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                class="login-button"
                :loading="loading"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, View, Hide, TrendCharts, ChatLineRound, VideoCamera, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import service from '@/api/request'
import { setUserInfo } from '@/utils/auth'

export default {
  name: 'LoginPage',
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const loading = ref(false)
    const passwordVisible = ref(false)
    const captchaText = ref('')
    const storedCaptcha = ref('')
    const darkColors = ['#000000', '#1a237e', '#283593', '#311b92', '#4a148c', '#6a1b9a', '#4e342e', '#1b5e20', '#00695c', '#004d40', '#bf360c', '#3e2723']
    const captchaStyles = computed(() => {
      const randomDark1 = darkColors[Math.floor(Math.random() * darkColors.length)]
      const randomDark2 = darkColors[Math.floor(Math.random() * darkColors.length)]
      const randomDark3 = darkColors[Math.floor(Math.random() * darkColors.length)]
      return {
        '--captcha-bg': '#f5f7fa',
        '--captcha-dot': randomDark1,
        '--captcha-line1': randomDark2,
        '--captcha-line2': randomDark3
      }
    })
    const getRandomColor = () => {
      return darkColors[Math.floor(Math.random() * darkColors.length)]
    }
    const showClearUsername = ref(false)
    const showClearPassword = ref(false)
    const showClearCaptcha = ref(false)
    
    const loginForm = reactive({
      identifier: '',
      password: '',
      captcha: '',
      role: 'user'
    })

    const loginRules = {
      identifier: [
        { required: true, message: '请输入学号/工号/手机号', trigger: 'blur' },
        { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
      ],
      captcha: [
        { required: true, message: '请输入验证码', trigger: 'blur' }
      ]
    }

    const generateCaptcha = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      captchaText.value = result
      storedCaptcha.value = result
    }

    const getCaptchaColor = () => {
      return getRandomColor()
    }

    const clearUsername = () => {
      loginForm.identifier = ''
    }

    const clearPassword = () => {
      loginForm.password = ''
    }

    const clearCaptcha = () => {
      loginForm.captcha = ''
    }

    const handleLogin = () => {
      loginFormRef.value.validate(valid => {
        if (valid) {
          if (loginForm.captcha.toUpperCase() !== storedCaptcha.value.toUpperCase()) {
            ElMessage({
              message: '验证码错误，请重新输入',
              type: 'warning',
              duration: 1500
            })
            generateCaptcha()
            loginForm.captcha = ''
            return
          }
          loading.value = true
          service
            .post('/login', loginForm)
            .then(res => {
        
              // 检查响应状态码
              if (res.code !== 200) {
                ElMessage({
                  message: res.msg || '登录失败',
                  type: 'error',
                  duration: 2000
                })
                generateCaptcha()
                loginForm.captcha = ''
                loading.value = false
                return
              }
              
              const selectedRole = loginForm.role
              const userRole = res.data.role
              const userIsAdmin = res.data.isAdministrator
              
              // 检查角色匹配
              if (userIsAdmin && selectedRole === 'user') {
                ElMessage({
                  message: '您是管理员，请使用管理员身份登录',
                  type: 'error',
                  duration: 2000
                })
                generateCaptcha()
                loginForm.captcha = ''
                loading.value = false
                return
              }
              
              if (selectedRole === 'admin' && !userIsAdmin) {
                ElMessage({
                  message: '您不是管理员，无权进入管理员页面',
                  type: 'error',
                  duration: 2000
                })
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
              
              ElMessage({
                message: '登录成功！',
                type: 'success',
                duration: 1500
              })
              
              if (userIsAdmin) {
                ElMessage({
                  message: '欢迎进入管理员专属页面',
                  type: 'success',
                  duration: 2000
                })
              }
              
              router.push('/platform/home')
            })
            .catch(err => {
              console.error('登录失败详情:', err)
              console.error('err.response:', err.response)
              console.error('err.request:', err.request)
              console.error('err.message:', err.message)
              let errorMessage = '登录失败，请检查用户名和密码'
              
              if (err.response) {
                console.log('有响应，状态码:', err.response.status)
                if (err.response.data && typeof err.response.data === 'object') {
                  errorMessage = err.response.data.msg || err.response.data.message || errorMessage
                } else if (err.response.data && err.response.data.includes('ECONNREFUSED')) {
                  errorMessage = '服务器无响应，请检查后端服务是否正常运行'
                } else if (err.response.status === 500) {
                  errorMessage = '服务器错误，请检查后端服务是否正常运行'
                } else if (err.response.status === 404) {
                  errorMessage = '请求的资源不存在，请检查后端服务是否正常运行'
                } else if (err.response.status >= 500) {
                  errorMessage = '服务器错误，请检查后端服务是否正常运行'
                }
              } else if (err.request) {
                console.log('有请求但无响应')
                errorMessage = '服务器无响应，请检查后端服务是否正常运行'
              } else if (err.message) {
                console.log('其他错误:', err.message)
                if (err.message.includes('Network Error') || err.message.includes('timeout')) {
                  errorMessage = '服务器无响应，请检查后端服务是否正常运行'
                } else {
                  errorMessage = err.message
                }
              }
              
              ElMessage({
                message: errorMessage,
                type: 'error',
                duration: 2000
              })
              generateCaptcha()
              loginForm.captcha = ''
              loading.value = false
            })
        }
      })
    }

    onMounted(() => {
      generateCaptcha()
    })

    return {
      loginFormRef,
      loading,
      passwordVisible,
      captchaText,
      storedCaptcha,
      showClearUsername,
      showClearPassword,
      showClearCaptcha,
      captchaStyles,
      getRandomColor,
      getCaptchaColor,
      loginForm,
      loginRules,
      generateCaptcha,
      clearUsername,
      clearPassword,
      clearCaptcha,
      handleLogin,
      User,
      Lock,
      View,
      Hide,
      TrendCharts,
      ChatLineRound,
      VideoCamera,
      Close
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.login-box {
  display: flex;
  width: 900px;
  height: 550px;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.login-left {
  flex: 0 0 350px;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-left-content {
  text-align: center;
  color: #fff;
}

.logo-section {
  margin-bottom: 50px;
}

.logo-icon {
  display: inline-block;
  margin-bottom: 20px;
}

.logo-svg {
  width: 80px;
  height: 80px;
  fill: #fff;
  stroke: #fff;
}

.platform-name {
  margin: 0 0 10px 0;
  font-size: 22px;
  font-weight: 600;
}

.welcome-text {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  opacity: 0.9;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #fff;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-title {
  margin: 0 0 30px 0;
  font-size: 24px;
  color: #333;
  text-align: center;
}

.login-form {
  margin-bottom: 20px;
}

.captcha-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}

.captcha-img {
  flex: 0 0 100px;
  height: 40px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 20px;
  letter-spacing: 2px;
  user-select: none;
  transition: transform 0.2s;
  position: relative;
  overflow: hidden;
}

.captcha-img span {
  position: relative;
  z-index: 2;
  font-family: 'Arial', sans-serif;
}

.captcha-img::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(var(--captcha-dot, #546e7a) 1px, transparent 1px),
    radial-gradient(var(--captcha-dot, #546e7a) 1px, transparent 1px);
  background-size: 6px 5px;
  background-position: 0 0, 3px 3px;
  opacity: 0.8;
  pointer-events: none;
}

.captcha-img::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(45deg, transparent 49%, var(--captcha-line1, #546e7a) 49%, var(--captcha-line1, #546e7a) 51%, transparent 51%),
    linear-gradient(-45deg, transparent 49%, var(--captcha-line2, #546e7a) 49%, var(--captcha-line2, #546e7a) 51%, transparent 51%),
    linear-gradient(135deg, transparent 49%, var(--captcha-line3, #546e7a) 49%, var(--captcha-line3, #546e7a) 51%, transparent 51%);
  background-size: 10px 10px;
  opacity: 0.6;
  pointer-events: none;
}

.captcha-img:hover {
  transform: scale(1.05);
}

.refresh-icon {
  position: absolute;
  right: 10px;
  font-size: 14px;
  cursor: pointer;
  opacity: 0.6;
  z-index: 3;
}

.refresh-icon:hover {
  opacity: 1;
}

.clear-icon {
  cursor: pointer;
  color: #909399;
  transition: color 0.3s;
}

.clear-icon:hover {
  color: #c0c4cc;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
  border: none;
}

.login-button:hover {
  opacity: 0.9;
}

:deep(.el-input__suffix) {
  cursor: pointer;
}

:deep(.el-input__suffix-inner .clear-icon) {
  cursor: pointer;
}

@media screen and (max-width: 768px) {
  .login-box {
    flex-direction: column;
    width: 90%;
    height: auto;
  }

  .login-left {
    flex: none;
    height: 200px;
    padding: 20px;
  }

  .login-left-content {
    padding: 0 20px;
  }

  .features {
    display: none;
  }

  .login-right {
    padding: 30px 20px;
  }
  
  .form-title {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .login-form-wrapper {
    max-width: 100%;
  }
}
</style>
