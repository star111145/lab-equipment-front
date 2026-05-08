<template>
  <el-card class="hotspot-card">
    <template #header>
      <div class="card-header">
        <span>预约热度排行</span>
        <div class="header-filter">
          <el-select 
            v-model="equipmentType" 
            placeholder="设备类型"
            style="width: 140px;"
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
        </div>
      </div>
    </template>
    <div ref="chartRef" class="hotspot-chart"></div>
  </el-card>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { websocketClient } from '@/utils/websocket'
import * as echarts from 'echarts'
import router from '@/router'
import service from '@/api/request'

export default {
  name: 'ReservationHotspot',
  props: {
    equipmentTypeList: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    const chartRef = ref(null)
    const equipmentType = ref('')
    const searchText = ref('')
    const selectedEquipmentId = ref('')
    const filteredEquipmentList = ref([])
    
    let chartInstance = null

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

    const loadData = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      
      try {
        const params = { limit: 20 }
        if (equipmentType.value) {
          params.equipmentType = equipmentType.value
        }
        if (selectedEquipmentId.value) {
          params.equipmentId = selectedEquipmentId.value
        }
        const res = await service.get('/dashboard/reservation-hotspots', { params })
        if (res.code === 200) {
          renderChart(res.data)
        }
      } catch (error) {
        console.error('加载预约热度数据失败:', error)
      }
    }

    const renderChart = (data) => {
      if (!chartRef.value) return
      
      nextTick(() => {
        if (chartInstance) {
          chartInstance.dispose()
        }
        
        chartInstance = echarts.init(chartRef.value)
        
        const reversedData = [...data].reverse()
        const names = reversedData.map(item => item.equipmentName + ' (' + item.equipmentNumber + ')')
        const counts = reversedData.map(item => item.reservationCount)
        const equipmentIds = reversedData.map(item => item.equipmentId)
        
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: (params) => {
              const dataIndex = params[0].dataIndex
              const item = reversedData[dataIndex]
              return `<div style="font-weight: 500;">
                设备名称：${item.equipmentName}<br/>
                设备编号：${item.equipmentNumber}<br/>
                设备类型：${item.equipmentType || '未分类'}<br/>
                预约次数：${item.reservationCount} 次
              </div>`
            }
          },
          grid: {
            left: '3%',
            right: '15%',
            bottom: '15%',
            top: '10%',
            containLabel: true
          },
          xAxis: {
            type: 'value',
            name: '预约次数'
          },
          yAxis: {
            type: 'category',
            data: names,
            axisLabel: {
              interval: 0,
              fontSize: 11
            }
          },
          series: [
            {
              name: '预约次数',
              type: 'bar',
              data: counts,
              itemStyle: {
                color: '#409eff'
              },
              label: {
                show: true,
                position: 'right'
              }
            }
          ]
        }
        
        chartInstance.setOption(option)
        
        chartInstance.on('click', (params) => {
          const dataIndex = params.dataIndex
          const equipmentId = equipmentIds[dataIndex]
          if (equipmentId) {
            router.push({ 
              path: '/platform/equipment/list', 
              query: { id: equipmentId, action: 'reserve' } 
            })
          }
        })
      })
    }

    const handleEquipmentTypeChange = async () => {
      selectedEquipmentId.value = ''
      await loadEquipmentList()
      loadData()
    }
    
    const handleSearchChange = () => {
      const search = searchText.value.toLowerCase()
      if (!search) {
        loadData()
      } else {
        loadData()
      }
    }
    
    const handleEquipmentChange = () => {
      loadData()
    }

    const handleResize = () => {
      if (chartInstance) {
        chartInstance.resize()
      }
    }

    onMounted(async () => {
      await loadEquipmentList()
      loadData()
      window.addEventListener('resize', handleResize)
      
      websocketClient.on('reservation_refresh', handleWsMessage)
    })

    const handleWsMessage = () => {
      loadData()
    }

    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.dispose()
      }
      window.removeEventListener('resize', handleResize)
      
      websocketClient.off('reservation_refresh', handleWsMessage)
    })

    return {
      chartRef,
      equipmentType,
      searchText,
      selectedEquipmentId,
      filteredEquipmentList,
      handleEquipmentTypeChange,
      handleSearchChange,
      handleEquipmentChange
    }
  }
}
</script>

<style scoped>
.hotspot-card {
  margin-bottom: 20px;
}

.hotspot-card :deep(.el-card__header) {
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

.hotspot-chart {
  width: 100%;
  height: 300px;
}
</style>
