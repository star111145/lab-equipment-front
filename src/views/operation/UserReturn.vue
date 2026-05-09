<template>
  <div class="user-return">
    <div class="page-header">
      <h2>我的归还</h2>
      <p>查看和管理我的设备归还记录</p>
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
        :data="returnList"
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
        <el-table-column prop="equipmentType" label="设备类型" width="120" />
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
        <el-table-column label="归还类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.repairQuantity > 0" type="warning">报修归还</el-tag>
            <el-tag v-else type="success">正常归还</el-tag>
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
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
          <el-descriptions-item label="归还人">{{ viewForm.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.phone }}</el-descriptions-item>
          <el-descriptions-item label="归还时间">{{ viewForm.returnTime ? formatDate(viewForm.returnTime) : '未归还' }}</el-descriptions-item>
          <el-descriptions-item label="归还状态">
            <el-tag :type="getReturnStatusType(viewForm.returnStatus)">
              {{ getReturnStatusText(viewForm.returnStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="归还类型">
            <el-tag v-if="viewForm.repairQuantity > 0" type="warning">报修归还</el-tag>
            <el-tag v-else type="success">正常归还</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计归还时间">{{ viewForm.expectedReturnTime ? formatDate(viewForm.expectedReturnTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际归还时间">{{ viewForm.actualReturnTime ? formatDate(viewForm.actualReturnTime) : '-' }}</el-descriptions-item>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import service from '@/api/request'
import { websocketClient } from '@/utils/websocket'

const route = useRoute()

const defaultImage = require('@/assets/default_equipment.png')

const loading = ref(false)
const submitting = ref(false)
const returnList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchStatus = ref(null)
const searchAuditStatus = ref(null)
const searchKeyword = ref('')

const showViewDialog = ref(false)
const viewForm = ref({})

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
    const res = await service.get('/lifecycle/return/user/list', {
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

const handleView = async (row) => {
  if (row && row.id) {
    const returnId = row.id
    const found = returnList.value.find(item => item.id === returnId)
    if (found) {
      viewForm.value = { ...found }
      showViewDialog.value = true
    } else {
      try {
        const res = await service.get(`/lifecycle/return/user/${returnId}`)
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

onMounted(() => {
  getList()
  websocketClient.on('return_refresh', handleWsMessage)
  
  const returnId = route.query.id
  if (returnId) {
    handleView({ id: returnId })
  }
})

const handleWsMessage = () => {
  getList()
}

onUnmounted(() => {
  websocketClient.off('return_refresh', handleWsMessage)
})
</script>

<style scoped>
.user-return {
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
</style>
