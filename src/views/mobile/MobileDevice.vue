<template>
  <div class="mobile-device-container">
    <div class="header">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h2>设备信息</h2>
      <el-dropdown v-if="isLoggedIn" trigger="click" class="user-dropdown" @command="handleCommand">
        <el-button text class="user-btn">
          <el-icon><User /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>我的信息
            </el-dropdown-item>
            <el-dropdown-item command="records">
              <el-icon><List /></el-icon>操作记录
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <div v-if="loading" class="loading">
      <el-icon class="is-loading" size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <el-icon size="40"><WarningFilled /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="loadEquipment">重试</el-button>
    </div>
    
    <div v-else-if="equipment" class="equipment-info">
      <div class="equipment-card">
        <div class="equipment-image">
          <img :src="equipment.equipmentImage || defaultImage" :alt="equipment.equipmentName" />
        </div>
        <div class="equipment-detail">
          <h3>{{ equipment.equipmentName }}</h3>
          <p class="equipment-number">编号: {{ equipment.equipmentNumber }}</p>
          <p class="equipment-model">型号: {{ equipment.equipmentModel || '-' }}</p>
          <p class="equipment-type">类型: {{ equipment.equipmentType || '-' }}</p>
          <p class="equipment-location">位置: {{ equipment.warehouseName || equipment.equipmentLocation || '-' }}</p>
          <p class="equipment-status">
            状态: 
            <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
          </p>
          <p class="equipment-quantity">
            可用: <span class="available">{{ equipment.availableQuantity || 0 }}</span> 
            / 总数: <span>{{ equipment.stockQuantity || 0 }}</span>
          </p>
        </div>
      </div>
      
      <div class="action-section">
        <h4 class="section-title">设备操作</h4>
        
        <div class="action-buttons">
          <template v-if="!isLoggedIn">
            <div class="login-prompt">
              <p>请先登录后进行操作</p>
              <el-button type="primary" @click="goLogin">去登录</el-button>
            </div>
          </template>
          
          <template v-else>
            <el-button 
              v-if="canReserve" 
              type="primary" 
              size="large" 
              @click="handleReserve"
              class="action-btn reserve-btn"
            >
              <el-icon><Calendar /></el-icon>
              预约设备
            </el-button>
            <el-button 
              v-else-if="isLoggedIn" 
              type="info" 
              size="large" 
              disabled 
              class="action-btn"
            >
              设备已约满
            </el-button>
            
            <el-button 
              v-if="canBorrow" 
              type="success" 
              size="large" 
              @click="handleBorrow"
              class="action-btn borrow-btn"
            >
              <el-icon><ShoppingCart /></el-icon>
              借用设备
            </el-button>
            
            <el-button 
              v-if="canExtend" 
              type="primary" 
              size="large" 
              @click="handleExtend"
              class="action-btn extend-btn"
            >
              <el-icon><Clock /></el-icon>
              延期
            </el-button>
            
            <el-button 
              v-if="canReturnOrRepair" 
              type="warning" 
              size="large" 
              @click="handleReturn"
              class="action-btn return-btn"
            >
              <el-icon><Check /></el-icon>
              归还设备
            </el-button>
            
            <el-button 
              v-if="canReturnOrRepair" 
              type="danger" 
              size="large" 
              @click="handleRepair"
              class="action-btn repair-btn"
            >
              <el-icon><Tools /></el-icon>
              报修设备
            </el-button>
            
            <div v-if="userReserve && Number(userReserve.reserveStatus) === 0" class="status-tip">
              <el-tag type="warning">预约待审核</el-tag>
            </div>
            <div v-if="userReserve && Number(userReserve.reserveStatus) === 1 && !canBorrow && !userBorrow" class="status-tip">
              <el-tag type="info">可借用</el-tag>
            </div>
            <div v-if="userReserve && Number(userReserve.reserveStatus) === 1 && isReserveExpired(userReserve)" class="status-tip">
              <el-tag type="info">预约已过期</el-tag>
            </div>
            <div v-if="userBorrow && Number(userBorrow.borrowStatus) === 0" class="status-tip">
              <el-tag type="warning">借用待审核</el-tag>
            </div>
          </template>
        </div>
      </div>
      
      <div class="user-info" v-if="isLoggedIn">
        <h4 class="section-title">我的操作记录</h4>
        <div class="records-card">
          <div class="record-item" @click="goToRecords('reserve')">
            <el-icon><Calendar /></el-icon>
            <span>我的预约</span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
          <div class="record-item" @click="goToRecords('borrow')">
            <el-icon><ShoppingCart /></el-icon>
            <span>我的借用</span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
          <div class="record-item" @click="goToRecords('return')">
            <el-icon><Check /></el-icon>
            <span>我的归还</span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
          <div class="record-item" @click="goToRecords('repair')">
            <el-icon><Tools /></el-icon>
            <span>我的报修</span>
            <el-icon class="arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
    
    <el-dialog v-model="showReserveDialog" title="预约设备" width="90%">
      <div class="dialog-info">
        <p><strong>设备名称：</strong>{{ equipment?.equipmentName }}</p>
        <p><strong>设备编号：</strong>{{ equipment?.equipmentNumber }}</p>
        <p><strong>可用数量：</strong>{{ equipment?.availableQuantity }}</p>
      </div>
      <el-form :model="reserveForm" label-width="80px">
        <el-form-item label="预约时间">
          <el-date-picker
            v-model="reserveForm.reserveTime"
            type="datetime"
            placeholder="选择预约开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
          />
        </el-form-item>
        <el-form-item label="预约时长">
          <el-input-number v-model="reserveForm.reserveDuration" :min="1" :max="720" />
          <span style="margin-left: 8px">小时</span>
        </el-form-item>
        <el-form-item label="预约用途">
          <el-input v-model="reserveForm.purpose" type="textarea" :rows="3" placeholder="请输入预约用途（限200字）" maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReserveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReserve">提交</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showBorrowDialog" title="借用设备" width="90%">
      <div class="dialog-info">
        <p><strong>设备名称：</strong>{{ equipment?.equipmentName }}</p>
        <p><strong>设备编号：</strong>{{ equipment?.equipmentNumber }}</p>
        <p><strong>可用数量：</strong>{{ equipment?.availableQuantity }}</p>
      </div>
      <el-form :model="borrowForm" label-width="80px">
        <el-form-item label="借用数量">
          <el-input-number v-model="borrowForm.borrowQuantity" :min="1" :max="equipment?.availableQuantity" />
        </el-form-item>
        <el-form-item label="借用用途">
          <el-input v-model="borrowForm.reason" type="textarea" :rows="3" placeholder="请输入借用用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBorrowDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBorrow">确认借用</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showReturnDialog" title="归还设备" width="90%">
      <div class="dialog-info">
        <p><strong>设备名称：</strong>{{ equipment?.equipmentName }}</p>
        <p><strong>设备编号：</strong>{{ equipment?.equipmentNumber }}</p>
        <p><strong>借用数量：</strong>{{ returnForm.borrowQuantity || userBorrow?.borrowQuantity || 1 }} 台</p>
      </div>
      <el-form :model="returnForm" label-width="80px">
        <el-form-item label="归还数量">
          <el-input-number v-model="returnForm.returnQuantity" :min="1" :max="returnForm.maxReturnQuantity" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReturn">确认归还</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showRepairDialog" title="报修设备" width="90%">
      <div class="dialog-info">
        <p><strong>设备名称：</strong>{{ equipment?.equipmentName }}</p>
        <p><strong>设备编号：</strong>{{ equipment?.equipmentNumber }}</p>
        <p><strong>借用数量：</strong>{{ equipment?.borrowQuantity || 1 }}</p>
      </div>
      <el-form :model="repairForm" label-width="80px">
        <el-form-item label="报修数量">
          <el-input-number v-model="repairForm.repairQuantity" :min="1" :max="equipment?.borrowQuantity || 1" />
        </el-form-item>
        <el-form-item label="故障描述">
          <el-input v-model="repairForm.faultDescription" type="textarea" :rows="4" placeholder="请描述设备故障情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRepair">提交报修</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showExtendDialog" title="延期预约" width="90%">
      <div class="dialog-info">
        <p><strong>设备名称：</strong>{{ equipment?.equipmentName }}</p>
        <p><strong>设备编号：</strong>{{ equipment?.equipmentNumber }}</p>
        <p><strong>原预约时长：</strong>{{ userReserve?.reserveDuration || 1 }}小时</p>
      </div>
      <el-form :model="extendForm" label-width="80px">
        <el-form-item label="延期时长">
          <el-input-number v-model="extendForm.extendDuration" :min="1" :max="720" />
          <span style="margin-left: 8px">小时</span>
        </el-form-item>
        <el-form-item label="延期原因">
          <el-input v-model="extendForm.extendReason" type="textarea" :rows="3" placeholder="请输入延期原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExtendDialog = false">取消</el-button>
        <el-button type="primary" @click="submitExtend">确认延期</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, WarningFilled, ArrowLeft, ArrowRight, Calendar, ShoppingCart, Check, Tools, User, List, SwitchButton, Clock } from '@element-plus/icons-vue'
