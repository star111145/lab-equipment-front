<template>
  <div class="mobile-records-container">
    <div class="header">
      <el-button text @click="goBack" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h2>{{ title }}</h2>
    </div>
    
    <div class="filter-bar">
      <el-radio-group v-if="showTypeTabs" v-model="activeType" size="small" @change="handleTypeChange" class="type-tabs">
        <el-radio-button value="reserve">预约</el-radio-button>
        <el-radio-button value="borrow">借用</el-radio-button>
        <el-radio-button value="return">归还</el-radio-button>
        <el-radio-button value="repair">报修</el-radio-button>
      </el-radio-group>
      
      <div class="filter-row">
        <el-select v-model="searchStatus" placeholder="状态筛选" clearable size="small" style="width: 100px" @change="loadRecords">
          <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索设备" clearable size="small" style="flex: 1; margin-left: 8px;" @input="loadRecords">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <el-icon class="is-loading" size="40"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="records.length === 0" class="empty">
      <el-icon size="50"><InfoFilled /></el-icon>
      <p>暂无记录</p>
    </div>
    
    <div v-else class="records-list">
      <div 
        v-for="item in records" 
        :key="item.id" 
        class="record-card"
        @click="viewDetail(item)"
      >
        <div class="record-header">
          <img :src="item.equipmentImage || defaultImage" class="equipment-thumb" />
          <div class="record-info">
            <div class="equipment-name">{{ item.equipmentName }}</div>
            <div class="equipment-number">编号: {{ item.equipmentNumber }}</div>
          </div>
          <div class="status-tags">
            <el-tag :type="getStatusType(item)" size="small">
              {{ getStatusText(item) }}
            </el-tag>
            <el-tag v-if="activeType === 'reserve' && item.isExtension === 1" type="warning" size="small" style="margin-left: 4px;">
              延期
            </el-tag>
            <el-tag v-if="activeType === 'return' && item.repairQuantity > 0" type="danger" size="small" style="margin-left: 4px;">
              报修
            </el-tag>
          </div>
        </div>
        
        <div class="record-detail">
          <div class="detail-item" v-if="getDisplayQuantity(item)">
            <span class="label">数量:</span>
            <span class="value">{{ getDisplayQuantity(item) }}</span>
          </div>
          <div class="detail-item" v-if="activeType === 'return'">
            <span class="label">借用数量:</span>
            <span class="value">{{ item.originalBorrowQuantity || item.borrowQuantity || 1 }}</span>
          </div>
          <div class="detail-item" v-if="activeType === 'return'">
            <span class="label">故障数量:</span>
            <span class="value">{{ item.repairQuantity || 0 }}</span>
          </div>
          <div class="detail-item" v-if="activeType === 'return'">
            <span class="label">归还数量:</span>
            <span class="value">{{ item.returnQuantity || 1 }}</span>
          </div>
          <div class="detail-item" v-if="item.reserveTime">
            <span class="label">预约时间:</span>
            <span class="value">{{ formatDate(item.reserveTime) }}</span>
          </div>
          <div class="detail-item" v-if="item.reserveDuration">
            <span class="label">预约时长:</span>
            <span class="value">{{ item.reserveDuration }}小时</span>
          </div>
          <div class="detail-item" v-if="item.borrowTime">
            <span class="label">借用时间:</span>
            <span class="value">{{ formatDate(item.borrowTime) }}</span>
          </div>
          <div class="detail-item" v-if="item.expectedReturnTime">
            <span class="label">预计归还:</span>
            <span class="value">{{ formatDate(item.expectedReturnTime) }}</span>
          </div>
          <div class="detail-item" v-if="item.actualReturnTime">
            <span class="label">实际归还:</span>
            <span class="value">{{ formatDate(item.actualReturnTime) }}</span>
          </div>
          <div class="detail-item" v-if="item.auditStatus !== undefined">
            <span class="label">审核状态:</span>
            <el-tag :type="getAuditType(item.auditStatus)" size="small">
              {{ getAuditText(item.auditStatus) }}
            </el-tag>
          </div>
        </div>
        
        <div class="record-actions" v-if="item.borrowStatus === 1 && activeType === 'borrow'">
          <el-button type="success" size="small" @click.stop="handleReturn(item)">
            归还
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-if="total > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        size="small"
        @current-change="loadRecords"
      />
    </div>
    
    <el-dialog v-model="showDetailDialog" :title="detailTitle" width="90%">
      <div v-if="currentRecord" class="detail-content">
        <div class="detail-row">
          <span class="label">设备名称:</span>
          <span class="value">{{ currentRecord.equipmentName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">设备编号:</span>
          <span class="value">{{ currentRecord.equipmentNumber }}</span>
        </div>
        <div class="detail-row">
          <span class="label">设备型号:</span>
          <span class="value">{{ currentRecord.equipmentModel || '-' }}</span>
        </div>
        <div class="detail-row" v-if="getDisplayQuantity(currentRecord)">
          <span class="label">数量:</span>
          <span class="value">{{ getDisplayQuantity(currentRecord) }}</span>
        </div>
        <div class="detail-row" v-if="activeType === 'return'">
          <span class="label">借用数量:</span>
          <span class="value">{{ currentRecord.originalBorrowQuantity || currentRecord.borrowQuantity || 1 }}</span>
        </div>
        <div class="detail-row" v-if="activeType === 'return'">
          <span class="label">故障数量:</span>
          <span class="value">{{ currentRecord.repairQuantity || 0 }}</span>
        </div>
        <div class="detail-row" v-if="activeType === 'return'">
          <span class="label">归还数量:</span>
          <span class="value">{{ currentRecord.returnQuantity || 1 }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.reserveTime">
          <span class="label">预约时间:</span>
          <span class="value">{{ formatDate(currentRecord.reserveTime) }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.reserveDuration">
          <span class="label">预约时长:</span>
          <span class="value">{{ currentRecord.reserveDuration }}小时</span>
        </div>
        <div class="detail-row" v-if="currentRecord.borrowTime">
          <span class="label">借用时间:</span>
          <span class="value">{{ formatDate(currentRecord.borrowTime) }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.expectedReturnTime">
          <span class="label">预计归还:</span>
          <span class="value">{{ formatDate(currentRecord.expectedReturnTime) }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.actualReturnTime">
          <span class="label">实际归还:</span>
          <span class="value">{{ formatDate(currentRecord.actualReturnTime) }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.purpose">
          <span class="label">用途:</span>
          <span class="value">{{ currentRecord.purpose }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.reason">
          <span class="label">原因:</span>
          <span class="value">{{ currentRecord.reason }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.faultDescription">
          <span class="label">故障描述:</span>
          <span class="value">{{ currentRecord.faultDescription }}</span>
        </div>
        <div class="detail-row">
          <span class="label">状态:</span>
          <el-tag :type="getStatusType(currentRecord)">{{ getStatusText(currentRecord) }}</el-tag>
        </div>
        <div class="detail-row" v-if="activeType === 'reserve' && currentRecord.isExtension === 1">
          <span class="label">预约类型:</span>
          <el-tag type="warning">延期</el-tag>
        </div>
        <div class="detail-row" v-if="activeType === 'return'">
          <span class="label">归还类型:</span>
          <el-tag :type="currentRecord.repairQuantity > 0 ? 'danger' : 'success'">
            {{ currentRecord.repairQuantity > 0 ? '报修归还' : '正常归还' }}
          </el-tag>
        </div>
        <div class="detail-row" v-if="currentRecord.auditStatus !== undefined">
          <span class="label">审核状态:</span>
          <el-tag :type="getAuditType(currentRecord.auditStatus)">{{ getAuditText(currentRecord.auditStatus) }}</el-tag>
        </div>
        <div class="detail-row" v-if="currentRecord.auditUserName">
          <span class="label">审核人:</span>
          <span class="value">{{ currentRecord.auditUserName }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.auditTime">
          <span class="label">审核时间:</span>
          <span class="value">{{ formatDate(currentRecord.auditTime) }}</span>
        </div>
        <div class="detail-row" v-if="currentRecord.auditResult">
          <span class="label">审核结果:</span>
          <span class="value">{{ currentRecord.auditResult }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button v-if="currentRecord && currentRecord.borrowStatus === 1 && activeType === 'borrow'" type="success" @click="handleReturn(currentRecord)">
          归还
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showReturnDialog" title="归还设备" width="90%">
      <div class="return-form" v-if="returnRecord">
        <div class="return-info">
          <p><strong>设备名称：</strong>{{ returnRecord.equipmentName }}</p>
          <p><strong>借用数量：</strong>{{ returnRecord.borrowQuantity || returnRecord.quantity }}</p>
        </div>
        <el-form :model="returnForm" label-width="80px">
          <el-form-item label="归还数量">
            <el-input-number v-model="returnForm.returnQuantity" :min="1" :max="returnRecord.borrowQuantity || returnRecord.quantity" />
          </el-form-item>
          <el-form-item label="设备状态">
            <el-radio-group v-model="returnForm.equipmentStatus">
              <el-radio value="1">正常归还</el-radio>
              <el-radio value="2">故障需要报修</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="returnForm.remark" type="textarea" rows="2" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReturn">确认归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading, InfoFilled, Search } from '@element-plus/icons-vue'
import { websocketClient } from '@/utils/websocket'
import service from '@/api/request'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const records = ref([])
const activeType = ref('borrow')
const searchStatus = ref(null)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const showDetailDialog = ref(false)
const currentRecord = ref(null)
const showReturnDialog = ref(false)
const returnRecord = ref(null)

const returnForm = ref({
  returnQuantity: 1,
  equipmentStatus: '1',
  remark: ''
})

const defaultImage = require('@/assets/default_equipment.png')

const showTypeTabs = computed(() => {
  return !route.query.type
})

const title = computed(() => {
  if (route.query.type) {
    const types = {
      reserve: '我的预约',
      borrow: '我的借用',
      return: '我的归还',
      repair: '我的报修'
    }
    return types[route.query.type] || '操作记录'
  }
  return '操作记录'
})

const detailTitle = computed(() => {
  if (!currentRecord.value) return '详情'
  return currentRecord.value.equipmentName
})

const statusOptions = computed(() => {
  const options = {
    reserve: [
      { label: '全部', value: -1 },
      { label: '待审核', value: 0 },
      { label: '已通过', value: 1 },
      { label: '已过期', value: 4 },
      { label: '已拒绝', value: 2 },
      { label: '已取消', value: 3 }
    ],
    borrow: [
      { label: '全部', value: -1 },
      { label: '待审核', value: 0 },
      { label: '已借出', value: 1 },
      { label: '已完成', value: 2 },
      { label: '已逾期', value: 5 },
      { label: '已取消', value: 3 },
      { label: '已拒绝', value: 4 }
    ],
    return: [
      { label: '全部', value: -1 },
      { label: '待审核', value: 0 },
      { label: '已归还', value: 1 },
      { label: '已拒绝', value: 2 }
    ],
    repair: [
      { label: '全部', value: -1 },
      { label: '待审核', value: 0 },
      { label: '报修中', value: 1 },
      { label: '已维修', value: 2 },
      { label: '已拒绝', value: 3 },
      { label: '已取消', value: 4 }
    ]
  }
  return options[activeType.value] || []
})

const goBack = () => {
  router.back()
}

const handleTypeChange = () => {
  searchStatus.value = null
  searchKeyword.value = ''
  currentPage.value = 1
  loadRecords()
}

const loadRecords = async () => {
  loading.value = true
  records.value = []
  
  try {
    let api = ''
    let statusParam = null
    if (searchStatus.value !== null && searchStatus.value !== -1) {
      statusParam = searchStatus.value
    }
    
    switch (activeType.value) {
      case 'reserve':
        api = '/lifecycle/reserve/user/list'
        break
      case 'borrow':
        api = '/lifecycle/borrow/user/list'
        break
      case 'return':
        api = '/lifecycle/return/user/list'
        break
      case 'repair':
        api = '/lifecycle/repair/user/list'
        break
    }
    
    const res = await service.get(api, {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: statusParam,
        keyword: searchKeyword.value || undefined
      }
    })
    if (res.code === 200 && res.data) {
      records.value = res.data.records || res.data
      total.value = res.data.total || 0
    }
  } catch (err) {
    console.error('加载记录失败:', err)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusType = (item) => {
  if (activeType.value === 'reserve') {
    const status = item.reserveStatus
    if (item.isExtension !== 1 && item.reserveStatus === 1) {
      const reserveEndTime = new Date(item.reserveTime).getTime() + (item.reserveDuration || 1) * 60 * 60 * 1000
      if (reserveEndTime < Date.now()) {
        return 'info'
      }
    }
    if (status === 0) return 'warning'
    if (status === 1) return 'success'
    if (status === 2) return 'danger'
    if (status === 3) return 'info'
    if (status === 4) return 'info'
    return 'info'
  }
  if (activeType.value === 'borrow') {
    const status = item.borrowStatus
    if (status === 0) return 'warning'
    if (status === 1) return 'success'
    if (status === 2) return 'info'
    if (status === 3) return 'info'
    if (status === 4) return 'danger'
    if (status === 5) return 'danger'
    return 'info'
  }
  if (activeType.value === 'return') {
    const status = item.returnStatus
    if (status === 0) return 'warning'
    if (status === 1) return 'success'
    if (status === 2) return 'danger'
    return 'info'
  }
  if (activeType.value === 'repair') {
    const status = item.repairStatus
    if (status === 0) return 'warning'
    if (status === 1) return 'primary'
    if (status === 2) return 'success'
    if (status === 3) return 'danger'
    if (status === 4) return 'info'
    return 'info'
  }
  return 'info'
}

const getDisplayQuantity = (item) => {
  if (activeType.value === 'reserve') {
    return item.reserveQuantity || item.quantity || null
  }
  if (activeType.value === 'borrow') {
    return item.borrowQuantity || item.originalQuantity || item.quantity || null
  }
  if (activeType.value === 'return') {
    return item.originalBorrowQuantity || item.borrowQuantity || 1
  }
  if (activeType.value === 'repair') {
    return item.repairQuantity || item.quantity || null
  }
  return null
}

const getStatusText = (item) => {
  if (activeType.value === 'reserve') {
    const status = item.reserveStatus
    if (item.isExtension !== 1 && item.reserveStatus === 1) {
      const reserveEndTime = new Date(item.reserveTime).getTime() + (item.reserveDuration || 1) * 60 * 60 * 1000
      if (reserveEndTime < Date.now()) {
        return '已过期'
      }
    }
    if (status === 0) return '待审核'
    if (status === 1) return '已通过'
    if (status === 2) return '已拒绝'
    if (status === 3) return '已取消'
    if (status === 4) return '已过期'
    return '未知'
  }
  if (activeType.value === 'borrow') {
    const status = item.borrowStatus
    if (status === 0) return '待审核'
    if (status === 1) return '已借出'
    if (status === 2) return '已完成'
    if (status === 3) return '已取消'
    if (status === 4) return '已拒绝'
    if (status === 5) return '已逾期'
    return '未知'
  }
  if (activeType.value === 'return') {
    const status = item.returnStatus
    if (status === 0) return '待审核'
    if (status === 1) return '已归还'
    if (status === 2) return '已拒绝'
    return '未知'
  }
  if (activeType.value === 'repair') {
    const status = item.repairStatus
    if (status === 0) return '待审核'
    if (status === 1) return '报修中'
    if (status === 2) return '已维修'
    if (status === 3) return '已拒绝'
    if (status === 4) return '已取消'
    return '未知'
  }
  return '未知'
}

const getAuditType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'info'
  if (status === 3) return 'danger'
  return 'info'
}

const getAuditText = (status) => {
  if (status === 0) return '待审核'
  if (status === 1) return '已通过'
  if (status === 2) return '已取消'
  if (status === 3) return '已拒绝'
  return '未知'
}

const viewDetail = (item) => {
  currentRecord.value = item
  showDetailDialog.value = true
}

const handleReturn = (item) => {
  returnRecord.value = item
  returnForm.value = {
    returnQuantity: item.borrowQuantity || item.quantity || 1,
    equipmentStatus: '1',
    remark: ''
  }
  showDetailDialog.value = false
  showReturnDialog.value = true
}

const submitReturn = async () => {
  try {
    const res = await service.post('/lifecycle/return', {
      equipmentId: returnRecord.value.equipmentId,
      returnQuantity: returnForm.value.returnQuantity,
      equipmentStatus: returnForm.value.equipmentStatus,
      remark: returnForm.value.remark
    })
    if (res.code === 200) {
      ElMessage.success('归还申请提交成功')
      showReturnDialog.value = false
      loadRecords()
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

onMounted(() => {
  if (route.query.type) {
    activeType.value = route.query.type
  }
  loadRecords()
  websocketClient.on('reservation_refresh', handleWsMessage)
  websocketClient.on('borrow_refresh', handleWsMessage)
  websocketClient.on('return_refresh', handleWsMessage)
  websocketClient.on('repair_refresh', handleWsMessage)
})

const handleWsMessage = () => {
  loadRecords()
}

onUnmounted(() => {
  websocketClient.off('reservation_refresh', handleWsMessage)
  websocketClient.off('borrow_refresh', handleWsMessage)
  websocketClient.off('return_refresh', handleWsMessage)
  websocketClient.off('repair_refresh', handleWsMessage)
})
</script>

<style scoped>
.mobile-records-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  color: white;
  font-size: 20px;
}

.header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.filter-bar {
  background: white;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.type-tabs {
  margin-bottom: 10px;
}

.type-tabs .el-radio-group {
  width: 100%;
  display: flex;
}

.type-tabs .el-radio-button {
  flex: 1;
}

.filter-row {
  display: flex;
  align-items: center;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.empty .el-icon {
  margin-bottom: 10px;
}

.records-list {
  padding: 16px;
}

.record-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.equipment-thumb {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f7fa;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.equipment-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipment-number {
  font-size: 12px;
  color: #909399;
}

.status-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.record-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 13px;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.detail-item .label {
  color: #909399;
  margin-right: 4px;
  white-space: nowrap;
}

.detail-item .value {
  color: #606266;
}

.record-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

.pagination {
  padding: 16px;
  display: flex;
  justify-content: center;
  background: white;
}

.detail-content {
  padding: 10px 0;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  width: 100px;
  color: #909399;
  flex-shrink: 0;
}

.detail-row .value {
  flex: 1;
  color: #303133;
  word-break: break-all;
}

.return-form {
  padding: 10px 0;
}

.return-info {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.return-info p {
  margin: 6px 0;
  font-size: 14px;
}

@media (min-width: 768px) {
  .mobile-records-container {
    max-width: 500px;
    margin: 0 auto;
  }
  
  .records-list {
    padding: 20px;
  }
  
  :deep(.el-dialog) {
    max-width: 450px;
  }
}
</style>
