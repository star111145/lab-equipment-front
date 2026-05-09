<template>
  <el-card class="statistics-card">
    <template #header>
      <div class="card-header">
        <span>数据统计</span>
        <div class="header-filter">
          <el-select 
            v-model="equipmentType" 
            placeholder="设备类型"
            style="width: 140px;"
            @change="handleFilterChange('equipmentType')"
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
            v-model="searchText"
            placeholder="搜索设备名称/编号"
            style="width: 160px; margin-left: 10px;"
            @input="handleSearchChange"
            clearable
          />
          <el-select 
            v-model="selectedEquipmentId" 
            placeholder="选择设备" 
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
          <el-select 
            v-model="period" 
            placeholder="时间范围" 
            style="width: 130px; margin-left: 10px;"
            @change="handleFilterChange('period')"
          >
            <el-option label="最近一周" value="week" />
            <el-option label="最近一月" value="month" />
            <el-option label="最近一学期" value="semester" />
          </el-select>
          <el-button type="primary" style="margin-left: 10px;" @click="showExportDialog = true">
            导出报表
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="statistics-section">
      <div class="section-title">概览</div>
      <div class="statistics-cards">
        <el-card v-for="card in statsCards" :key="card.title" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-card-icon" :class="`icon-${card.icon}`">
              <el-icon :size="28"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-value">{{ card.value }}</div>
              <div class="stat-card-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="statistics-section">
      <div class="section-title">设备状态分布</div>
      <div class="chart-wrapper">
        <div ref="equipmentStatusChartRef" class="chart"></div>
      </div>
    </div>

    <div class="statistics-section">
      <div class="section-title">设备使用趋势</div>
      <div class="chart-wrapper">
        <div ref="usageTrendChartRef" class="chart"></div>
      </div>
    </div>

    <div class="statistics-section">
      <div class="section-title">报修统计</div>
      <div class="chart-wrapper">
        <div ref="repairStatisticsChartRef" class="chart"></div>
      </div>
    </div>

    <el-dialog
      v-model="showExportDialog"
      title="导出统计报表"
      width="450px"
      :close-on-click-modal="false"
    >
      <div style="padding: 10px 0;">
        <p style="margin-bottom: 20px; color: #666;">选择要导出的报表类型：</p>
        <el-radio-group v-model="exportReportType" style="display: flex; flex-direction: column; gap: 10px;">
          <el-radio value="all">全部报表</el-radio>
          <el-radio value="statistics">概览统计</el-radio>
          <el-radio value="equipment_status">设备状态分布</el-radio>
          <el-radio value="usage_trend">设备使用趋势</el-radio>
          <el-radio value="reservation">预约记录</el-radio>
          <el-radio value="borrow">借用记录</el-radio>
          <el-radio value="return">归还记录</el-radio>
          <el-radio value="repair">报修记录</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确认导出</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { websocketClient } from '@/utils/websocket'
import * as echarts from 'echarts'
import { Box, Monitor, Calendar, Warning } from '@element-plus/icons-vue'
import service from '@/api/request'

