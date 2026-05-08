<template>
  <div class="equipment-reserve">
    <div class="page-header">
      <h2>预约管理</h2>
      <p>管理所有设备预约记录</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select
          v-model="searchStatus"
          placeholder="预约状态"
          clearable
          style="width: 150px"
          @change="getList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已过期" :value="4" />
          <el-option label="已拒绝" :value="2" />
          <el-option label="已取消" :value="3" />
        </el-select>
        <el-select
          v-model="searchAuditStatus"
          placeholder="审核状态"
          clearable
          style="width: 130px; margin-left: 10px;"
          @change="getList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备编号/设备名称/预约人"
          clearable
          style="width: 350px; margin-left: 20px;"
          @input="getList"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button
          v-if="isAdmin && !showManagement"
          type="primary"
          @click="showManagement = true"
          style="margin-left: auto;"
        >
          管理
        </el-button>
      </div>

      <div v-if="showManagement && isAdmin" class="management-bar">
        <el-button type="success">
          导出Excel
        </el-button>
        <el-button type="primary">
          统计报表
        </el-button>
        <el-button type="success" :disabled="selectedRowIds.size === 0" @click="handleBatchApprove">
          批量通过 ({{ selectedRowIds.size }})
        </el-button>
        <el-button type="danger" :disabled="selectedRowIds.size === 0" @click="handleBatchReject">
          批量拒绝 ({{ selectedRowIds.size }})
        </el-button>
        <el-button type="info" :disabled="selectedRowIds.size === 0">
          批量删除 ({{ selectedRowIds.size }})
        </el-button>
        <el-button type="info" @click="handleSelectAll">全选当前页</el-button>
        <el-button type="info" @click="handleDeselectAll">取消全选</el-button>
        <el-button type="info" @click="showManagement = false">
          返回
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="reserveList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement && isAdmin" type="selection" width="55" align="center" />
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
        <el-table-column prop="equipmentType" label="设备类型" width="120" />
        <el-table-column prop="userName" label="预约人" width="100" />
        <el-table-column prop="userPhone" label="联系电话" width="130" />
        <el-table-column prop="reserveTime" label="预约时间" width="160">
          <template #default="{ row }">
            {{ row.reserveTime ? formatDate(row.reserveTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="reserveDuration" label="预约时长(小时)" width="130" />
        <el-table-column prop="purpose" label="用途" min-width="200" />
        <el-table-column label="预约状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReserveStatusType(row)">
              {{ getReserveStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预约类型" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isExtension === 1" type="warning">延期</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="120">
          <template #default="{ row }">
            <el-tag v-if="isAuditTimeout(row)" type="danger" effect="dark">
              超时未审核
            </el-tag>
            <el-tag v-else :type="getAuditStatusType(row.auditStatus)">
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.reserveStatus === 0"
              type="success"
              size="small"
              @click="handleAudit(row, 1)"
            >同意</el-button>
            <el-button
              v-if="row.reserveStatus === 0"
              type="danger"
              size="small"
              @click="handleAudit(row, 2)"
            >拒绝</el-button>
            <el-button
              v-if="row.reserveStatus === 1"
              type="warning"
              size="small"
              @click="handleAdminCancel(row)"
            >取消</el-button>
            <el-button
              type="info"
              size="small"
              @click="handleView(row)"
            >查看</el-button>
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
        title="预约详情"
        width="600px"
      >
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ viewForm.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '无' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ viewForm.equipmentType || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="预约时间">{{ formatDate(viewForm.reserveTime) }}</el-descriptions-item>
          <el-descriptions-item label="预约时长">{{ viewForm.reserveDuration || 1 }} 小时</el-descriptions-item>
          <el-descriptions-item label="预约状态">
            <el-tag :type="getReserveStatusType(viewForm)">
              {{ getReserveStatusText(viewForm) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用途">{{ viewForm.purpose || '无' }}</el-descriptions-item>
          <el-descriptions-item label="预约人">{{ viewForm.userName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ viewForm.auditUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ viewForm.auditTime ? formatDate(viewForm.auditTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getAuditStatusType(viewForm.auditStatus)">
              {{ getAuditStatusText(viewForm.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核结果" :span="2">{{ viewForm.auditResult || '无' }}</el-descriptions-item>
          <el-descriptions-item label="预约类型">
            <el-tag v-if="viewForm.isExtension === 1" type="warning">延期</el-tag>
            <el-tag v-else type="success">正常</el-tag>
          </el-descriptions-item>
        </el-descriptions>
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

const loading = ref(false)
const reserveList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchStatus = ref(null)
const searchAuditStatus = ref(null)
const searchKeyword = ref('')
const isAdmin = ref(localStorage.getItem('isAdministrator') === 'true')
const route = useRoute()
const showManagement = ref(false)
const selectedRowIds = ref(new Set())

const showViewDialog = ref(false)
const viewForm = ref({})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isReserveExpired = (row) => {
  if (row.reserveStatus !== 1) return false
  const now = new Date()
  const reserveEndTime = new Date(row.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (row.reserveDuration || 0))
  return now > reserveEndTime
}

const getReserveStatusText = (row) => {
  if (isReserveExpired(row)) {
    return '已过期'
  }
  const statusMap = {
    0: '待审核',
    1: '已通过',
    2: '已拒绝',
    3: '已取消'
  }
  return statusMap[row.reserveStatus] || '未知'
}

const getReserveStatusType = (row) => {
  if (isReserveExpired(row)) {
    return 'info'
  }
  if (isAuditTimeout(row)) {
    return 'danger'
  }
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger',
    3: 'info'
  }
  return typeMap[row.reserveStatus] || ''
}

const isAuditTimeout = (row) => {
  if (row.reserveStatus !== 0 || row.auditStatus !== 0) {
    return false
  }
  const createTime = new Date(row.createTime)
  const now = new Date()
  const hoursDiff = (now - createTime) / (1000 * 60 * 60)
  return hoursDiff > 24
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
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'info'
}

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/reserve/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: searchStatus.value,
        auditStatus: searchAuditStatus.value,
        keyword: searchKeyword.value
      }
    })
    if (res.code === 200) {
      reserveList.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取预约列表失败')
    }
  } catch (err) {
    console.error('获取预约列表失败:', err)
    ElMessage.error('获取预约列表失败')
  } finally {
    loading.value = false
  }
}

const handleSelectionChange = (selection) => {
  selectedRowIds.value = new Set(selection.map(item => item.id))
}

const handleSelectAll = () => {
  reserveList.value.forEach(row => {
    selectedRowIds.value.add(row.id)
  })
  ElMessage.success(`已选择 ${selectedRowIds.value.size} 条记录`)
}

const handleDeselectAll = () => {
  selectedRowIds.value.clear()
  ElMessage.success('已取消选择')
}

const handleAudit = async (row, status) => {
  if (status === 1) {
    ElMessageBox.confirm(`确定要通过这条预约记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
          const res = await service.put(`/lifecycle/reserve/${row.id}/audit`, {
            auditStatus: status,
            auditResult: '已通过'
          })
          if (res.code === 200) {
            ElMessage.success(res.data?.message || '通过成功')
            if (res.data?.needRefresh) {
              getList()
            }
          } else {
            ElMessage.error(res.msg || '操作失败')
          }
        } catch (err) {
          console.error('操作失败:', err)
          ElMessage.error('操作失败')
        }
      }).catch(() => {
        ElMessage.info('已取消操作')
      })
   } else {
     ElMessageBox.prompt('请输入拒绝理由：', '拒绝', {
       confirmButtonText: '确定',
       cancelButtonText: '取消',
       type: 'warning',
       inputPattern: /\S+/,
       inputErrorMessage: '拒绝理由不能为空'
     }).then(async ({ value }) => {
       try {
         const res = await service.put(`/lifecycle/reserve/${row.id}/audit`, {
           auditStatus: status,
           auditResult: value
         })
       if (res.code === 200) {
         ElMessage.success(res.data?.message || '拒绝成功')
         if (res.data?.needRefresh) {
           getList()
         }
       } else {
         ElMessage.error(res.msg || '操作失败')
       }
     } catch (err) {
       console.error('操作失败:', err)
       ElMessage.error('操作失败')
     }
   }).catch(() => {
     ElMessage.info('已取消操作')
   })
 }
}

const handleAdminCancel = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消理由：', '取消预约', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      inputPattern: /\S+/,
      inputErrorMessage: '取消理由不能为空'
    })
    const res = await service.put(`/lifecycle/reserve/${row.id}/cancel`, {
      cancelReason: value
    })
    if (res.code === 200) {
      ElMessage.success('取消成功')
      getList()
    } else {
      ElMessage.error(res.msg || '取消失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('取消失败:', err)
      ElMessage.error('取消失败')
    }
  }
}

const handleBatchApprove = async () => {
  const selectedIds = Array.from(selectedRowIds.value)
  if (selectedIds.length === 0) {
    ElMessage.warning('请选择要通过的记录')
    return
  }
  
  try {
    const { value } = await ElMessageBox.prompt('批量通过理由（可选）：', '批量通过', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    const promises = selectedIds.map(id => 
      service.put(`/lifecycle/reserve/${id}/audit`, {
        auditStatus: 1,
        auditResult: value || '批量通过'
      })
    )
    
    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.code === 200).length
    const failCount = results.length - successCount
    
    if (failCount === 0) {
      ElMessage.success(`成功通过 ${successCount} 条记录`)
    } else {
      ElMessage.warning(`通过成功 ${successCount} 条，失败 ${failCount} 条`)
    }
    selectedRowIds.value.clear()
    getList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量通过失败:', err)
      ElMessage.error('批量通过失败')
    }
  }
}

const handleBatchReject = async () => {
  const selectedIds = Array.from(selectedRowIds.value)
  if (selectedIds.length === 0) {
    ElMessage.warning('请选择要拒绝的记录')
    return
  }
  
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝理由：', '批量拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      inputPattern: /\S+/,
      inputErrorMessage: '拒绝理由不能为空'
    })
    
    const promises = selectedIds.map(id => 
      service.put(`/lifecycle/reserve/${id}/audit`, {
        auditStatus: 2,
        auditResult: value
      })
    )
    
    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.code === 200).length
    const failCount = results.length - successCount
    
    if (failCount === 0) {
      ElMessage.success(`成功拒绝 ${successCount} 条记录`)
    } else {
      ElMessage.warning(`拒绝成功 ${successCount} 条，失败 ${failCount} 条`)
    }
    selectedRowIds.value.clear()
    getList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量拒绝失败:', err)
      ElMessage.error('批量拒绝失败')
    }
  }
}

const handleView = async (row) => {
  if (row && row.id) {
    // 根据id查询详情
    try {
      const res = await service.get(`/lifecycle/reserve/${row.id}`)
      if (res.code === 200 && res.data) {
        viewForm.value = res.data
        showViewDialog.value = true
      } else {
        ElMessage.error('获取预约详情失败')
      }
    } catch (err) {
      console.error('获取预约详情失败:', err)
      ElMessage.error('获取预约详情失败')
    }
  } else {
    viewForm.value = { ...row }
    showViewDialog.value = true
  }
}

onMounted(() => {
  getList()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  websocketClient.on('reservation_refresh', handleWsMessage)
  
  // 检查路由参数，如果有id则打开详情
  const reserveId = route.query.id
  if (reserveId) {
    handleView({ id: reserveId })
  }
})

const handleWsMessage = () => {
  getList()
}

const handleVisibilityChange = () => {
  if (!document.hidden) {
    getList()
  }
}

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  websocketClient.off('reservation_refresh', handleWsMessage)
})
</script>

<style scoped>
.equipment-reserve {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
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
  gap: 12px;
  padding: 15px;
  margin-top: 15px;
  margin-bottom: 20px;
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--main-border);
  flex-wrap: wrap;
}

.page-header h2 {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 10px 0;
  color: var(--text-primary);
}

.page-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}
</style>