<template>
  <div class="user-reserve">
    <div class="page-header">
      <h2>我的预约</h2>
      <p>管理我的预约记录</p>
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
        :data="reserveList"
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
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="isBorrowable(row)"
              type="primary"
              size="small"
              @click="handleBorrow(row)"
            >借用</el-button>
            <el-button
              v-if="row.reserveStatus === 1 && canExtend(row) && row.hasBorrow !== 1"
              type="success"
              size="small"
              @click="handleExtend(row)"
            >延期</el-button>
            <el-button
              v-if="row.reserveStatus === 0"
              type="warning"
              size="small"
              @click="handleEdit(row)"
            >修改</el-button>
            <el-button
              v-if="row.reserveStatus === 0"
              type="danger"
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

      <el-dialog
        v-model="showEditDialog"
        title="修改预约"
        width="500px"
      >
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="设备名称">
            <span>{{ editForm.equipmentName }}</span>
          </el-form-item>
          <el-form-item label="预约时间" required>
            <el-date-picker
              v-model="editForm.reserveTime"
              type="datetime"
              placeholder="选择预约时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled-date="disabledDate"
            />
          </el-form-item>
          <el-form-item label="预约时长" required>
            <el-input-number
              v-model="editForm.reserveDuration"
              :min="1"
              :max="720"
              controls-position="right"
            />
            <span style="margin-left: 10px">小时</span>
          </el-form-item>
          <el-form-item label="预约用途" required>
            <el-input
              v-model="editForm.purpose"
              type="textarea"
              :rows="3"
              placeholder="请输入预约用途（限200字）"
              maxlength="200"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">提交修改</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showExtendDialog"
        title="申请延期"
        width="500px"
      >
        <el-form :model="extendForm" label-width="100px">
          <el-form-item label="设备名称">
            <span>{{ extendForm.equipmentName }}</span>
          </el-form-item>
          <el-form-item label="原预约结束">
            <span style="color: #909399">{{ extendForm.originalEndTime }}</span>
          </el-form-item>
          <el-form-item label="延期时长" required>
            <el-input-number
              v-model="extendForm.newReserveDuration"
              :min="1"
              :max="720"
              controls-position="right"
            />
            <span style="margin-left: 10px">小时</span>
          </el-form-item>
          <el-form-item label="延期原因" required>
            <el-input
              v-model="extendForm.extendReason"
              type="textarea"
              :rows="3"
              placeholder="请输入延期原因"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showExtendDialog = false">取消</el-button>
          <el-button type="primary" @click="submitExtend">提交延期申请</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showBorrowDialog"
        title="借用设备"
        width="500px"
      >
        <el-form :model="borrowForm" label-width="100px">
          <el-form-item label="设备编号">
            <span>{{ borrowForm.equipmentNumber }}</span>
          </el-form-item>
          <el-form-item label="设备名称">
            <span>{{ borrowForm.equipmentName }}</span>
          </el-form-item>
          <el-form-item label="预约时间">
            <span>{{ borrowForm.reserveTime }} 至 {{ borrowForm.reserveEndTime }}</span>
          </el-form-item>
          <el-form-item label="可用数量">
            <span>{{ borrowForm.availableQuantity }} 台</span>
          </el-form-item>
          <el-form-item label="借用数量" required>
            <NumberInput
              v-model="borrowForm.quantity"
              :min="1"
              :max="borrowForm.availableQuantity"
            />
          </el-form-item>
          <el-form-item label="预计归还" required>
            <el-date-picker
              v-model="borrowForm.expectedReturnTime"
              type="datetime"
              placeholder="选择预计归还时间（必须在预约时间范围内）"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item label="借用用途" required>
            <el-input
              v-model="borrowForm.purpose"
              type="textarea"
              :rows="3"
              placeholder="请输入借用用途"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showBorrowDialog = false">取消</el-button>
          <el-button type="primary" @click="submitBorrow">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import service from '@/api/request'
import { websocketClient } from '@/utils/websocket'
import NumberInput from '@/components/NumberInput.vue'

const router = useRouter()
const route = useRoute()

const defaultImage = require('@/assets/default_equipment.png')

const loading = ref(false)
const submitting = ref(false)
const reserveList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchStatus = ref(null)
const searchKeyword = ref('')

const showViewDialog = ref(false)
const viewForm = ref({})

const showEditDialog = ref(false)
const editForm = ref({
  id: null,
  equipmentName: '',
  reserveTime: '',
  reserveDuration: 1,
  purpose: ''
})

