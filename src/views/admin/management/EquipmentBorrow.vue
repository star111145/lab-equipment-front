<template>
  <div class="equipment-borrow">
    <div class="page-header">
      <h2>借用管理</h2>
      <p>管理设备借用记录</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select
          v-model="searchStatus"
          placeholder="借用状态"
          clearable
          style="width: 150px"
          @change="getList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已借出" :value="1" />
          <el-option label="已完成" :value="2" />
          <el-option label="已逾期" :value="5" />
          <el-option label="已取消" :value="3" />
          <el-option label="已拒绝" :value="4" />
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
          <el-option label="已通过" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备编号/设备名称/借用人"
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
        :data="borrowList"
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
        <el-table-column prop="realName" label="借用人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column label="借用数量" width="120">
          <template #default="{ row }">
            {{ row.originalQuantity || row.borrowQuantity || 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="purpose" label="用途" min-width="200" />
        <el-table-column prop="borrowTime" label="借用时间" width="160" />
        <el-table-column prop="expectedReturnTime" label="预计归还时间" width="160">
          <template #default="{ row }">
            {{ row.expectedReturnTime ? formatDate(row.expectedReturnTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="借用状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getBorrowStatusType(row)">
              {{ getBorrowStatusText(row) }}
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
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.auditStatus === 0"
              type="success"
              size="small"
              @click="handleAudit(row, 1)"
            >通过</el-button>
            <el-button
              v-if="row.auditStatus === 0"
              type="danger"
              size="small"
              @click="handleAudit(row, 2)"
            >拒绝</el-button>
            <el-button
              v-if="row.borrowStatus === 1"
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
        style="margin-top: 20px; justify-content: flex-end;"
      />

      <el-dialog
        v-model="showViewDialog"
        title="借用详情"
        width="600px"
      >
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ viewForm.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '无' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ viewForm.equipmentType || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="借用数量">{{ viewForm.originalQuantity || viewForm.borrowQuantity || 1 }}</el-descriptions-item>
          <el-descriptions-item label="用途">{{ viewForm.purpose || '无' }}</el-descriptions-item>
          <el-descriptions-item label="借用人">{{ viewForm.realName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.phone }}</el-descriptions-item>
          <el-descriptions-item label="借用时间">{{ formatDate(viewForm.borrowTime) }}</el-descriptions-item>
          <el-descriptions-item label="预计归还时间">{{ viewForm.expectedReturnTime ? formatDate(viewForm.expectedReturnTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="借用状态">
            <el-tag :type="getBorrowStatusType(viewForm)">
              {{ getBorrowStatusText(viewForm) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人">{{ viewForm.auditUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ viewForm.auditTime ? formatDate(viewForm.auditTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getAuditStatusType(viewForm.auditStatus)">
              {{ getAuditStatusText(viewForm.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核结果" :span="2">{{ viewForm.auditResult || '无' }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button @click="showViewDialog = false">关闭</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showCancelDialog"
        title="取消借用"
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
          <p style="margin-bottom: 20px; color: #666;">确定要导出借用记录吗？</p>
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
const borrowList = ref([])
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

const isOverdue = (row) => {
  if (row.borrowStatus !== 1) return false
  if (row.hasReturn) return false
  if (!row.expectedReturnTime) return false
  return new Date(row.expectedReturnTime) < new Date()
}

const getBorrowStatusText = (row) => {
  if (row.borrowStatus === 2 || row.borrowQuantity === 0) {
    return '已完成'
  }
  if (isOverdue(row)) {
    return '已逾期'
  }
  const statusMap = {
    0: '待审核',
    1: '已借出',
    3: '已取消',
    4: '已拒绝'
  }
  return statusMap[row.borrowStatus] || '未知'
}

const getBorrowStatusType = (row) => {
  if (row.borrowStatus === 2 || row.borrowQuantity === 0) {
    return 'success'
  }
  if (isOverdue(row)) {
    return 'danger'
  }
  const typeMap = {
    0: 'info',
    1: 'warning',
    3: 'danger',
    4: 'danger'
  }
  return typeMap[row.borrowStatus] || 'info'
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
    const res = await service.get('/lifecycle/borrow/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: searchStatus.value,
        auditStatus: searchAuditStatus.value,
        keyword: searchKeyword.value
      }
    })
    if (res.code === 200) {
      borrowList.value = res.data.records
      total.value = res.data.total
    } else {
      ElMessage.error(res.msg || '获取借用列表失败')
    }
  } catch (err) {
    console.error('获取借用列表失败:', err)
    ElMessage.error('获取借用列表失败')
  } finally {
    loading.value = false
  }
}

const handleAudit = async (row, status) => {
  if (status === 1) {
    ElMessageBox.confirm(`确定要通过这条借用记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const res = await service.put(`/lifecycle/borrow/${row.id}/audit`, {
          auditStatus: status,
          auditResult: '已通过'
        })
        if (res.code === 200) {
          ElMessage.success(res.data?.message || '通过成功')
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
    ElMessageBox.prompt('请输入拒绝理由：', '拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      inputPattern: /\S+/,
      inputErrorMessage: '拒绝理由不能为空'
    }).then(async ({ value }) => {
      try {
        const res = await service.put(`/lifecycle/borrow/${row.id}/audit`, {
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
    const res = await service.put(`/lifecycle/borrow/${cancelForm.value.id}/admin-cancel`, {
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
    const borrowId = row.id
    const found = borrowList.value.find(item => item.id === borrowId)
    if (found) {
      viewForm.value = { ...found }
      showViewDialog.value = true
    } else {
      try {
        const res = await service.get(`/lifecycle/borrow/${borrowId}`)
        if (res.code === 200 && res.data) {
          viewForm.value = res.data
          showViewDialog.value = true
        } else {
          ElMessage.error('获取借用详情失败')
        }
      } catch (err) {
        console.error('获取借用详情失败:', err)
        ElMessage.error('获取借用详情失败')
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
  borrowList.value.forEach(row => {
    selectedRowIds.value.add(row.id)
  })
  if (tableRef.value) {
    tableRef.value.toggleAllSelection()
  }
  ElMessage.success(`已选择当前页 ${borrowList.value.length} 条记录`)
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
    if (searchAuditStatus.value !== null && searchAuditStatus.value !== '') {
      params.append('auditStatus', searchAuditStatus.value)
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
    const response = await fetch(`/api/lifecycle/borrow/export?${params.toString()}`, {
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
    a.download = `借用记录_${timestamp}.xlsx`
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
  websocketClient.on('borrow_refresh', handleWsMessage)
  
  const borrowId = route.query.id
  if (borrowId) {
    handleView({ id: borrowId })
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
  websocketClient.off('borrow_refresh', handleWsMessage)
})
</script>

<style scoped>
.equipment-borrow {
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

.equipment-avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}
</style>
