<template>
  <div class="equipment-return">
    <div class="page-header">
      <h2>归还管理</h2>
      <p>管理设备归还记录，检查归还完整性</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select
          v-model="searchStatus"
          placeholder="归还状态"
          clearable
          style="width: 150px"
          @change="getList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待归还" :value="0" />
          <el-option label="已归还" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-select
          v-model="searchAuditStatus"
          placeholder="审核状态"
          clearable
          style="width: 150px; margin-left: 20px;"
          @change="getList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已同意" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备编号/设备名称/归还人"
          clearable
          style="width: 300px; margin-left: 20px;"
          @input="getList"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button
          v-if="!showManagement"
          type="primary"
          @click="showManagement = true"
          style="margin-left: auto;"
        >
          管理
        </el-button>
      </div>

      <div v-if="showManagement" class="management-bar">
        <el-button type="primary" @click="showExportDialog = true; exportAll = false">
          统计报表
        </el-button>
        <el-button type="danger" :disabled="selectedRowIds.size === 0">
          批量删除 ({{ selectedRowIds.size }})
        </el-button>
        <el-button type="info" @click="handleSelectAll">全选当前页</el-button>
        <el-button type="info" @click="handleDeselectAll">取消全选</el-button>
        <el-button type="info" @click="showManagement = false">
          返回
        </el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="returnList"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement" type="selection" width="55" align="center" />
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
        <el-table-column prop="realName" label="归还人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="借用数量" width="120">
          <template #default="{ row }">
            {{ row.originalBorrowQuantity || row.borrowQuantity || 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="repairQuantity" label="故障数量" width="100" />
        <el-table-column prop="returnQuantity" label="归还数量" width="100" />
        <el-table-column prop="purpose" label="用途" min-width="200" />
        <el-table-column prop="returnTime" label="归还申请时间" width="160" />
        <el-table-column prop="expectedReturnTime" label="预计归还时间" width="160">
          <template #default="{ row }">
            {{ row.expectedReturnTime ? formatDate(row.expectedReturnTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="actualReturnTime" label="实际归还时间" width="160">
          <template #default="{ row }">
            {{ row.actualReturnTime ? formatDate(row.actualReturnTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="归还状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReturnStatusType(row.returnStatus)">
              {{ getReturnStatusText(row.returnStatus) }}
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.auditStatus === 0"
              type="success"
              size="small"
              @click="handleAudit(row, 1)"
            >验收通过</el-button>
            <el-button
              v-if="row.auditStatus === 0"
              type="danger"
              size="small"
              @click="handleAudit(row, 2)"
            >验收拒绝</el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleCancel(row)"
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
          title="归还详情"
          width="600px"
        >
          <el-descriptions :column="2" border>
            <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ viewForm.equipmentName }}</el-descriptions-item>
            <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '无' }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ viewForm.equipmentType || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="借用数量">{{ viewForm.originalBorrowQuantity || viewForm.borrowQuantity || 1 }}</el-descriptions-item>
            <el-descriptions-item label="故障数量">{{ viewForm.repairQuantity || 0 }}</el-descriptions-item>
            <el-descriptions-item label="归还数量">{{ viewForm.returnQuantity || 1 }}</el-descriptions-item>
            <el-descriptions-item label="用途">{{ viewForm.purpose || '无' }}</el-descriptions-item>
            <el-descriptions-item label="归还人">{{ viewForm.realName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ viewForm.phone }}</el-descriptions-item>
            <el-descriptions-item label="归还时间">{{ viewForm.returnTime ? formatDate(viewForm.returnTime) : '未归还' }}</el-descriptions-item>
            <el-descriptions-item label="预计归还时间">{{ viewForm.expectedReturnTime ? formatDate(viewForm.expectedReturnTime) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="实际归还时间">{{ viewForm.actualReturnTime ? formatDate(viewForm.actualReturnTime) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核人">{{ viewForm.auditUserName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核时间">{{ viewForm.auditTime ? formatDate(viewForm.auditTime) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="归还状态">
              <el-tag :type="getReturnStatusType(viewForm.returnStatus)">
                {{ getReturnStatusText(viewForm.returnStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="归还类型">
              <el-tag v-if="viewForm.repairQuantity > 0" type="warning">报修归还</el-tag>
              <el-tag v-else type="success">正常归还</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="getAuditStatusType(viewForm.auditStatus)">
                {{ getAuditStatusText(viewForm.auditStatus) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          <template #footer>
            <el-button @click="showViewDialog = false">关闭</el-button>
          </template>
        </el-dialog>

        <el-dialog
          v-model="showCancelDialog"
          title="取消归还"
          width="500px"
        >
          <el-form :model="cancelForm" label-width="80px">
            <el-form-item label="取消原因" required>
              <el-input
                v-model="cancelForm.reason"
                type="textarea"
                :rows="4"
                placeholder="请输入取消原因"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showCancelDialog = false">取消</el-button>
            <el-button type="primary" @click="confirmCancel">确定</el-button>
          </template>
        </el-dialog>

      <el-dialog
        v-model="showExportDialog"
        title="导出统计报表"
        width="400px"
        :close-on-click-modal="false"
      >
        <div style="text-align: center; padding: 20px 0;">
          <p style="margin-bottom: 20px; color: #666;">确定要导出归还记录吗？</p>
          <el-checkbox v-model="exportAll" style="margin-bottom: 20px;">导出全部记录</el-checkbox>
          <br>
          <el-button type="primary" size="large" @click="handleExport()">
            确认导出Excel
          </el-button>
        </div>
        <template #footer>
          <el-button @click="showExportDialog = false">取消</el-button>
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

const route = useRoute()

const defaultImage = require('@/assets/default_equipment.png')

const loading = ref(false)
const returnList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchStatus = ref(null)
const searchAuditStatus = ref(null)
const searchKeyword = ref('')
const showManagement = ref(false)
const selectedRowIds = ref(new Set())

const showViewDialog = ref(false)
const viewForm = ref({})
const showExportDialog = ref(false)
const exportAll = ref(false)
const tableRef = ref(null)

const showCancelDialog = ref(false)
const cancelForm = ref({
  id: null,
  reason: ''
})

const getReturnStatusText = (status) => {
  const statusMap = {
    0: '待归还',
    1: '已归还',
    2: '已拒绝'
  }
  return statusMap[status] || '未知'
}

const getReturnStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger'
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
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'info'
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

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/return/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: searchStatus.value,
        auditStatus: searchAuditStatus.value,
        keyword: searchKeyword.value
      }
    })
    if (res.code === 200) {
      returnList.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取归还列表失败')
    }
  } catch (err) {
    console.error('获取归还列表失败:', err)
    ElMessage.error('获取归还列表失败')
  } finally {
    loading.value = false
  }
}

const handleAudit = async (row, auditStatus) => {
  if (auditStatus === 1) {
    ElMessageBox.confirm(`确定要通过这条归还记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const res = await service.put(`/lifecycle/return/${row.id}/audit`, {
          auditStatus,
          auditResult: '验收通过'
        })
        if (res.code === 200) {
          ElMessage.success(res.data?.message || '验收通过成功')
          if (res.data?.needRefresh) {
            getList()
          }
        } else {
          ElMessage.error(res.msg || '审核失败')
        }
      } catch (err) {
        console.error('审核失败:', err)
        ElMessage.error('审核失败')
      }
    }).catch(() => {
      ElMessage.info('已取消审核')
    })
  } else {
    ElMessageBox.prompt('请输入拒绝理由：', '拒绝验收', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      inputPattern: /\S+/,
      inputErrorMessage: '拒绝理由不能为空'
    }).then(async ({ value }) => {
      try {
        const res = await service.put(`/lifecycle/return/${row.id}/audit`, {
          auditStatus,
          auditResult: value || '验收拒绝'
        })
        if (res.code === 200) {
          ElMessage.success(res.data?.message || '验收拒绝成功')
          if (res.data?.needRefresh) {
            getList()
          }
        } else {
          ElMessage.error(res.msg || '审核失败')
        }
      } catch (err) {
        console.error('审核失败:', err)
        ElMessage.error('审核失败')
      }
    }).catch(() => {
      ElMessage.info('已取消审核')
    })
  }
}

const handleCancel = (row) => {
  cancelForm.value = {
    id: row.id,
    reason: ''
  }
  showCancelDialog.value = true
}

const confirmCancel = async () => {
  if (!cancelForm.value.reason.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }
  try {
    const res = await service.put(`/lifecycle/return/${cancelForm.value.id}/admin-cancel`, {
      reason: cancelForm.value.reason
    })
    if (res.code === 200) {
      ElMessage.success(res.msg || '取消成功')
      showCancelDialog.value = false
      getList()
    } else {
      ElMessage.error(res.msg || '取消失败')
    }
  } catch (err) {
    console.error('取消失败:', err)
    ElMessage.error('取消失败')
  }
}

const handleView = async (row) => {
  if (row && row.id) {
    const returnId = row.id
    const found = returnList.value.find(item => item.id === returnId)
    if (found) {
      viewForm.value = { ...found }
      showViewDialog.value = true
    } else {
      try {
        const res = await service.get(`/lifecycle/return/${returnId}`)
        if (res.code === 200 && res.data) {
          viewForm.value = res.data
          showViewDialog.value = true
        } else {
          ElMessage.error('获取归还详情失败')
        }
      } catch (err) {
        console.error('获取归还详情失败:', err)
        ElMessage.error('获取归还详情失败')
      }
    }
  } else {
    viewForm.value = { ...row }
    showViewDialog.value = true
  }
}

const handleSelectionChange = (selection) => {
  selectedRowIds.value = new Set(selection.map(item => item.id))
}

const handleSelectAll = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
    selectedRowIds.value.clear()
  }
  returnList.value.forEach(row => {
    selectedRowIds.value.add(row.id)
  })
  if (tableRef.value) {
    tableRef.value.toggleAllSelection()
  }
  ElMessage.success(`已选择当前页 ${returnList.value.length} 条记录`)
}

const handleDeselectAll = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  selectedRowIds.value.clear()
  ElMessage.success('已取消所有选择')
}

const handleExport = async () => {
  showExportDialog.value = false
  try {
    const params = new URLSearchParams()
    if (searchStatus.value !== null && searchStatus.value !== '') {
      params.append('status', searchStatus.value)
    }
    if (searchKeyword.value) {
      params.append('keyword', searchKeyword.value)
    }
    if (exportAll.value) {
      params.append('exportAll', 'true')
    } else {
      params.append('current', '1')
      params.append('size', pageSize.value.toString())
    }
    
    const token = localStorage.getItem('token')
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const response = await fetch(`/api/lifecycle/return/export?${params.toString()}`, {
      credentials: 'include',
      headers
    })
    
    if (!response.ok) {
      if (response.status === 403) {
        ElMessage.error('您没有权限执行此操作，请确保已登录')
      } else {
        ElMessage.error('导出失败，请稍后重试')
      }
      return
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    const now = new Date()
    const timestamp = now.getFullYear() + 
      String(now.getMonth() + 1).padStart(2, '0') + 
      String(now.getDate()).padStart(2, '0') + 
      String(now.getHours()).padStart(2, '0') + 
      String(now.getMinutes()).padStart(2, '0') + 
      String(now.getSeconds()).padStart(2, '0')
    a.download = `归还记录_${timestamp}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(a)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败，请稍后重试')
  }
}

onMounted(() => {
  getList()
  document.addEventListener('visibilitychange', handleVisibilityChange)
  websocketClient.on('return_refresh', handleWsMessage)
  
  const returnId = route.query.id
  if (returnId) {
    handleView({ id: returnId })
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
  websocketClient.off('return_refresh', handleWsMessage)
})
</script>

<style scoped>
.equipment-return {
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
</style>
