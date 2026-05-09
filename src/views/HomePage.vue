<template>
  <div class="platform-home">
    <div class="page-header">
      <h2>首页</h2>
      <p>欢迎使用实验设备管理平台</p>
    </div>
    <div class="content">
      <LatestRecordsTicker :records="latestRecords" />
      
      <div class="dashboard-actions">
        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>系统公告</span>
            </div>
          </template>
          <NoticeDisplay />
        </el-card>

        <el-card class="action-card">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
              <el-select 
                v-if="isAdmin"
                v-model="pendingActionType" 
                placeholder="全部"
                style="width: 120px; margin-left: auto;"
                @change="handlePendingActionTypeChange"
              >
                <el-option label="全部" value="" />
                <el-option label="预约" value="reservation" />
                <el-option label="借用" value="borrow" />
                <el-option label="报修" value="repair" />
                <el-option label="归还" value="return" />
              </el-select>
            </div>
          </template>
          <div class="action-list">
            <div v-for="action in pendingActions" :key="action.id" class="action-item" @click="handleActionClick(action)">
              <div class="action-item-left">
                <el-icon v-if="action.type === 'reservation'" :size="20" color="#409eff">
                  <Calendar />
                </el-icon>
                <el-icon v-else-if="action.type === 'borrow'" :size="20" color="#67c23a">
                  <Monitor />
                </el-icon>
                <el-icon v-else-if="action.type === 'repair'" :size="20" color="#f56c6c">
                  <Warning />
                </el-icon>
                <el-icon v-else-if="action.type === 'return'" :size="20" color="#909399">
                  <Box />
                </el-icon>
                <span class="action-title">{{ action.title }}</span>
              </div>
              <div class="action-item-right">
                <el-tag size="small" type="danger">{{ action.status }}</el-tag>
                <span class="action-time">{{ formatTime(action.createdAt) }}</span>
              </div>
            </div>
            <div v-if="pendingActions.length === 0" class="no-data">
              暂无待办事项
            </div>
          </div>
        </el-card>
      </div>

      <ReservationHotspot :equipment-type-list="equipmentTypeList" />

      <el-card class="calendar-card">
        <template #header>
          <div class="card-header">
            <span>设备预约日历</span>
            <el-select 
              v-model="selectedEquipmentType" 
              placeholder="设备类型"
              style="width: 140px; margin-left: 20px;"
              @change="handleEquipmentTypeChange"
              clearable
            >
              <el-option
                v-for="item in equipmentTypeList"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
            <el-input
              v-model="equipmentSearchText"
              placeholder="搜索设备名称/编号"
              style="width: 180px; margin-left: 10px;"
              @input="handleEquipmentSearchChange"
              clearable
            />
            <el-select 
              v-model="selectedEquipmentId" 
              placeholder="请选择设备" 
              style="width: 200px; margin-left: 10px;"
              @change="handleEquipmentChange"
            >
              <el-option
                v-for="item in filteredEquipmentList"
                :key="item.id"
                :label="item.equipmentName + ' (' + item.equipmentNumber + ')'"
                :value="item.id"
              />
            </el-select>
            <el-button 
              type="primary" 
              size="small" 
              style="margin-left: auto;"
              @click="goToEquipmentPage"
            >
              去预约
            </el-button>
            <el-radio-group 
              v-model="timeSlot" 
              style="margin-left: 15px;"
              size="small"
            >
              <el-radio-button 
                v-for="item in timeSlotOptions" 
                :key="item.value" 
                :value="item.value"
              >{{ item.label }}</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div style="margin-bottom: 15px;">
          <p style="font-size: 12px; cursor: pointer; display: inline-block;" :style="{ fontWeight: pendingSelected ? 'bold' : 'normal', color: pendingSelected ? '#E6A23C' : '#909399' }" @click="filterCalendarByStatus('待审核')">
            <span style="display: inline-block; width: 12px; height: 12px; background: #E6A23C; margin-right: 5px; vertical-align: middle;"></span>待审核
          </p>
          <p style="font-size: 12px; cursor: pointer; display: inline-block; margin-left: 20px;" :style="{ fontWeight: approvedSelected ? 'bold' : 'normal', color: approvedSelected ? '#67C23A' : '#909399' }" @click="filterCalendarByStatus('已通过')">
            <span style="display: inline-block; width: 12px; height: 12px; background: #67C23A; margin-right: 5px; vertical-align: middle;"></span>已通过（可借用）
          </p>
        </div>
        <ReservationCalendar
          v-if="selectedEquipmentId || selectedEquipmentType"
          :key="selectedEquipmentId + '-' + selectedEquipmentType"
          :equipment-id="selectedEquipmentId"
          :equipment-type-id="calendarEquipmentTypeId"
          :time-slot="timeSlot"
          :status-filter="statusFilter"
          @event-click="handleCalendarEventClick"
        />
        <div v-else style="text-align: center; padding: 50px; color: #909399;">
          请先选择设备或设备类型查看预约日历
        </div>
      </el-card>

      <DataStatistics :equipment-type-list="equipmentTypeList" :is-admin="isAdmin" :user-id="userId" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { 
  Box, 
  Monitor, 
  Calendar, 
  Warning
} from '@element-plus/icons-vue'
import service, { getEquipmentList, getEquipmentTypes } from '@/api/request'
import ReservationCalendar from '@/components/ReservationCalendar.vue'
import NoticeDisplay from '@/components/NoticeDisplay.vue'
import LatestRecordsTicker from '@/components/LatestRecordsTicker.vue'
import ReservationHotspot from '@/components/ReservationHotspot.vue'
import DataStatistics from '@/components/DataStatistics.vue'
import { websocketClient } from '@/utils/websocket'