export default {
  name: 'DataStatistics',
  props: {
    equipmentTypeList: {
      type: Array,
      default: () => []
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    userId: {
      type: Number,
      default: null
    }
  },
  setup(props) {
    const equipmentType = ref('')
    const period = ref('week')
    const searchText = ref('')
    const selectedEquipmentId = ref('')
    const filteredEquipmentList = ref([])
    
    const showExportDialog = ref(false)
    const exportReportType = ref('all')
    
    const equipmentStatusChartRef = ref(null)
    const usageTrendChartRef = ref(null)
    const repairStatisticsChartRef = ref(null)
    
    let equipmentStatusChartInstance = null
    let usageTrendChartInstance = null
    let repairStatisticsChartInstance = null

    const statsCards = ref([
      { title: 'total', label: '设备总数', value: 0, icon: 'Monitor' },
      { title: 'available', label: '可用设备', value: 0, icon: 'Box' },
      { title: 'reservation', label: '预约申请', value: 0, icon: 'Calendar' },
      { title: 'repair', label: '报修申请', value: 0, icon: 'Warning' }
    ])

    const loadEquipmentList = async () => {
      try {
        const res = await service.get('/equipment/list')
        if (res.code === 200) {
          let list = res.data.records || res.data || []
          if (equipmentType.value) {
            list = list.filter(item => item.equipmentType === equipmentType.value)
          }
          filteredEquipmentList.value = list
        }
      } catch (error) {
        console.error('加载设备列表失败:', error)
      }
    }

    const loadStatistics = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        const params = {}
        if (equipmentType.value) {
          params.equipmentType = equipmentType.value
        }
        if (selectedEquipmentId.value) {
          params.equipmentId = selectedEquipmentId.value
        }
        if (props.userId) {
          params.userId = props.userId
        }
        if (props.isAdmin) {
          params.role = 'admin'
        }
        const res = await service.get('/dashboard/statistics', { params })
        if (res.code === 200) {
          const data = res.data
          statsCards.value[0].value = data.totalEquipment || 0
          statsCards.value[1].value = data.availableEquipment || 0
          statsCards.value[2].value = data.totalReservation || 0
          statsCards.value[3].value = data.totalRepair || 0
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    }

    const loadEquipmentStatus = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        const params = {}
        if (equipmentType.value) {
          params.equipmentType = equipmentType.value
        }
        if (selectedEquipmentId.value) {
          params.equipmentId = selectedEquipmentId.value
        }
        const res = await service.get('/dashboard/equipment-status', { params })
        if (res.code === 200) {
          renderEquipmentStatusChart(res.data)
        }
      } catch (error) {
        console.error('加载设备状态数据失败:', error)
      }
    }

    const loadUsageTrend = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        const params = { period: period.value }
        if (equipmentType.value) {
          params.equipmentType = equipmentType.value
        }
        if (selectedEquipmentId.value) {
          params.equipmentId = selectedEquipmentId.value
        }
        if (props.userId && !selectedEquipmentId.value) {
          params.userId = props.userId
        }
        if (props.isAdmin && !selectedEquipmentId.value) {
          params.role = 'admin'
        }
        const res = await service.get('/dashboard/usage-trend', { params })
        if (res.code === 200) {
          renderUsageTrendChart(res.data)
        }
      } catch (error) {
        console.error('加载使用趋势数据失败:', error)
      }
    }

    const loadRepairStatistics = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        const params = {}
        if (equipmentType.value) {
          params.equipmentType = equipmentType.value
        }
        if (selectedEquipmentId.value) {
          params.equipmentId = selectedEquipmentId.value
        }
        if (props.userId && !selectedEquipmentId.value) {
          params.userId = props.userId
        }
        if (props.isAdmin && !selectedEquipmentId.value) {
          params.role = 'admin'
        }
        const res = await service.get('/dashboard/repair-statistics', { params })
        if (res.code === 200) {
          renderRepairStatisticsChart(res.data)
        }
      } catch (error) {
        console.error('加载报修统计数据失败:', error)
      }
    }

    const renderEquipmentStatusChart = (data) => {
      if (!equipmentStatusChartRef.value) return
      
      nextTick(() => {
        if (equipmentStatusChartInstance) {
          equipmentStatusChartInstance.dispose()
        }
        
        equipmentStatusChartInstance = echarts.init(equipmentStatusChartRef.value)
        
        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center'
          },
          series: [
            {
              name: '设备状态',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: false
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 16,
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: false
              },
              data: data.map(item => ({
                value: item.count,
                name: item.statusText
              }))
            }
          ]
        }
        
        equipmentStatusChartInstance.setOption(option)
      })
    }

    const renderUsageTrendChart = (data) => {
      if (!usageTrendChartRef.value) return
      
      nextTick(() => {
        if (usageTrendChartInstance) {
          usageTrendChartInstance.dispose()
        }
        
        usageTrendChartInstance = echarts.init(usageTrendChartRef.value)
        
        const dates = data.map(item => item.date)
        const reservationCounts = data.map(item => item.reserveCount || 0)
        const borrowCounts = data.map(item => item.borrowCount || 0)
        const returnCounts = data.map(item => item.returnCount || 0)
        const repairCounts = data.map(item => item.repairCount || 0)
        
        const option = {
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            bottom: '5%',
            data: ['预约次数', '借用次数', '归还次数', '报修次数']
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '18%',
            top: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: dates
          },
          yAxis: {
            type: 'value',
            name: '次数',
            minInterval: 1
          },
          series: [
            {
              name: '预约次数',
              type: 'line',
              data: reservationCounts,
              smooth: true,
              itemStyle: {
                color: '#409eff'
              }
            },
            {
              name: '借用次数',
              type: 'line',
              data: borrowCounts,
              smooth: true,
              itemStyle: {
                color: '#67c23a'
              }
            },
            {
              name: '归还次数',
              type: 'line',
              data: returnCounts,
              smooth: true,
              itemStyle: {
                color: '#e6a23c'
              }
            },
            {
              name: '报修次数',
              type: 'line',
              data: repairCounts,
              smooth: true,
              itemStyle: {
                color: '#f56c6c'
              }
            }
          ]
        }
        
        usageTrendChartInstance.setOption(option)
      })
    }

    const handleExport = async () => {
      showExportDialog.value = false
      try {
        const params = new URLSearchParams()
        params.append('reportType', exportReportType.value)
        params.append('period', period.value)
        
        if (equipmentType.value) {
          params.append('equipmentType', equipmentType.value)
        }
        if (selectedEquipmentId.value) {
          params.append('equipmentId', selectedEquipmentId.value.toString())
        }
        if (props.userId) {
          params.append('userId', props.userId.toString())
        }
        if (props.isAdmin) {
          params.append('role', 'admin')
        }
        
        const queryString = params.toString()
        const url = `/api/dashboard/export?${queryString}`
        
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const response = await fetch(url, { headers })
        if (!response.ok) {
          throw new Error('导出失败')
        }
        
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `数据统计报表_${new Date().getTime()}.xlsx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败，请重试')
      }
    }

    const renderRepairStatisticsChart = (data) => {
      if (!repairStatisticsChartRef.value) return
      
      nextTick(() => {
        if (repairStatisticsChartInstance) {
          repairStatisticsChartInstance.dispose()
        }
        
        repairStatisticsChartInstance = echarts.init(repairStatisticsChartRef.value)
        
        const option = {
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            data: ['待审核', '维修中', '已维修', '已拒绝']
          },
          series: [
            {
              name: '报修状态',
              type: 'pie',
              radius: ['40%', '70%'],
              center: ['40%', '50%'],
              avoidLabelOverlap: false,
              label: {
                show: true,
                formatter: '{b}: {c}'
              },
              data: [
                { value: data.pendingRepairs || 0, name: '待审核' },
                { value: data.inProgressRepairs || 0, name: '维修中' },
                { value: data.completedRepairs || 0, name: '已维修' },
                { value: data.rejectedRepairs || 0, name: '已拒绝' }
              ]
            }
          ]
        }
        
        repairStatisticsChartInstance.setOption(option)
      })
    }

    // 使用 Promise.all 并行请求4个接口，提升加载速度
    const handleFilterChange = async (type) => {
      if (type === 'equipmentType') {
        selectedEquipmentId.value = ''
      }
      await loadEquipmentList()
      Promise.all([
        loadStatistics(),
        loadEquipmentStatus(),
        loadUsageTrend(),
        loadRepairStatistics()
      ])
    }
    
    const handleSearchChange = () => {
      handleFilterChange('search')
    }
    
    const handleEquipmentChange = () => {
      handleFilterChange('equipment')
    }

    const handleResize = () => {
      if (equipmentStatusChartInstance) equipmentStatusChartInstance.resize()
      if (usageTrendChartInstance) usageTrendChartInstance.resize()
      if (repairStatisticsChartInstance) repairStatisticsChartInstance.resize()
    }

    onMounted(async () => {
      await loadEquipmentList()
      loadStatistics()
      loadEquipmentStatus()
      loadUsageTrend()
      loadRepairStatistics()
      window.addEventListener('resize', handleResize)
      
      websocketClient.on('reservation_refresh', handleWsMessage)
      websocketClient.on('borrow_refresh', handleWsMessage)
      websocketClient.on('repair_refresh', handleWsMessage)
      websocketClient.on('return_refresh', handleWsMessage)
    })

    const handleWsMessage = () => {
      loadStatistics()
      loadEquipmentStatus()
      loadUsageTrend()
      loadRepairStatistics()
    }

    onUnmounted(() => {
      if (equipmentStatusChartInstance) equipmentStatusChartInstance.dispose()
      if (usageTrendChartInstance) usageTrendChartInstance.dispose()
      if (repairStatisticsChartInstance) repairStatisticsChartInstance.dispose()
      window.removeEventListener('resize', handleResize)
      
      websocketClient.off('reservation_refresh', handleWsMessage)
      websocketClient.off('borrow_refresh', handleWsMessage)
      websocketClient.off('repair_refresh', handleWsMessage)
      websocketClient.off('return_refresh', handleWsMessage)
    })

    return {
      statsCards,
      equipmentType,
      period,
      searchText,
      selectedEquipmentId,
      filteredEquipmentList,
      showExportDialog,
      exportReportType,
      handleExport,
      equipmentStatusChartRef,
      usageTrendChartRef,
      repairStatisticsChartRef,
      handleFilterChange,
      handleSearchChange,
      handleEquipmentChange,
      Box,
      Monitor,
      Calendar,
      Warning
    }
  }
}
</script>

<style scoped>
.statistics-card {
  margin-bottom: 20px;
}

.statistics-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  align-items: center;
  width: 100%;
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

.chart {
  width: 100%;
  min-height: 300px;
  height: 300px;
}

@media (max-width: 768px) {
  .statistics-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .header-filter {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style>
