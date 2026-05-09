<template>
  <div class="user-repair">
    <div class="page-header">
      <h2>我的报修</h2>
      <p>查看我的设备报修记录</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select
          v-model="searchStatus"
          placeholder="报修状态"
          clearable
          style="width: 150px"
          @change="getList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="报修中" :value="1" />
          <el-option label="已维修" :value="2" />
          <el-option label="已拒绝" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备编号/设备名称"
          clearable
          style="width: 300px; margin-left: 20px;"
          @input="getList"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table
        v-loading="loading"
        :data="repairList"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="设备图片" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.equipmentImage || defaultImage"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
              :preview-src-list="row.equipmentImage ? [row.equipmentImage] : []"
            />
          </template>
        </el-table-column>
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="equipmentModel" label="设备型号" width="120" />
        <el-table-column prop="repairQuantity" label="报修数量" width="100" />
        <el-table-column prop="equipmentTypeName" label="设备类型" width="120" />
        <el-table-column prop="faultDescription" label="故障说明" min-width="180" />
        <el-table-column label="故障图片" width="100" align="center">
           <template #default="{ row }">
             <el-image
               v-if="row.faultImageList && row.faultImageList.length > 0"
               :src="row.faultImageList[0]"
               fit="cover"
               style="width: 60px; height: 60px; border-radius: 4px"
               :preview-src-list="row.faultImageList"
             />
             <span v-else>-</span>
           </template>
         </el-table-column>
        <el-table-column prop="repairTime" label="报修时间" width="160" />
        <el-table-column label="报修状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getRepairStatusType(row.repairStatus)">
              {{ getRepairStatusText(row.repairStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)">
              {{ getAuditStatusText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核人" width="100">
          <template #default="{ row }">
            {{ row.auditUserName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="160">
          <template #default="{ row }">
            {{ row.auditTime ? formatDate(row.auditTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.repairStatus === 0" type="warning" size="small" @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
        style="margin-top: 20px; justify-content: flex-end"
      />

      <el-dialog
        v-model="showViewDialog"
        title="报修详情"
        width="600px"
      >
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ viewForm.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '无' }}</el-descriptions-item>
          <el-descriptions-item label="报修数量">{{ viewForm.repairQuantity || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ viewForm.equipmentTypeName || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="故障说明">{{ viewForm.faultDescription || '无' }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ viewForm.realName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.phone }}</el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ formatDate(viewForm.repairTime) }}</el-descriptions-item>
          <el-descriptions-item label="报修状态">
            <el-tag :type="getRepairStatusType(viewForm.repairStatus)">
              {{ getRepairStatusText(viewForm.repairStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getAuditStatusType(viewForm.auditStatus)">
              {{ getAuditStatusText(viewForm.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人">{{ viewForm.auditUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ viewForm.auditTime ? formatDate(viewForm.auditTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核结果" :span="2">{{ viewForm.auditResult || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="viewForm.faultImageList && viewForm.faultImageList.length > 0" class="image-list">
          <div class="image-item" v-for="(image, index) in viewForm.faultImageList" :key="index">
            <el-image
              :src="image"
              fit="contain"
              style="max-width: 150px; max-height: 150px"
              preview-teleported
            />
          </div>
        </div>
        <template #footer>
          <el-button @click="showViewDialog = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import service from '@/api/request'
import { websocketClient } from '@/utils/websocket'

const defaultImage = require('@/assets/default_equipment.png')
const route = useRoute()

const loading = ref(false)
const repairList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchStatus = ref(null)
const searchKeyword = ref('')

const showViewDialog = ref(false)
const viewForm = ref({})

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/repair/user/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: searchStatus.value,
        keyword: searchKeyword.value
      }
    })
    if (res.code === 200) {
      repairList.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取报修列表失败')
    }
  } catch (err) {
    console.error('获取报修列表失败:', err)
    ElMessage.error('获取报修列表失败')
  } finally {
    loading.value = false
  }
}

const handleView = async (row) => {
  if (row && row.id) {
    const repairId = row.id
    const found = repairList.value.find(item => item.id === repairId)
    if (found) {
      viewForm.value = { ...found }
      showViewDialog.value = true
    } else {
      try {
        const res = await service.get(`/lifecycle/repair/user/${repairId}`)
        if (res.code === 200 && res.data) {
          viewForm.value = res.data
          showViewDialog.value = true
        } else {
          ElMessage.error('获取报修详情失败')
        }
      } catch (err) {
        console.error('获取报修详情失败:', err)
        ElMessage.error('获取报修详情失败')
      }
    }
  } else {
    viewForm.value = { ...row }
    showViewDialog.value = true
  }
}

const handleCancel = (row) => {
  ElMessageBox.confirm('确定要取消这条报修记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await service.put(`/lifecycle/repair/${row.id}/cancel`)
      if (res.code === 200) {
        ElMessage.success('取消成功')
        getList()
      } else {
        ElMessage.error(res.msg || '取消失败')
      }
    } catch (err) {
      console.error('取消失败:', err)
      ElMessage.error('取消失败')
    }
  }).catch(() => {})
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getRepairStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '报修中',
    2: '已维修',
    3: '已拒绝',
    4: '已取消'
  }
  return statusMap[status] || '未知'
}

const getRepairStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'info'
  }
  return typeMap[status] || 'info'
}

const getAuditStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已同意',
    2: '已拒绝'
  }
  return statusMap[status] || '未知'
}

const getAuditStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'info'
}

onMounted(() => {
  getList()
  websocketClient.on('repair_refresh', handleWsMessage)
  
  const repairId = route.query.id
  if (repairId) {
    handleView({ id: repairId })
  }
})

const handleWsMessage = () => {
  getList()
}

onUnmounted(() => {
  websocketClient.off('repair_refresh', handleWsMessage)
})
</script>

<style scoped>
.user-repair {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: var(--text-primary);
}

.page-header p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.content {
  background: var(--main-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--main-border);
}

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.management-bar {
  display: flex;
  align-items: center;
  margin-top: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--main-border);
  gap: 12px;
  flex-wrap: wrap;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.image-item {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
