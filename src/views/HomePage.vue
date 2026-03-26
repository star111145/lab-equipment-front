<template>
  <div class="platform-home">
    <div class="page-header">
      <h2>首页</h2>
      <p>欢迎使用实验设备管理平台</p>
    </div>
    <div class="content">
      <div class="statistics-cards">
        <el-card v-for="card in statsCards" :key="card.title" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-card-icon" :class="`icon-${card.icon}`">
              <el-icon :size="30"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-card-info">
              <div class="stat-card-value">{{ card.value }}</div>
              <div class="stat-card-label">{{ card.label }}</div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="charts-container">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>设备状态分布</span>
            </div>
          </template>
          <div ref="equipmentStatusChart" class="chart" style="height: 300px;"></div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>设备使用趋势（周）</span>
            </div>
          </template>
          <div ref="usageTrendChart" class="chart" style="height: 300px;"></div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { 
  Box, 
  Monitor, 
  Calendar, 
  Warning,
  Download,
  Setting,
  User,
  Folder
} from '@element-plus/icons-vue'
import service from '@/api/request'

export default {
  name: 'PlatformHome',
  components: {
    Box,
    Monitor,
    Calendar,
    Warning,
    Download,
    Setting,
    User,
    Folder
  },
  setup() {
    const statsCards = ref([
      { title: '设备总数', value: 0, label: '台', icon: 'Monitor' },
      { title: '可用设备', value: 0, label: '台', icon: 'Box' },
      { title: '预约申请', value: 0, label: '条', icon: 'Calendar' },
      { title: '报修处理', value: 0, label: '条', icon: 'Warning' }
    ])

    const equipmentStatusChart = ref(null)
    const usageTrendChart = ref(null)
    let equipmentStatusChartInstance = null
    let usageTrendChartInstance = null

    const loadDashboardData = async () => {
      try {
        const res = await service.get('/dashboard/statistics')
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
      try {
        const res = await service.get('/dashboard/equipment-status')
        if (res.code === 200) {
          renderEquipmentStatusChart(res.data)
        }
      } catch (error) {
        console.error('加载设备状态数据失败:', error)
      }
    }

    const loadUsageTrend = async () => {
      try {
        const res = await service.get('/dashboard/usage-trend?period=week')
        if (res.code === 200) {
          renderUsageTrendChart(res.data)
        }
      } catch (error) {
        console.error('加载使用趋势数据失败:', error)
      }
    }

    const renderEquipmentStatusChart = (data) => {
      if (!equipmentStatusChart.value) return
      
      nextTick(() => {
        if (equipmentStatusChartInstance) {
          equipmentStatusChartInstance.dispose()
        }
        
        equipmentStatusChartInstance = echarts.init(equipmentStatusChart.value)
        
        const option = {
          title: {
            text: '设备状态分布',
            left: 'center',
            top: '5%'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            bottom: '5%',
            left: 'center'
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
      if (!usageTrendChart.value) return
      
      nextTick(() => {
        if (usageTrendChartInstance) {
          usageTrendChartInstance.dispose()
        }
        
        usageTrendChartInstance = echarts.init(usageTrendChart.value)
        
        const dates = data.map(item => item.date)
        const counts = data.map(item => item.count)
        
        const option = {
          title: {
            text: '设备使用趋势',
            left: 'center',
            top: '5%'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['使用次数'],
            bottom: '5%'
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates
          },
          yAxis: {
            type: 'value',
            name: '次数'
          },
          series: [
            {
              name: '使用次数',
              type: 'line',
              smooth: true,
              data: counts,
              itemStyle: {
                color: '#409eff'
              },
              lineStyle: {
                width: 3
              },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                ])
              }
            }
          ]
        }
        
        usageTrendChartInstance.setOption(option)
      })
    }

    const resizeCharts = () => {
      if (equipmentStatusChartInstance) {
        equipmentStatusChartInstance.resize()
      }
      if (usageTrendChartInstance) {
        usageTrendChartInstance.resize()
      }
    }

    onMounted(() => {
      loadDashboardData()
      loadEquipmentStatus()
      loadUsageTrend()
      window.addEventListener('resize', resizeCharts)
    })

    onUnmounted(() => {
      if (equipmentStatusChartInstance) {
        equipmentStatusChartInstance.dispose()
      }
      if (usageTrendChartInstance) {
        usageTrendChartInstance.dispose()
      }
      window.removeEventListener('resize', resizeCharts)
    })

    return {
      statsCards,
      equipmentStatusChart,
      usageTrendChart
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
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 400px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
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
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-card-label {
  font-size: 14px;
  color: #909399;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-card :deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart {
  width: 100%;
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
}
</style>
