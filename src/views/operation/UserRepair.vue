<template>
  <div class="user-repair">
    <div class="page-header">
      <h2>我的报修记录</h2>
      <p>查看我的设备报修记录</p>
    </div>
    <div class="content">
      <el-table
        v-loading="loading"
        :data="repairList"
        style="width: 100%"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="equipmentModel" label="设备型号" width="120" />
        <el-table-column prop="equipmentType" label="设备类型" width="120" />
        <el-table-column prop="faultDescription" label="故障说明" min-width="200" />
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
        <el-table-column label="操作" width="150" fixed="right">
          <el-button type="info" size="small" @click="handleView(row)">查看</el-button>
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
          <el-descriptions-item label="设备类型">{{ viewForm.equipmentType || '未知' }}</el-descriptions-item>
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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import service from '@/api/request'

const loading = ref(false)
const repairList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const showViewDialog = ref(false)
const viewForm = ref({})

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/repair/user/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value
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

const getRepairStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '报修中',
    2: '维修中',
    3: '已完成',
    4: '已拒绝'
  }
  return statusMap[status] || '未知'
}

const getRepairStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'warning',
    3: 'success',
    4: 'danger'
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
