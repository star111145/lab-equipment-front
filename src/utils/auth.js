// token过期检查
import { ElMessage } from 'element-plus'
import router from '@/router'

const TOKEN_KEY = 'token'
const USER_KEYS = ['role', 'isAdministrator', 'userId', 'username', 'realName', 'phone', 'tokenExpireTime']

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUserInfo(key) {
  return localStorage.getItem(key)
}

export function setUserInfo(data) {
  Object.keys(data).forEach(key => {
    localStorage.setItem(key, data[key])
  })
}

export function clearUserInfo() {
  localStorage.removeItem(TOKEN_KEY)
  USER_KEYS.forEach(key => {
    localStorage.removeItem(key)
  })
}

export function checkTokenExpire() {
  const token = getToken()
  if (!token) {
    return false
  }
  
  const tokenParts = token.split('.')
  if (tokenParts.length !== 3) {
    clearUserInfo()
    ElMessage.warning('登录已过期，请重新登录')
    router.push('/login')
    return false
  }
  
  const tokenExpireTime = localStorage.getItem('tokenExpireTime')
  if (tokenExpireTime && Date.now() > parseInt(tokenExpireTime)) {
    clearUserInfo()
    ElMessage.warning('登录已过期，请重新登录')
    router.push('/login')
    return false
  }
  
  return true
}