const showExtendDialog = ref(false)
const extendForm = ref({
  id: null,
  equipmentName: '',
  originalEndTime: '',
  newReserveDuration: 1,
  extendReason: ''
})

const showBorrowDialog = ref(false)
const borrowForm = ref({
  id: null,
  equipmentNumber: '',
  equipmentName: '',
  reserveTime: '',
  reserveEndTime: '',
  availableQuantity: 0,
  quantity: 1,
  expectedReturnTime: '',
  purpose: '',
  reserveId: null
})

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

const disabledDate = (time) => {
  const now = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  return time.getTime() < now.getTime() - 86400000 || time.getTime() > thirtyDaysLater.getTime()
}

const isReserveExpired = (row) => {
  if (row.reserveStatus !== 1) return false
  const now = new Date()
  const reserveEndTime = new Date(row.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (row.reserveDuration || 0))
  return now > reserveEndTime
}

const isBorrowable = (row) => {
  if (row.reserveStatus !== 1) return false
  if (row.hasBorrow === 1) return false
  const now = new Date()
  const reserveStartTime = new Date(row.reserveTime)
  const reserveEndTime = new Date(row.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (row.reserveDuration || 0))
  return now >= reserveStartTime && now <= reserveEndTime
}

const canExtend = (row) => {
  if (row.reserveStatus !== 1) return false
  if (isReserveExpired(row)) return false
  const now = new Date()
  const reserveStartTime = new Date(row.reserveTime)
  return now >= reserveStartTime
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
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger',
    3: 'info'
  }
  return typeMap[row.reserveStatus] || ''
}

const getAuditStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已同意',
    2: '已拒绝'
  }
  return statusMap[status] || '-'
}

const getAuditStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || ''
}

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/reserve/user/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: searchStatus.value,
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

const handleBorrow = async (row) => {
  const now = new Date()
  const reserveStartTime = new Date(row.reserveTime)
  const reserveEndTime = new Date(row.reserveTime)
  reserveEndTime.setHours(reserveEndTime.getHours() + (row.reserveDuration || 0))
  
  if (now < reserveStartTime) {
    ElMessage.warning('预约还未开始，请等到预约时间后再借用')
    return
  }
  
  if (now > reserveEndTime) {
    ElMessage.warning('预约已过期，无法借用')
    return
  }
  
  const reserveEndTimeStr = formatDate(reserveEndTime)
  
  borrowForm.value = {
    id: row.equipmentId,
    equipmentNumber: row.equipmentNumber,
    equipmentName: row.equipmentName,
    reserveTime: formatDate(row.reserveTime),
    reserveEndTime: reserveEndTimeStr,
    availableQuantity: row.availableQuantity || 0,
    quantity: 1,
    expectedReturnTime: '',
    purpose: '',
    reserveId: row.id
  }
  
  try {
    const res = await service.get(`/equipment/${row.equipmentId}`)
    if (res.code === 200) {
      borrowForm.value.availableQuantity = res.data.availableQuantity
      showBorrowDialog.value = true
    } else {
      ElMessage.error(res.msg || '获取设备信息失败')
    }
  } catch (error) {
    ElMessage.error('获取设备信息失败')
  }
}