export default {
  name: 'PlatformHome',
  components: {
    Box,
    Monitor,
    Calendar,
    Warning,
    ReservationCalendar,
    NoticeDisplay,
    LatestRecordsTicker,
    ReservationHotspot,
    DataStatistics
  },
  setup() {
    const pendingActions = ref([])
    const latestRecords = ref([])
    const pendingActionType = ref('')
    const isAdmin = ref(false)
    const userId = ref(null)
    
    const selectedEquipmentId = ref(null)
    const equipmentList = ref([])
    const equipmentTypeList = ref([])
    const selectedEquipmentType = ref('')
    const equipmentSearchText = ref('')
    const filteredEquipmentList = ref([])
    const timeSlot = ref('all')
    const pendingSelected = ref(true)
    const approvedSelected = ref(true)
    
    const statusFilter = computed(() => {
      if (!pendingSelected.value && !approvedSelected.value) return 'none'
      if (pendingSelected.value && approvedSelected.value) return ''
      if (pendingSelected.value) return '待审核'
      if (approvedSelected.value) return '已通过'
      return ''
    })
    
    const calendarEquipmentTypeId = computed(() => {
      if (selectedEquipmentId.value) {
        const equipment = equipmentList.value.find(e => e.id === selectedEquipmentId.value)
        return equipment?.equipmentTypeId || null
      }
      if (selectedEquipmentType.value) {
        const equipment = equipmentList.value.find(e => e.equipmentType === selectedEquipmentType.value)
        return equipment?.equipmentTypeId || null
      }
      return null
    })
    
    const timeSlotOptions = [
      { label: '全天', value: 'all' },
      { label: '0-12时', value: 'morning' },
      { label: '12-24时', value: 'afternoon' }
    ]

    const filterCalendarByStatus = (status) => {
      if (status === '待审核') {
        pendingSelected.value = !pendingSelected.value
      } else if (status === '已通过') {
        approvedSelected.value = !approvedSelected.value
      }
    }

    const loadEquipmentTypes = async () => {
      try {
        const res = await getEquipmentTypes()
        if (res.code === 200) {
          equipmentTypeList.value = res.data || []
        }
      } catch (error) {
        console.error('获取设备类型失败:', error)
      }
    }
    
    const filterEquipmentList = () => {
      let list = equipmentList.value
      if (selectedEquipmentType.value) {
        list = list.filter(item => item.equipmentType === selectedEquipmentType.value)
      }
      if (equipmentSearchText.value) {
        const keyword = equipmentSearchText.value.toLowerCase()
        list = list.filter(item => 
          item.equipmentName.toLowerCase().includes(keyword) ||
          item.equipmentNumber.toLowerCase().includes(keyword)
        )
      }
      filteredEquipmentList.value = list
      if (selectedEquipmentId.value && !list.find(e => e.id === selectedEquipmentId.value)) {
        selectedEquipmentId.value = null
      }
    }
    
    const handleEquipmentChange = (value) => {
      if (value) {
        const equipment = equipmentList.value.find(e => e.id === value)
        if (equipment && equipment.equipmentType) {
          selectedEquipmentType.value = equipment.equipmentType
        }
      }
      selectedEquipmentId.value = value
    }
    
    const handleEquipmentTypeChange = (value) => {
      if (value) {
        selectedEquipmentId.value = null
      }
      selectedEquipmentType.value = value
    }
    
    const handleEquipmentSearchChange = () => {
      filterEquipmentList()
    }
    
    const goToEquipmentPage = () => {
      router.push('/platform/equipment/list')
    }
    
    const handleActionClick = (action) => {
      if (isAdmin.value) {
        if (action.type === 'reservation') {
          router.push('/platform/equipment/reserve')
        } else if (action.type === 'borrow') {
          router.push('/platform/equipment/borrow')
        } else if (action.type === 'repair') {
          router.push('/platform/equipment/repair')
        } else if (action.type === 'return') {
          router.push('/platform/equipment/return')
        }
      } else {
        if (action.type === 'reservation') {
          router.push('/platform/user/reserve')
        } else if (action.type === 'borrow') {
          router.push('/platform/user/borrow')
        }
      }
    }
    
    const loadEquipmentList = async () => {
      try {
        const res = await getEquipmentList({ current: 1, size: 100 })
        if (res.data && res.data.records) {
          equipmentList.value = res.data.records || []
          filteredEquipmentList.value = equipmentList.value
        }
        await loadEquipmentTypes()
      } catch (error) {
        console.error('获取设备列表失败:', error)
      }
    }

    const loadPendingActions = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }
      
      const role = localStorage.getItem('role') || ''
      const userId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
      const type = pendingActionType.value || null
      isAdmin.value = role === 'admin'
      
      try {
        const res = await service.get('/dashboard/pending-actions', {
          params: { role, userId, type }
        })
        if (res.code === 200) {
          pendingActions.value = res.data || []
        }
      } catch (error) {
        console.error('加载待办事项失败:', error)
      }
    }

    const handlePendingActionTypeChange = (value) => {
      pendingActionType.value = value
      loadPendingActions()
    }

    const loadLatestRecords = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        return
      }
      
      try {
        const res = await service.get('/dashboard/latest-records')
        if (res.code === 200) {
          latestRecords.value = res.data || []
        }
      } catch (error) {
        console.error('加载最新动态失败:', error)
      }
    }
    
    const handleCalendarEventClick = (eventData) => {
      const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
      const currentRole = localStorage.getItem('role') || ''
      
      // 管理员可以跳转任意记录，用户只能跳转自己的记录
      if (currentRole !== 'admin' && eventData.userId !== currentUserId) {
        ElMessage.warning('您只能查看自己的预约记录')
        return
      }
      
      // 跳转到对应的详情页面，并传递id参数
      if (currentRole === 'admin') {
        router.push({ path: '/platform/equipment/reserve', query: { id: eventData.id } })
      } else {
        router.push({ path: '/platform/user/reserve', query: { id: eventData.id } })
      }
    }

    const formatTime = (time) => {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (days > 0) {
        return `${days}天前`
      } else if (hours > 0) {
        return `${hours}小时前`
      } else if (minutes > 0) {
        return `${minutes}分钟前`
      } else {
        return '刚刚'
      }
    }

    const getStatusType = (status) => {
      switch (status) {
        case '待审核':
          return 'danger'
        case '已同意':
        case '已借出':
        case '已维修':
        case '已归还':
          return 'success'
        case '已拒绝':
        case '已取消':
          return 'info'
        case '报修中':
          return 'warning'
        default:
          return 'info'
      }
    }

    onMounted(() => {
      const role = localStorage.getItem('role') || ''
      const storedUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
      isAdmin.value = role === 'admin'
      userId.value = storedUserId
      
      loadPendingActions()
      loadLatestRecords()
      loadEquipmentList()
      
      websocketClient.on('reservation_refresh', handleWsMessage)
      websocketClient.on('borrow_refresh', handleWsMessage)
      websocketClient.on('repair_refresh', handleWsMessage)
      websocketClient.on('return_refresh', handleWsMessage)
    })

    const handleWsMessage = () => {
      loadPendingActions()
      loadLatestRecords()
    }

    onUnmounted(() => {
      websocketClient.off('reservation_refresh', handleWsMessage)
      websocketClient.off('borrow_refresh', handleWsMessage)
      websocketClient.off('repair_refresh', handleWsMessage)
      websocketClient.off('return_refresh', handleWsMessage)
    })

    return {
      latestRecords,
      pendingActions,
      pendingActionType,
      handlePendingActionTypeChange,
      handleCalendarEventClick,
      isAdmin,
      userId,
      selectedEquipmentId,
      equipmentList,
      equipmentTypeList,
      selectedEquipmentType,
      calendarEquipmentTypeId,
      equipmentSearchText,
      filteredEquipmentList,
      timeSlot,
      timeSlotOptions,
      pendingSelected,
      approvedSelected,
      statusFilter,
      filterCalendarByStatus,
      handleEquipmentChange,
      handleEquipmentTypeChange,
      handleEquipmentSearchChange,
      goToEquipmentPage,
      handleActionClick,
      formatTime,
      getStatusType
    }
  }
}
</script>

