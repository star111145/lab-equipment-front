<template>
  <div class="equipment-repair">
    <div class="page-header">
      <h2>报修管理</h2>
      <p>管理设备报修记录</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select v-model="searchStatus" placeholder="报修状态" clearable style="width: 150px" @change="getRepairList">
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="报修中" :value="1" />
          <el-option label="已维修" :value="2" />
          <el-option label="已拒绝" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
        <el-select
          v-model="searchAuditStatus"
          placeholder="审核状态"
          clearable
          style="width: 150px; margin-left: 20px;"
          @change="getRepairList"
        >
          <el-option label="全部" :value="-1" />
          <el-option label="待审核" :value="0" />
          <el-option label="已通过" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索设备编号/设备名称/报修人"
          clearable
          style="width: 300px; margin-left: 20px;"
          @input="getRepairList"
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
        <el-button type="success">
          导出Excel
        </el-button>
        <el-button type="primary">
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
        v-loading="loading"
        :data="repairList"
        style="width: 100%; margin-top: 20px"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement" type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="140" />
        <el-table-column prop="equipmentModel" label="设备型号" width="140" />
        <el-table-column prop="repairQuantity" label="报修数量" width="100" />
        <el-table-column prop="equipmentTypeName" label="设备类型" width="120" />
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
        <el-table-column prop="realName" label="报修人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="faultDescription" label="故障说明" min-width="200" />
        <el-table-column label="故障图片" width="100" align="center">
           <template #default="{ row }">
             <el-image
               v-if="row.faultImageList && row.faultImageList.length > 0"
               :src="row.faultImageList[0]"
               fit="cover"
               style="width: 60px; height: 60px; border-radius: 4px"
               :preview-src-list="row.faultImageList"
             />
             <span v-else>-</span>
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
        <el-table-column prop="repairTime" label="报修时间" width="180">
          <template #default="{ row }">
            {{ row.repairTime ? formatDate(row.repairTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <template v-if="isAdmin">
              <el-button v-if="row.auditStatus === 0" type="success" link @click="handleAudit(row, 1)">通过</el-button>
              <el-button v-if="row.auditStatus === 0" type="danger" link @click="handleAudit(row, 2)">拒绝</el-button>
              <el-button v-if="row.auditStatus === 1 && row.repairStatus === 1" type="primary" link @click="handleUpdateStatus(row)">更新状态</el-button>
              <el-button type="warning" link @click="handleCancel(row)">取消</el-button>
            </template>
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
          <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报修数量">{{ viewForm.repairQuantity || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ viewForm.equipmentTypeName || '-' }}</el-descriptions-item>
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
          <el-descriptions-item label="审核人">{{ viewForm.auditUserName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ viewForm.auditTime ? formatDate(viewForm.auditTime) : '-' }}</el-descriptions-item>
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
      v-model="showStatusDialog"
      title="更新维修状态"
      width="450px"
    >
      <div style="margin-bottom: 15px; color: #909399; font-size: 13px;">
        <p>• 已维修：维修完成，设备状态将恢复正常</p>
        <p>• 已拒绝：拒绝维修，需要填写原因</p>
      </div>
      <el-form
        ref="statusFormRef"
        :model="statusForm"
        :rules="statusRules"
        label-width="100px"
      >
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(statusForm.repairStatus)">
            {{ getStatusText(statusForm.repairStatus) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="更新状态" required prop="newStatus">
          <el-radio-group v-model="statusForm.newStatus">
            <el-radio :value="2">已维修</el-radio>
            <el-radio :value="3">已拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item 
          v-if="statusForm.newStatus === 3" 
          label="原因" 
          required 
          prop="reason"
        >
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="statusForm.newStatus === 3 ? '请输入拒绝原因' : '请输入取消原因'"
          />
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'
import { websocketClient } from '@/utils/websocket'

export default {
  name: 'EquipmentRepair',
  setup() {
    const route = useRoute()
    const loading = ref(false)
    const searchStatus = ref(null)
    const searchAuditStatus = ref(null)
    const searchKeyword = ref('')
    const showManagement = ref(false)
    const selectedRowIds = ref(new Set())
    const repairList = ref([])
    const isAdmin = ref(true)
    const defaultImage = require('@/assets/default_equipment.png')

    const showViewDialog = ref(false)
    const showStatusDialog = ref(false)
    const statusFormRef = ref(null)

    const viewForm = reactive({
      equipmentNumber: '',
      equipmentName: '',
      equipmentModel: '',
      equipmentTypeId: null,
      equipmentImage: '',
      repairQuantity: 0,
      realName: '',
      phone: '',
      faultDescription: '',
      faultImageList: [],
      repairStatus: 0,
      auditStatus: 0,
      auditResult: '',
      auditUserName: '',
      auditTime: '',
      repairTime: ''
    })

    const statusForm = reactive({
      id: null,
      repairStatus: 0,
      newStatus: 2,
      reason: ''
    })

    const statusRules = {
      newStatus: [{ required: true, message: '请选择更新状态', trigger: 'change' }],
      reason: [
        { required: true, message: '请输入原因', trigger: 'blur' },
        { min: 2, message: '原因至少2个字符', trigger: 'blur' }
      ]
    }

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
      const types = ['info', 'warning', 'success', 'danger', 'info']
      return types[status] || 'info'
    }

    const getStatusText = (status) => {
      const texts = ['待审核', '报修中', '已维修', '已拒绝', '已取消']
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
            status: searchStatus.value,
            auditStatus: searchAuditStatus.value,
            keyword: searchKeyword.value
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

    const handleSelectionChange = (selection) => {
      selectedRowIds.value = new Set(selection.map(item => item.id))
    }

    const handleSelectAll = () => {
      repairList.value.forEach(row => {
        selectedRowIds.value.add(row.id)
      })
      ElMessage.success(`已选择当前页 ${repairList.value.length} 条记录`)
    }

    const handleDeselectAll = () => {
      selectedRowIds.value.clear()
      ElMessage.success('已取消所有选择')
    }

    const handleView = async (row) => {
      if (row && row.id) {
        const repairId = row.id
        const found = repairList.value.find(item => item.id === repairId)
        if (found) {
          Object.assign(viewForm, found)
          showViewDialog.value = true
        } else {
          try {
            const res = await service.get(`/lifecycle/repair/${repairId}`)
            if (res.code === 200 && res.data) {
              Object.assign(viewForm, res.data)
              showViewDialog.value = true
            } else {
              ElMessage.error('获取报修详情失败')
            }
          } catch (err) {
            console.error('获取报修详情失败:', err)
            ElMessage.error('获取报修详情失败')
          }
        }
      } else {
        viewForm.equipmentNumber = row.equipmentNumber
        viewForm.equipmentName = row.equipmentName
        viewForm.equipmentModel = row.equipmentModel
        viewForm.equipmentTypeId = row.equipmentTypeId
        viewForm.equipmentTypeName = row.equipmentTypeName
        viewForm.equipmentImage = row.equipmentImage
        viewForm.repairQuantity = row.repairQuantity
        viewForm.realName = row.realName
        viewForm.phone = row.phone
        viewForm.faultDescription = row.faultDescription
        viewForm.faultImageList = row.faultImageList || []
        viewForm.repairStatus = row.repairStatus
        viewForm.auditStatus = row.auditStatus
        viewForm.auditResult = row.auditResult
        viewForm.auditUserName = row.auditUserName
        viewForm.auditTime = row.auditTime
        viewForm.repairTime = row.repairTime
        showViewDialog.value = true
      }
    }

    const handleAudit = (row, status) => {
      if (status === 1) {
        ElMessageBox.confirm(`确定要通过这条报修记录吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(async () => {
          try {
            const res = await service.put(`/lifecycle/repair/${row.id}/audit`, {
              auditStatus: status,
              auditResult: '已通过'
            })
            if (res.code === 200) {
              ElMessage.success(res.data?.message || '通过成功')
              if (res.data?.needRefresh) {
                getRepairList()
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
      } else {
        ElMessageBox.prompt('请输入拒绝理由：', '拒绝', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          inputPattern: /\S+/,
          inputErrorMessage: '拒绝理由不能为空'
        }).then(async ({ value }) => {
          try {
            const res = await service.put(`/lifecycle/repair/${row.id}/audit`, {
              auditStatus: status,
              auditResult: value
            })
            if (res.code === 200) {
              ElMessage.success(res.data?.message || '拒绝成功')
              if (res.data?.needRefresh) {
                getRepairList()
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

    const handleUpdateStatus = (row) => {
      statusForm.id = row.id
      statusForm.repairStatus = row.repairStatus
      statusForm.newStatus = 2
      statusForm.reason = ''
      showStatusDialog.value = true
    }

    const handleStatusSubmit = async () => {
      try {
        await statusFormRef.value.validate()
        
        const params = {
          status: statusForm.newStatus
        }
        if (statusForm.newStatus === 3) {
          params.reason = statusForm.reason
        }
        
        const res = await service.put(`/lifecycle/repair/${statusForm.id}/status`, null, {
          params
        })
        if (res.code === 200) {
          ElMessage.success(res.data?.message || '状态更新成功')
          showStatusDialog.value = false
          if (res.data?.needRefresh) {
            getRepairList()
          }
        } else {
          ElMessage.error(res.msg || '状态更新失败')
        }
      } catch (err) {
        console.error('状态更新失败:', err)
        ElMessage.error('状态更新失败')
      }
    }

    const handleCancel = (row) => {
      ElMessageBox.prompt('请输入取消原因', '取消报修', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        inputPattern: /.+/,
        inputErrorMessage: '请输入取消原因'
      }).then(async ({ value }) => {
        try {
          const res = await service.put(`/lifecycle/repair/${row.id}/status`, null, {
            params: { status: 4, reason: value }
          })
          if (res.code === 200) {
            ElMessage.success('取消成功')
            getRepairList()
          } else {
            ElMessage.error(res.msg || '取消失败')
          }
        } catch (err) {
          console.error('取消失败:', err)
          ElMessage.error('取消失败')
        }
      }).catch(() => {})
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
      document.addEventListener('visibilitychange', handleVisibilityChange)
      websocketClient.on('repair_refresh', handleWsMessage)
      
      const repairId = route.query.id
      if (repairId) {
        handleView({ id: repairId })
      }
    })

    const handleWsMessage = () => {
      getRepairList()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getRepairList()
      }
    }

    onUnmounted(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      websocketClient.off('repair_refresh', handleWsMessage)
    })

    return {
      loading,
      searchStatus,
      searchAuditStatus,
      searchKeyword,
      showManagement,
      selectedRowIds,
      repairList,
      isAdmin,
      defaultImage,
      showViewDialog,
      showStatusDialog,
      statusFormRef,
      statusRules,
      viewForm,
      statusForm,
      pagination,
      formatDate,
      getStatusType,
      getStatusText,
      handleImageError,
      getRepairList,
      handleSelectionChange,
      handleSelectAll,
      handleDeselectAll,
      handleView,
      handleAudit,
      handleVisibilityChange,
      handleWsMessage,
      handleUpdateStatus,
      handleStatusSubmit,
      handleCancel,
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
  gap: 12px;
  align-items: center;
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