const submitBorrow = async () => {
  if (submitting.value) return
  if (!borrowForm.value.quantity || borrowForm.value.quantity < 1) {
    ElMessage.warning('请填写借用数量')
    return
  }
  if (!borrowForm.value.expectedReturnTime) {
    ElMessage.warning('请选择预计归还时间')
    return
  }
  if (borrowForm.value.reserveEndTime) {
    const returnTime = new Date(borrowForm.value.expectedReturnTime).getTime()
    const reserveStart = new Date(borrowForm.value.reserveTime).getTime()
    const reserveEnd = new Date(borrowForm.value.reserveEndTime).getTime()
    if (returnTime < reserveStart || returnTime > reserveEnd) {
      ElMessage.warning('预计归还时间必须在预约时间范围内')
      return
    }
  }
  if (!borrowForm.value.purpose) {
    ElMessage.warning('请填写借用用途')
    return
  }
  if (borrowForm.value.quantity > borrowForm.value.availableQuantity) {
    ElMessage.warning('借用数量不能超过可用数量')
    return
  }
  
  submitting.value = true
  try {
    const res = await service.post('/lifecycle/borrow', {
      equipmentId: borrowForm.value.id,
      borrowQuantity: borrowForm.value.quantity,
      expectedReturnTime: borrowForm.value.expectedReturnTime,
      purpose: borrowForm.value.purpose,
      reserveId: borrowForm.value.reserveId
    })
    if (res.code === 200) {
      ElMessage.success(res.data || '借用申请已提交，等待管理员审核')
      showBorrowDialog.value = false
      router.push('/platform/user/borrow')
    } else {
      ElMessage.error(res.msg || '提交失败')
    }
  } catch (error) {
    console.error('借用提交错误：', error)
    ElMessage.error(error.response?.data?.msg || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定取消该预约吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await service.put(`/lifecycle/reserve/${row.id}/cancel`, {})
    if (res.code === 200) {
      ElMessage.success('取消成功')
      getList()
    } else {
      ElMessage.error(res.msg || '取消失败')
    }
  } catch (err) {
    console.error('取消失败:', err)
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

const handleEdit = (row) => {
  editForm.value = {
    id: row.id,
    equipmentName: row.equipmentName,
    reserveTime: row.reserveTime,
    reserveDuration: row.reserveDuration,
    purpose: row.purpose
  }
  showEditDialog.value = true
}

const submitEdit = async () => {
  if (!editForm.value.reserveTime) {
    ElMessage.warning('请选择预约时间')
    return
  }
  const reserveTimeDate = new Date(editForm.value.reserveTime)
  const now = new Date()
  if (reserveTimeDate <= now) {
    ElMessage.warning('预约时间必须是未来时间')
    return
  }
  if (!editForm.value.reserveDuration || editForm.value.reserveDuration <= 0) {
    ElMessage.warning('请输入有效的预约时长（至少1小时）')
    return
  }
  if (!editForm.value.purpose) {
    ElMessage.warning('请输入预约用途')
    return
  }
  
  try {
    const checkRes = await service.get('/lifecycle/reserve/check-conflict', {
      params: {
        equipmentId: null,
        reserveTime: editForm.value.reserveTime,
        reserveDuration: editForm.value.reserveDuration,
        excludeId: editForm.value.id
      }
    })
    if (checkRes.code === 200 && checkRes.data) {
      ElMessage.warning('该时段设备已被预约，请选择其他时间')
      return
    }
    
    const res = await service.put(`/lifecycle/reserve/${editForm.value.id}`, {
      reserveTime: editForm.value.reserveTime,
      reserveDuration: editForm.value.reserveDuration,
      purpose: editForm.value.purpose,
      auditStatus: 0
    })
    if (res.code === 200) {
      ElMessage.success('预约修改成功，等待重新审核')
      showEditDialog.value = false
      getList()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (err) {
    console.error('修改预约失败:', err)
    ElMessage.error('修改失败')
  }
}

const handleExtend = (row) => {
  const originalEnd = new Date(row.reserveTime)
  originalEnd.setHours(originalEnd.getHours() + (row.reserveDuration || 1))
  
  extendForm.value = {
    id: row.id,
    equipmentName: row.equipmentName,
    originalEndTime: originalEnd.toLocaleString('zh-CN'),
    newReserveDuration: 1,
    extendReason: ''
  }
  showExtendDialog.value = true
}

const submitExtend = async () => {
  if (submitting.value) return
  if (!extendForm.value.newReserveDuration || extendForm.value.newReserveDuration <= 0) {
    ElMessage.warning('请输入有效的延期时长')
    return
  }
  if (!extendForm.value.extendReason) {
    ElMessage.warning('请输入延期原因')
    return
  }
  
  submitting.value = true
  try {
    const res = await service.post('/lifecycle/reserve/extend', {
      originalReservationId: extendForm.value.id,
      newReserveDuration: extendForm.value.newReserveDuration,
      extendReason: extendForm.value.extendReason
    })
    if (res.code === 200) {
      ElMessage.success('延期申请已提交，等待管理员审核')
      showExtendDialog.value = false
      getList()
    } else {
      ElMessage.error(res.msg || '延期申请提交失败')
    }
  } catch (err) {
    console.error('延期申请提交失败:', err)
    ElMessage.error('延期申请提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  getList()
  websocketClient.on('reservation_refresh', handleWsMessage)
  
  // 检查路由参数，如果有id则打开详情
  const reserveId = route.query.id
  if (reserveId) {
    handleView({ id: reserveId })
  }
})

const handleWsMessage = (data) => {
  getList()
  if (data && data.message) {
    ElMessage.info(data.message)
  }
}

onUnmounted(() => {
  websocketClient.off('reservation_refresh', handleWsMessage)
})
</script>

<style scoped>
.user-reserve {
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