<style scoped>
.platform-home {
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
  padding: 0;
  min-height: 400px;
}

.calendar-card {
  margin-bottom: 20px;
}

.calendar-card :deep(.el-card__header) {
  padding: 15px 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
}

.chart {
  width: 100%;
}

.profile-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 20px;
}

.chart {
  width: 100%;
}

.profile-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 20px;
}

.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.action-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.action-list {
  padding: 10px 0;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  margin-bottom: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.action-item:hover {
  background: #ecf5ff;
  transform: translateX(5px);
}

.action-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-title {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.action-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-time {
  font-size: 12px;
  color: #909399;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.filter-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.chart {
  width: 100%;
  min-height: 300px;
  height: 300px;
}

.chart :deep(canvas) {
  max-width: 100%;
  height: auto !important;
}

@media (max-width: 768px) {
  .platform-home {
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
  
  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .dashboard-actions {
    grid-template-columns: 1fr;
  }
}

.hotspot-card {
  margin-bottom: 20px;
}

.hotspot-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.hotspot-chart {
  width: 100%;
  height: 300px;
}

.statistics-card {
  margin-bottom: 20px;
}

.statistics-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.statistics-card .card-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-filter {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.statistics-section {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.statistics-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 3px solid #409eff;
}

.chart-wrapper {
  padding: 10px 0;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card :deep(.el-card__body) {
  padding: 15px;
}

.stat-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.stat-card-icon.icon-Monitor {
  background: linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%);
}

.stat-card-icon.icon-Box {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.stat-card-icon.icon-Calendar {
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
}

.stat-card-icon.icon-Warning {
  background: linear-gradient(135deg, #ef5350 0%, #e53935 100%);
}

.stat-card-info {
  text-align: right;
}

.stat-card-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 3px;
}

.stat-card-label {
  font-size: 13px;
  color: #909399;
}

.statistics-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.statistics-charts .chart-item {
  min-height: 280px;
}

.chart-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 10px;
  text-align: center;
}

.chart {
  width: 100%;
  min-height: 250px;
  height: 250px;
}

.chart :deep(canvas) {
  max-width: 100%;
  height: auto !important;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.filter-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}
</style>