import { websocketClient } from '@/utils/websocket'
import service from '@/api/request'
import defaultImage from '@/assets/default_equipment.png'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const equipment = ref(null)
const isLoggedIn = ref(false)

const userReserve = ref(null)
const userBorrow = ref(null)

const canReserve = computed(() => {
  return equipment.value?.availableQuantity > 0
})

const canBorrow = computed(() => {
  if (!userReserve.value) return false
  if (Number(userReserve.value.reserveStatus) !== 1) return false
  if (userBorrow.value && Number(userBorrow.value.borrowStatus) === 1) return false
  const now = new Date()
  const reserveStartTime = new Date(userReserve.value.reserveTime)
  const reserveEndTime = new Date(userReserve.value.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (userReserve.value.reserveDuration || 0))
  return now >= reserveStartTime && now <= reserveEndTime
})

const canReturnOrRepair = computed(() => {
  return userBorrow.value && Number(userBorrow.value.borrowStatus) === 1
})

const isReserveExpired = (reserve) => {
  if (!reserve || !reserve.reserveTime) return false
  const now = new Date()
  const reserveEndTime = new Date(reserve.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (reserve.reserveDuration || 0))
  return now > reserveEndTime
}

const canExtend = computed(() => {
  if (!userReserve.value) return false
  if (Number(userReserve.value.reserveStatus) !== 1) return false
  if (userReserve.value.isExtension === 1) return false
  const now = new Date()
  const reserveEndTime = new Date(userReserve.value.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (userReserve.value.reserveDuration || 0))
  return now <= reserveEndTime
})

