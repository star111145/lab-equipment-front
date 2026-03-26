<template>
  <div class="equipment-reserve">
    <div class="page-header">
      <h2>预约管理</h2>
      <p>管理所有设备预约记录</p>
    </div>
    <div class="content">
      <el-table
        v-loading="loading"
        :data="reserveList"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="equipmentModel" label="设备型号" width="120" />
        <el-table-column prop="equipmentType" label="设备类型" width="120" />
        <el-table-column prop="realName" label="预约人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="reserveTime" label="预约时间" width="160" />
        <el-table-column prop="reserveDuration" label="预约时长(小时)" width="130" />
        <el-table-column prop="purpose" label="用途" min-width="200" />
        <el-table-column label="预约状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReserveStatusType(row.reserveStatus)">
              {{ getReserveStatusText(row.reserveStatus) }}
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
          <el-descriptions-item label="用途">{{ viewForm.purpose || '无' }}</el-descriptions-item>
          <el-descriptions-item label="预约人">{{ viewForm.realName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.phone }}</el-descriptions-item>
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
const reserveList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showViewDialog = ref(false)
const viewForm = ref({})

const getReserveStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已同意',
    2: '已拒绝',
    3: '已取消'
  }
  return statusMap[status] || '未知'
}

const getReserveStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger',
    3: 'info'
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
    const res = await service.get('/lifecycle/reserve/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value
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

const handleAudit = async (row, status) => {
  try {
    const res = await service.put(`/lifecycle/reserve/${row.id}/audit`, {
      auditStatus: status,
      auditResult: status === 1 ? '同意' : '拒绝'
    })
    if (res.code === 200) {
      ElMessage.success('审核成功')
      getList()
    } else {
      ElMessage.error(res.msg || '审核失败')
    }
  } catch (err) {
    console.error('审核失败:', err)
    ElMessage.error('审核失败')
  }
}

const handleView = (row) => {
  viewForm.value = { ...row }
  showViewDialog.value = true
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.equipment-reserve {
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
