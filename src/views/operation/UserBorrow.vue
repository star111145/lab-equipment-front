<template>
  <div class="user-borrow">
    <div class="page-header">
      <h2>我的借用</h2>
      <p>查看和管理我的设备借用记录</p>
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
        :data="borrowList"
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
        <el-table-column label="借用数量" width="100">
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
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button 
              v-if="row.borrowStatus === 1" 
              type="success" 
              size="small" 
              @click="handleReturn(row)"
            >归还</el-button>
            <el-button 
              v-if="row.borrowStatus === 1" 
              type="warning" 
              size="small" 
              @click="handleRepair(row)"
            >报修</el-button>
            <el-button 
              v-if="row.borrowStatus === 0" 
              type="danger" 
              size="small" 
              @click="handleCancel(row)"
            >取消</el-button>
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
          <el-descriptions-item label="审核状态">
            <el-tag :type="getAuditStatusType(viewForm.auditStatus)">
              {{ getAuditStatusText(viewForm.auditStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核人">{{ viewForm.auditUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ viewForm.auditTime ? formatDate(viewForm.auditTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核结果" :span="2">{{ viewForm.auditResult || '无' }}</el-descriptions-item>
        </el-descriptions>
        <template #footer>
          <el-button @click="showViewDialog = false">关闭</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showReturnDialog"
        title="归还设备"
        width="400px"
      >
        <el-form label-width="100px">
          <el-form-item label="设备名称">
            <span>{{ returnForm.equipmentName }}</span>
          </el-form-item>
          <el-form-item label="借用数量">
            <span>{{ returnForm.borrowQuantity }} 台</span>
          </el-form-item>
          <el-form-item label="归还数量" required>
            <el-input-number
              v-model="returnForm.returnQuantity"
              :min="1"
              :max="returnForm.borrowQuantity"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showReturnDialog = false">取消</el-button>
          <el-button type="primary" @click="submitReturn">确认归还</el-button>
        </template>
      </el-dialog>

      <el-dialog
        v-model="showRepairDialog"
        title="设备报修"
        width="600px"
      >
        <el-form
          ref="repairFormRef"
          :model="repairForm"
          :rules="repairRules"
          label-width="100px"
        >
          <el-form-item label="设备编号">
            <el-input v-model="repairForm.equipmentNumber" disabled />
          </el-form-item>
          <el-form-item label="设备名称">
            <el-input v-model="repairForm.equipmentName" disabled />
          </el-form-item>
          <el-form-item label="设备型号">
            <el-input v-model="repairForm.equipmentModel" disabled />
          </el-form-item>
          <el-form-item label="报修数量" prop="repairQuantity">
            <NumberInput
              v-model="repairForm.repairQuantity"
              :min="0"
              :max="repairForm.borrowQuantity"
            />
            <div class="form-tip" style="margin-top: 5px;margin-left: 7px;">
              <el-icon><InfoFilled /></el-icon>
              <span>不要超过借出数量</span>
            </div>
          </el-form-item>
          <el-form-item label="故障描述" prop="faultDescription">
            <el-input
              v-model="repairForm.faultDescription"
              type="textarea"
              :rows="3"
              placeholder="请描述设备故障情况"
            />
          </el-form-item>
          <el-form-item label="故障图片">
            <el-upload
              v-model:file-list="repairFileList"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleRepairFileChange"
              :on-exceed="handleRepairFileExceed"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              :limit="5"
              drag
              class="repair-upload"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                <em>点击或拖拽图片到此处上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持上传 PNG、JPG、JPEG、WEBP 格式图片（最多5张）
                </div>
              </template>
            </el-upload>
            <div v-if="repairForm.faultImageList && repairForm.faultImageList.length > 0" class="image-preview-list">
              <el-image
                v-for="(image, index) in repairForm.faultImageList"
                :key="index"
                :src="image"
                fit="contain"
                style="width: 80px; height: 80px; cursor: pointer"
                preview-teleported
              />
              <el-button
                type="danger"
                size="small"
                @click="clearRepairImage"
              >
                清空
              </el-button>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showRepairDialog = false">取消</el-button>
          <el-button type="primary" @click="submitRepair">提交报修</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import service from '@/api/request'
import { websocketClient } from '@/utils/websocket'
import NumberInput from '@/components/NumberInput.vue'

const defaultImage = require('@/assets/default_equipment.png')
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const borrowList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const searchStatus = ref(null)
const searchKeyword = ref('')

const showViewDialog = ref(false)
const viewForm = ref({})

const showReturnDialog = ref(false)
const returnForm = ref({
  id: null,
  equipmentName: '',
  borrowQuantity: 1,
  returnQuantity: 1
})

const showRepairDialog = ref(false)
const repairFormRef = ref()
const repairFileList = ref([])
const repairForm = ref({
  id: null,
  equipmentId: null,
  equipmentNumber: '',
  equipmentName: '',
  equipmentModel: '',
  borrowQuantity: 0,
  repairQuantity: 1,
  faultDescription: '',
  faultImageList: []
})
const repairRules = {
  repairQuantity: [
    { required: true, message: '请输入报修数量', trigger: 'blur' }
  ],
  faultDescription: [
    { required: true, message: '请描述故障情况', trigger: 'blur' }
  ]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await service.get('/lifecycle/borrow/user/list', {
      params: {
        current: currentPage.value,
        size: pageSize.value,
        status: searchStatus.value,
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

const handleReturn = (row) => {
  const originalQty = row.originalQuantity || row.borrowQuantity || 1
  const returnedQty = row.returnQuantity || 0
  const repairQty = originalQty - row.borrowQuantity - returnedQty
  const maxReturn = row.borrowQuantity
  returnForm.value = {
    id: row.id,
    equipmentName: row.equipmentName,
    borrowQuantity: maxReturn,
    returnQuantity: maxReturn,
    repairQuantity: repairQty > 0 ? repairQty : 0
  }
  showReturnDialog.value = true
}

const submitReturn = async () => {
  if (submitting.value) return
  if (returnForm.value.returnQuantity < 1) {
    ElMessage.error('归还数量不能小于1')
    return
  }
  if (returnForm.value.returnQuantity > returnForm.value.borrowQuantity) {
    ElMessage.error('归还数量不能超过借用数量')
    return
  }
  
  submitting.value = true
  try {
    const res = await service.put(`/lifecycle/borrow/${returnForm.value.id}/return`, {
      returnQuantity: returnForm.value.returnQuantity
    })
    if (res.code === 200) {
      ElMessage.success(res.data || '归还申请已提交，请等待管理员验收')
      showReturnDialog.value = false
      getList()
      router.push('/platform/user/return')
    } else {
      ElMessage.error(res.msg || '归还申请提交失败')
    }
  } catch (err) {
    console.error('归还失败:', err)
    ElMessage.error('归还申请提交失败')
  } finally {
    submitting.value = false
  }
}

const handleRepair = (row) => {
  repairForm.value = {
    id: row.id,
    equipmentId: row.equipmentId,
    equipmentNumber: row.equipmentNumber,
    equipmentName: row.equipmentName,
    equipmentModel: row.equipmentModel,
    borrowQuantity: row.borrowQuantity || 1,
    repairQuantity: row.borrowQuantity || 1,
    faultDescription: '',
    faultImageList: []
  }
  repairFileList.value = []
  showRepairDialog.value = true
}

const submitRepair = async () => {
  if (submitting.value) return
  if (!repairFormRef.value) return
  
  await repairFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      const res = await service.post('/lifecycle/repair', {
        equipmentId: repairForm.value.equipmentId,
        repairQuantity: repairForm.value.repairQuantity,
        faultDescription: repairForm.value.faultDescription,
        faultImageList: repairForm.value.faultImageList
      })
      if (res.code === 200) {
        ElMessage.success(res.data || '报修申请已提交，等待管理员审核')
        router.push('/platform/user/repair')
        showRepairDialog.value = false
        repairForm.value.faultImageList = []
        repairFileList.value = []
        getList()
      } else {
        ElMessage.error(res.msg || '报修申请提交失败')
      }
    } catch (err) {
      console.error('报修失败:', err)
      ElMessage.error('报修申请提交失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleRepairFileChange = async (file) => {
  if (!file.raw) return
  
  const formData = new FormData()
  formData.append('file', file.raw)
  
  try {
    const res = await service.post('/equipment/upload-fault-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (res.code === 200) {
      if (!repairForm.value.faultImageList) {
        repairForm.value.faultImageList = []
      }
      repairForm.value.faultImageList.push(res.data)
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(res.msg || '图片上传失败')
    }
  } catch (err) {
    console.error('图片上传失败:', err)
    ElMessage.error('图片上传失败')
  }
}

const handleRepairFileExceed = () => {
  ElMessage.warning(`最多只能上传 5 张图片，当前已上传 ${repairForm.value.faultImageList?.length || 0} 张`)
}

const clearRepairImage = () => {
  repairForm.value.faultImageList = []
  repairFileList.value = []
}

const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该借用申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await service.put(`/lifecycle/borrow/${row.id}/cancel`)
    if (res.code === 200) {
      ElMessage.success('已成功取消借用申请')
      getList()
    } else {
      ElMessage.error(res.msg || '取消借用申请失败')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('取消失败:', err)
      ElMessage.error('取消借用申请失败')
    }
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
        const res = await service.get(`/lifecycle/borrow/user/${borrowId}`)
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
    0: 'info',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'info'
}

onMounted(() => {
  getList()
  websocketClient.on('borrow_refresh', handleWsMessage)
  
  const borrowId = route.query.id
  if (borrowId) {
    handleView({ id: borrowId })
  }
})

const handleWsMessage = () => {
  getList()
}

onUnmounted(() => {
  websocketClient.off('borrow_refresh', handleWsMessage)
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