const showReserveDialog = ref(false)
const showBorrowDialog = ref(false)
const showReturnDialog = ref(false)
const showRepairDialog = ref(false)
const showExtendDialog = ref(false)

const extendForm = ref({
  extendDuration: 1,
  extendReason: ''
})

const reserveForm = ref({
  reserveTime: '',
  reserveDuration: 1,
  purpose: ''
})

const borrowForm = ref({
  borrowQuantity: 1,
  reason: '',
  expectReturnTime: ''
})

const returnForm = ref({
  returnQuantity: 1,
  borrowQuantity: 1,
  maxReturnQuantity: 1
})

const repairForm = ref({
  repairQuantity: 1,
  faultDescription: ''
})

const goBack = () => {
  router.back()
}

const disabledDate = (time) => {
  const now = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  return time.getTime() < now.getTime() - 86400000 || time.getTime() > thirtyDaysLater.getTime()
}

const goLogin = () => {
  router.push('/mobile/login?redirect=' + encodeURIComponent(route.fullPath))
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.clear()
    ElMessage.success('已退出登录')
    router.push('/mobile/login?redirect=' + encodeURIComponent(route.fullPath))
  } else if (command === 'profile') {
    router.push('/mobile/profile')
  } else if (command === 'records') {
    viewRecords()
  }
}

