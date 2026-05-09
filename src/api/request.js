import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { clearUserInfo } from '@/utils/auth'

// 创建axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)
    
    // 检查是否是401未授权错误(token过期或无效)
    if (error.response && error.response.status === 401) {
      clearUserInfo()
      
      // 提示用户token已过期
      ElMessage.warning('登录已过期，请重新登录')
      
      // 跳转到登录页
      router.push('/login')
      
      // 返回一个已解决的Promise，避免组件重复处理错误
      return Promise.resolve({ code: 401, msg: '登录已过期' })
    }
    
    return Promise.reject(error)
  }
)

export default service

export const getEquipmentList = (params) => {
  return service.get('/equipment/list', { params })
}

export const getCalendarReservations = (params) => {
  return service.get('/lifecycle/reserve/calendar', { params })
}

export const getEquipmentTypes = () => {
  return service.get('/equipment/types')
}

export const checkReservationConflict = (params) => {
  return service.get('/lifecycle/reserve/check-conflict', { params })
}

export const getSystemConfigs = () => {
  return service.get('/system/config')
}

export const updateSystemConfig = (data) => {
  return service.put('/system/config', data)
}

export const batchUpdateSystemConfigs = (data) => {
  return service.put('/system/config/batch', data)
}