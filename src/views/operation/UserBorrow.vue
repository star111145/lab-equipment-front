<template>
  <div class="user-borrow">
    <div class="page-header">
      <h2>我的借用记录</h2>
      <p>查看和管理我的设备借用记录</p>
    </div>
    <div class="content">
      <el-table
        v-loading="loading"
        :data="borrowList"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="equipmentModel" label="设备型号" width="120" />
        <el-table-column prop="equipmentType" label="设备类型" width="120" />
        <el-table-column prop="borrowQuantity" label="借用数量" width="100" />
        <el-table-column prop="purpose" label="用途" min-width="200" />
        <el-table-column prop="borrowTime" label="借用时间" width="160" />
        <el-table-column label="借用状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getBorrowStatusType(row.borrowStatus)">
              {{ getBorrowStatusText(row.borrowStatus) }}
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.borrowStatus === 1" 
              type="success" 
              size="small" 
              @click="handleReturn(row)"
            >归还</el-button>
            <el-button type="info" size="small" @click="handleView(row)">查看</el-button>
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
        title="借用详情"
        width="600px"
      >
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ viewForm.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '无' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ viewForm.equipmentType || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="借用数量">{{ viewForm.borrowQuantity || 1 }}</el-descriptions-item>
          <el-descriptions-item label="用途">{{ viewForm.purpose || '无' }}</el-descriptions-item>
          <el-descriptions-item label="借用人">{{ viewForm.realName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.phone }}</el-descriptions-item>
          <el-descriptions-item label="借用时间">{{ formatDate(viewForm.borrowTime) }}</el-descriptions-item>
          <el-descriptions-item label="借用状态">
            <el-tag :type="getBorrowStatusType(viewForm.borrowStatus)">
              {{ getBorrowStatusText(viewForm.borrowStatus) }}
            </el-tag>
          </el-descriptions-item>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import service from '@/api/request'

const loading = ref(false)
const borrowList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showViewDialog = ref(false)
const viewForm = ref({})

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/borrow/user/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value
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

const handleReturn = async (row) => {
  try {
    const res = await service.put(`/lifecycle/borrow/${row.id}/return`)
    if (res.code === 200) {
      ElMessage.success('归还成功')
      getList()
    } else {
      ElMessage.error(res.msg || '归还失败')
    }
  } catch (err) {
    console.error('归还失败:', err)
    ElMessage.error('归还失败')
  }
}

const handleView = (row) => {
  viewForm.value = { ...row }
  showViewDialog.value = true
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

const getBorrowStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已借出',
    2: '已归还',
    3: '已取消',
    4: '报修中',
    5: '维修中'
  }
  return statusMap[status] || '未知'
}

const getBorrowStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'warning',
    5: 'warning'
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
})
</script>

<style scoped>
.user-borrow {
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
</style>
