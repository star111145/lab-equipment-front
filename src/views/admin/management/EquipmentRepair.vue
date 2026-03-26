<template>
  <div class="equipment-repair">
    <div class="page-header">
      <h2>设备报修</h2>
      <p>管理设备报修记录</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select v-model="searchStatus" placeholder="报修状态" clearable style="width: 150px" @change="getRepairList">
          <el-option label="待审核" :value="0" />
          <el-option label="报修中" :value="1" />
          <el-option label="维修中" :value="2" />
          <el-option label="已完成" :value="3" />
          <el-option label="已拒绝" :value="4" />
        </el-select>
      </div>

      <el-table
        v-loading="loading"
        :data="repairList"
        style="width: 100%; margin-top: 20px"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="equipmentImage" label="设备图片" width="100">
          <template #default="{ row }">
            <el-avatar
              v-if="row.equipmentImage && row.equipmentImage !== ''"
              :src="row.equipmentImage"
              size="large"
              shape="square"
              class="equipment-avatar"
              @error="handleImageError"
            />
            <el-avatar
              v-else
              size="large"
              shape="square"
              :src="defaultImage"
              class="equipment-avatar"
            />
          </template>
        </el-table-column>
        <el-table-column prop="realName" label="报修人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="faultDescription" label="故障说明" min-width="200" />
        <el-table-column prop="faultImage" label="故障图片" width="100">
          <template #default="{ row }">
            <el-avatar
              v-if="row.faultImageList && row.faultImageList.length > 0"
              :src="row.faultImageList[0]"
              size="large"
              shape="square"
              class="equipment-avatar"
              @error="handleImageError"
            />
            <el-avatar
              v-else
              size="large"
              shape="square"
              :src="defaultImage"
              class="equipment-avatar"
            />
          </template>
        </el-table-column>
        <el-table-column prop="repairStatus" label="报修状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.repairStatus)">
              {{ getStatusText(row.repairStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditStatus" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : 'warning'">
              {{ row.auditStatus === 1 ? '已通过' : row.auditStatus === 2 ? '已拒绝' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="repairTime" label="报修时间" width="180">
          <template #default="{ row }">
            {{ row.repairTime ? formatDate(row.repairTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <template v-if="isAdmin">
              <el-button v-if="row.auditStatus === 0" type="success" link @click="handleAudit(row)">审核</el-button>
              <el-button v-if="row.repairStatus === 1 || row.repairStatus === 2" type="warning" link @click="handleUpdateStatus(row)">更新状态</el-button>
            </template>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog
      v-model="showViewDialog"
      title="报修详情"
      width="600px"
    >
      <div class="dialog-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ viewForm.equipmentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报修人">{{ viewForm.realName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ viewForm.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报修状态">
            <el-tag :type="getStatusType(viewForm.repairStatus)">
              {{ getStatusText(viewForm.repairStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="viewForm.auditStatus === 1 ? 'success' : viewForm.auditStatus === 2 ? 'danger' : 'warning'">
              {{ viewForm.auditStatus === 1 ? '已通过' : viewForm.auditStatus === 2 ? '已拒绝' : '待审核' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报修时间">{{ viewForm.repairTime ? formatDate(viewForm.repairTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核结果">{{ viewForm.auditResult || '-' }}</el-descriptions-item>
          <el-descriptions-item label="故障说明" :span="2">{{ viewForm.faultDescription || '-' }}</el-descriptions-item>
          <el-descriptions-item label="故障图片" :span="2">
            <div v-if="viewForm.faultImageList && viewForm.faultImageList.length > 0" class="image-section">
              <el-image
                v-for="(image, index) in viewForm.faultImageList"
                :key="index"
                :src="image"
                fit="contain"
                style="max-width: 100px; max-height: 100px"
                preview-teleported
              />
            </div>
            <div v-else class="no-image">
              暂无故障图片
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showAuditDialog"
      title="审核报修"
      width="500px"
    >
      <el-form
        ref="auditFormRef"
        :model="auditForm"
        label-width="100px"
      >
        <el-form-item label="设备编号">
          <el-input v-model="auditForm.equipmentNumber" disabled />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="auditForm.equipmentName" disabled />
        </el-form-item>
        <el-form-item label="故障说明">
          <el-input v-model="auditForm.faultDescription" type="textarea" :rows="3" disabled />
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="auditForm.auditStatus">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input v-model="auditForm.auditResult" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAuditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAuditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showStatusDialog"
      title="更新维修状态"
      width="400px"
    >
      <el-form
        ref="statusFormRef"
        :model="statusForm"
        label-width="100px"
      >
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusForm.repairStatus)">
            {{ getStatusText(statusForm.repairStatus) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="更新状态" required>
          <el-radio-group v-model="statusForm.newStatus">
            <el-radio :value="2">维修中</el-radio>
            <el-radio :value="3">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="handleStatusSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'

export default {
  name: 'EquipmentRepair',
  setup() {
    const loading = ref(false)
    const searchStatus = ref(null)
    const repairList = ref([])
    const isAdmin = ref(true)
    const defaultImage = require('@/assets/default_equipment.png')

    const showViewDialog = ref(false)
    const showAuditDialog = ref(false)
    const showStatusDialog = ref(false)
    const auditFormRef = ref(null)
    const statusFormRef = ref(null)

    const viewForm = reactive({
      equipmentNumber: '',
      equipmentName: '',
      realName: '',
      phone: '',
      faultDescription: '',
      faultImageList: [],
      repairStatus: 0,
      auditStatus: 0,
      auditResult: '',
      repairTime: ''
    })

    const auditForm = reactive({
      id: null,
      equipmentNumber: '',
      equipmentName: '',
      faultDescription: '',
      auditStatus: 1,
      auditResult: ''
    })

    const statusForm = reactive({
      id: null,
      repairStatus: 0,
      newStatus: 2
    })

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    const formatDate = (date) => {
      if (!date) return '-'
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    }

    const getStatusType = (status) => {
      const types = ['warning', 'info', 'primary', 'success', 'danger']
      return types[status] || 'info'
    }

    const getStatusText = (status) => {
      const texts = ['待审核', '报修中', '维修中', '已完成', '已拒绝']
      return texts[status] || '未知'
    }

    const handleImageError = () => {
      // 图片加载失败时使用默认图片
    }

    const getRepairList = async () => {
      loading.value = true
      try {
        const res = await service.get('/lifecycle/repair/list', {
          params: {
            current: pagination.current,
            size: pagination.size,
            repairStatus: searchStatus.value
          }
        })
        repairList.value = res.data.records
        pagination.total = res.data.total
      } catch (err) {
        console.error('获取报修列表失败:', err)
        ElMessage.error('获取报修列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleView = (row) => {
      viewForm.equipmentNumber = row.equipmentNumber
      viewForm.equipmentName = row.equipmentName
      viewForm.realName = row.realName
      viewForm.phone = row.phone
      viewForm.faultDescription = row.faultDescription
      viewForm.faultImageList = row.faultImageList || []
      viewForm.repairStatus = row.repairStatus
      viewForm.auditStatus = row.auditStatus
      viewForm.auditResult = row.auditResult
      viewForm.repairTime = row.repairTime
      showViewDialog.value = true
    }

    const handleAudit = (row) => {
      auditForm.id = row.id
      auditForm.equipmentNumber = row.equipmentNumber
      auditForm.equipmentName = row.equipmentName
      auditForm.faultDescription = row.faultDescription
      auditForm.auditStatus = 1
      auditForm.auditResult = ''
      showAuditDialog.value = true
    }

    const handleAuditSubmit = async () => {
      try {
        const res = await service.put(`/lifecycle/repair/${auditForm.id}/audit`, {
          auditStatus: auditForm.auditStatus,
          auditResult: auditForm.auditResult
        })
        if (res.code === 200) {
          ElMessage.success('审核成功')
          showAuditDialog.value = false
          getRepairList()
        } else {
          ElMessage.error(res.msg || '审核失败')
        }
      } catch (err) {
        console.error('审核失败:', err)
        ElMessage.error('审核失败')
      }
    }

    const handleUpdateStatus = (row) => {
      statusForm.id = row.id
      statusForm.repairStatus = row.repairStatus
      statusForm.newStatus = row.repairStatus === 1 ? 2 : 3
      showStatusDialog.value = true
    }

    const handleStatusSubmit = async () => {
      try {
        const res = await service.put(`/lifecycle/repair/${statusForm.id}/status`, null, {
          params: {
            status: statusForm.newStatus
          }
        })
        if (res.code === 200) {
          ElMessage.success('状态更新成功')
          showStatusDialog.value = false
          getRepairList()
        } else {
          ElMessage.error(res.msg || '状态更新失败')
        }
      } catch (err) {
        console.error('状态更新失败:', err)
        ElMessage.error('状态更新失败')
      }
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除这条报修记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await service.delete(`/lifecycle/repair/${row.id}`)
          if (res.code === 200) {
            ElMessage.success('删除成功')
            getRepairList()
          } else {
            ElMessage.error(res.msg || '删除失败')
          }
        } catch (err) {
          console.error('删除失败:', err)
          ElMessage.error('删除失败')
        }
      })
    }

    const handleSizeChange = (val) => {
      pagination.size = val
      getRepairList()
    }

    const handleCurrentChange = (val) => {
      pagination.current = val
      getRepairList()
    }

    onMounted(() => {
      getRepairList()
    })

    return {
      loading,
      searchStatus,
      repairList,
      isAdmin,
      defaultImage,
      showViewDialog,
      showAuditDialog,
      showStatusDialog,
      auditFormRef,
      statusFormRef,
      viewForm,
      auditForm,
      statusForm,
      pagination,
      formatDate,
      getStatusType,
      getStatusText,
      handleImageError,
      getRepairList,
      handleView,
      handleAudit,
      handleAuditSubmit,
      handleUpdateStatus,
      handleStatusSubmit,
      handleDelete,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.equipment-repair {
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
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar .el-input,
  .toolbar .el-select {
    width: 100% !important;
  }
}

.equipment-avatar {
  border: 1px solid #dcdfe6;
}

.dialog-content {
  padding: 10px 0;
}

.image-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}

.no-image {
  color: #909399;
  font-size: 14px;
  padding: 20px;
  text-align: center;
}
</style>