const viewRecords = () => {
  router.push('/mobile/records')
}

const goToRecords = (type) => {
  router.push('/mobile/records?type=' + type)
}

const statusType = computed(() => {
  const status = equipment.value?.equipmentStatus
  const stock = equipment.value?.stockQuantity
  const available = equipment.value?.availableQuantity
  
  if (status === 4 || status === 0) return 'danger'
  if (!stock || stock === 0) return 'info'
  if (available === 0) return 'warning'
  return 'success'
})

const statusText = computed(() => {
  const status = equipment.value?.equipmentStatus
  const stock = equipment.value?.stockQuantity
  const available = equipment.value?.availableQuantity
  
  if (status === 4 || status === 0) return '故障'
  if (!stock || stock === 0) return '无库存'
  if (available === 0) return '已满'
  return '空闲'
})

const loadEquipment = async () => {
  const equipmentNumber = route.query.equipmentNumber
  if (!equipmentNumber) {
    error.value = '缺少设备编号参数'
    loading.value = false
    return
  }
  
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
  
  loading.value = true
  error.value = ''
  
  try {
    const res = await service.get(`/equipment/number/${equipmentNumber}`)
    if (res.code === 200 && res.data) {
      equipment.value = res.data
      
      if (token && equipment.value?.id) {
        await loadUserOperations(equipment.value.id)
      }
    } else {
      error.value = '设备不存在'
    }
  } catch (err) {
    console.error('加载设备信息失败:', err)
    const errMsg = err.response?.data?.message || err.message || '加载设备信息失败'
    error.value = `加载设备信息失败: ${errMsg}`
  } finally {
    loading.value = false
  }
}

const loadUserOperations = async (equipmentId) => {
  try {
    const reserveRes = await service.get('/lifecycle/reserve/user/list', {
      params: { current: 1, size: 50, status: -1 }
    })
    if (reserveRes.code === 200 && reserveRes.data?.records) {
      const reserve = reserveRes.data.records.find(r => String(r.equipmentId) === String(equipmentId))
      if (reserve) {
        userReserve.value = reserve
      }
    }
    
    const borrowRes = await service.get('/lifecycle/borrow/user/list', {
      params: { current: 1, size: 50, status: -1 }
    })
    if (borrowRes.code === 200 && borrowRes.data?.records) {
      const borrow = borrowRes.data.records.find(b => String(b.equipmentId) === String(equipmentId) && b.borrowStatus !== 3 && b.borrowStatus !== 4)
      if (borrow) {
        userBorrow.value = borrow
      }
    }
  } catch (err) {
    console.error('加载用户操作记录失败:', err)
  }
}

const handleReserve = () => {
  showReserveDialog.value = true
}

const submitReserve = async () => {
  if (userReserve.value && (Number(userReserve.value.reserveStatus) === 0 || Number(userReserve.value.reserveStatus) === 1)) {
    ElMessage.warning('您已存在该设备的有效预约，请勿重复预约')
    return
  }
  if (!reserveForm.value.reserveTime) {
    ElMessage.warning('请选择预约开始时间')
    return
  }
  const reserveTimeDate = new Date(reserveForm.value.reserveTime)
  const now = new Date()
  if (reserveTimeDate <= now) {
    ElMessage.warning('预约时间必须是未来时间')
    return
  }
  if (!reserveForm.value.reserveDuration || reserveForm.value.reserveDuration < 1) {
    ElMessage.warning('请输入有效的预约时长（至少1小时）')
    return
  }
  if (!reserveForm.value.purpose) {
    ElMessage.warning('请输入预约用途')
    return
  }
  
  try {
    const checkRes = await service.get('/lifecycle/reserve/check-conflict', {
      params: {
        equipmentId: equipment.value.id,
        reserveTime: reserveForm.value.reserveTime,
        reserveDuration: reserveForm.value.reserveDuration
      }
    })
    if (checkRes.code === 200 && checkRes.data) {
      ElMessage.warning('该时段设备已被预约，请选择其他时间')
      return
    }
    
    const res = await service.post('/lifecycle/reserve', {
      equipmentId: equipment.value.id,
      equipmentTypeId: equipment.value.equipmentTypeId,
      equipmentNumber: equipment.value.equipmentNumber,
      equipmentName: equipment.value.equipmentName,
      reserveTime: reserveForm.value.reserveTime,
      reserveDuration: reserveForm.value.reserveDuration,
      realName: localStorage.getItem('realName') || '',
      phone: localStorage.getItem('phone') || '',
      purpose: reserveForm.value.purpose
    })
    if (res.code === 200) {
      ElMessage.success('预约申请提交成功')
      showReserveDialog.value = false
      if (equipment.value?.id) {
        loadUserOperations(equipment.value.id)
      }
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const handleBorrow = () => {
  borrowForm.value.borrowQuantity = userReserve.value?.reserveQuantity || 1
  showBorrowDialog.value = true
}

const submitBorrow = async () => {
  try {
    const res = await service.post('/lifecycle/borrow', {
      equipmentId: equipment.value.id,
      equipmentNumber: equipment.value.equipmentNumber,
      equipmentName: equipment.value.equipmentName,
      realName: localStorage.getItem('realName') || '',
      phone: localStorage.getItem('phone') || '',
      borrowQuantity: borrowForm.value.borrowQuantity,
      expectReturnTime: borrowForm.value.expectReturnTime,
      purpose: borrowForm.value.reason
    })
    if (res.code === 200) {
      ElMessage.success('借用申请提交成功')
      showBorrowDialog.value = false
      loadEquipment()
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const handleReturn = () => {
  const borrowQty = userBorrow.value?.borrowQuantity || 1
  returnForm.value.borrowQuantity = borrowQty
  returnForm.value.maxReturnQuantity = borrowQty
  returnForm.value.returnQuantity = borrowQty
  showReturnDialog.value = true
}

const submitReturn = async () => {
  if (!userBorrow.value?.id) {
    ElMessage.warning('没有可归还的借用记录')
    return
  }
  if (returnForm.value.returnQuantity > returnForm.value.maxReturnQuantity) {
    ElMessage.warning('归还数量不能超过可归还数量')
    return
  }
  try {
    const res = await service.put(`/lifecycle/borrow/${userBorrow.value.id}/return`, {
      returnQuantity: returnForm.value.returnQuantity
    })
    if (res.code === 200) {
      ElMessage.success('归还申请提交成功')
      showReturnDialog.value = false
      loadEquipment()
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const handleRepair = () => {
  repairForm.value.repairQuantity = userBorrow.value?.borrowQuantity || 1
  repairForm.value.faultDescription = ''
  showRepairDialog.value = true
}

const submitRepair = async () => {
  if (!repairForm.value.repairQuantity || repairForm.value.repairQuantity < 1) {
    ElMessage.warning('请输入有效的报修数量')
    return
  }
  if (!repairForm.value.faultDescription) {
    ElMessage.warning('请填写故障描述')
    return
  }
  
  try {
    const res = await service.post('/lifecycle/repair', {
      equipmentId: equipment.value.id,
      equipmentNumber: equipment.value.equipmentNumber,
      equipmentName: equipment.value.equipmentName,
      realName: localStorage.getItem('realName') || '',
      phone: localStorage.getItem('phone') || '',
      repairQuantity: repairForm.value.repairQuantity,
      faultDescription: repairForm.value.faultDescription,
      faultImageList: []
    })
    if (res.code === 200) {
      ElMessage.success('报修申请提交成功')
      showRepairDialog.value = false
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

const handleExtend = () => {
  extendForm.value.extendDuration = 1
  extendForm.value.extendReason = ''
  showExtendDialog.value = true
}

const submitExtend = async () => {
  if (!userReserve.value?.id) {
    ElMessage.warning('没有可延期的预约')
    return
  }
  if (!extendForm.value.extendDuration || extendForm.value.extendDuration < 1) {
    ElMessage.warning('请输入有效的延期时长')
    return
  }
  if (!extendForm.value.extendReason || !extendForm.value.extendReason.trim()) {
    ElMessage.warning('请输入延期原因')
    return
  }
  
  try {
    const res = await service.post('/lifecycle/reserve/extend', {
      id: userReserve.value.id,
      extendDuration: extendForm.value.extendDuration,
      extendReason: extendForm.value.extendReason
    })
    if (res.code === 200) {
      ElMessage.success('延期申请提交成功')
      showExtendDialog.value = false
      if (equipment.value?.id) {
        loadUserOperations(equipment.value.id)
      }
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

onMounted(() => {
  loadEquipment()
  websocketClient.on('reservation_refresh', handleWsMessage)
  websocketClient.on('borrow_refresh', handleWsMessage)
  websocketClient.on('return_refresh', handleWsMessage)
  websocketClient.on('repair_refresh', handleWsMessage)
})

const handleWsMessage = (data) => {
  loadEquipment()
  if (data && data.message) {
    ElMessage.info(data.message)
  }
}

onUnmounted(() => {
  websocketClient.off('reservation_refresh', handleWsMessage)
  websocketClient.off('borrow_refresh', handleWsMessage)
  websocketClient.off('return_refresh', handleWsMessage)
  websocketClient.off('repair_refresh', handleWsMessage)
})
</script>

<style scoped>
.mobile-device-container {
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
  flex: 1;
}

.user-dropdown {
  margin-left: auto;
}

.user-btn {
  color: white;
  font-size: 20px;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
}

.loading .el-icon {
  margin-bottom: 10px;
  color: #667eea;
}

.error .el-icon {
  color: #f56c6c;
  margin-bottom: 10px;
}

.equipment-info {
  padding: 16px;
}

.equipment-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.equipment-image {
  width: 100%;
  height: 220px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.equipment-image img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.equipment-detail {
  padding: 20px;
}

.equipment-detail h3 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.equipment-detail p {
  margin: 10px 0;
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: space-between;
}

.equipment-detail p .available {
  color: #67c23a;
  font-weight: 600;
}

.equipment-detail p span {
  color: #303133;
  font-weight: 500;
}

.action-section {
  margin-top: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-tip {
  text-align: center;
  margin-top: 12px;
}

.reserve-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.borrow-btn {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  border: none;
}

.return-btn {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  border: none;
}

.repair-btn {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  border: none;
}

.login-prompt {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
}

.login-prompt p {
  margin-bottom: 12px;
  color: #909399;
}

.user-info {
  margin-top: 20px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.records-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.record-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.record-item:last-child {
  border-bottom: none;
}

.record-item:hover {
  background: #f5f7fa;
}

.record-item .el-icon:first-child {
  font-size: 20px;
  color: #667eea;
  margin-right: 12px;
}

.record-item span {
  flex: 1;
  font-size: 15px;
  color: #303133;
}

.record-item .arrow {
  color: #c0c4cc;
  font-size: 16px;
}

.record-empty {
  text-align: center;
  padding: 20px 10px;
}

.record-empty .el-icon {
  font-size: 32px;
  color: #909399;
  margin-bottom: 10px;
}

.record-empty p {
  font-size: 13px;
  color: #909399;
  margin-bottom: 15px;
  line-height: 1.5;
}

.info-card p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.dialog-info {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.dialog-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

.dialog-info strong {
  color: #303133;
}

.borrow-info, .return-info {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.borrow-info p, .return-info p {
  margin: 6px 0;
  font-size: 14px;
  color: #606266;
}

@media (min-width: 768px) {
  .mobile-device-container {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .equipment-info {
    padding: 20px;
  }
  
  :deep(.el-dialog) {
    max-width: 450px;
  }
}
</style>
