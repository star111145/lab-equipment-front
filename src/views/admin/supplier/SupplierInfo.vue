<template>
  <div class="supplier-info">
    <div class="page-header">
      <h2>供应商信息</h2>
      <p>管理供应商基本信息</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索供应商名称/联系人"
          clearable
          style="width: 300px"
          @input="getSupplierList"
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

      <div v-if="showManagement" class="management-bar" style="margin-bottom: 20px;">
        <el-button type="primary" @click="showExportDialog = true; exportAll = false">
          统计报表
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedRowIds.size === 0">
          批量删除 ({{ selectedRowIds.size }})
        </el-button>
        <el-button type="info" @click="handleSelectAll">全选当前页</el-button>
        <el-button type="info" @click="handleDeselectAll">取消全选</el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>添加供应商
        </el-button>
        <el-button type="info" @click="showManagement = false">
          返回
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="supplierList"
        style="width: 100%; margin-top: 20px"
        border
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement" type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="supplierName" label="供应商名称" width="200" />
        <el-table-column prop="supplierContact" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="address" label="地址" min-width="250" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createTime ? formatDate(row.createTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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
      v-model="showEditDialog"
      :title="isEdit ? '编辑供应商' : '添加供应商'"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="供应商名称" prop="supplierName">
          <el-input v-model="editForm.supplierName" />
        </el-form-item>
        <el-form-item label="联系人" prop="supplierContact">
          <el-input v-model="editForm.supplierContact" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="editForm.address" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showExportDialog"
      title="导出统计报表"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="text-align: center; padding: 20px 0;">
        <p style="margin-bottom: 20px; color: #666;">确定要导出供应商记录吗？</p>
        <el-checkbox v-model="exportAll" style="margin-bottom: 20px;">导出全部记录</el-checkbox>
        <br>
        <el-button type="primary" size="large" @click="handleExport">
          确认导出Excel
        </el-button>
      </div>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'

export default {
  name: 'SupplierInfo',
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const supplierList = ref([])
    const isEdit = ref(false)
    const showEditDialog = ref(false)
    const showExportDialog = ref(false)
    const exportAll = ref(false)
    const showManagement = ref(false)
    const tableRef = ref(null)
    const selectedRowIds = ref(new Set())
    const editFormRef = ref(null)

    const editForm = reactive({
      id: null,
      supplierName: '',
      supplierContact: '',
      phone: '',
      email: '',
      address: '',
      description: ''
    })

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    const getIndex = (index) => {
      return index + 1
    }

    const editRules = reactive({
      supplierName: [
        { required: true, message: '请输入供应商名称', trigger: 'blur' }
      ],
      supplierContact: [
        { required: true, message: '请输入联系人', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' }
      ]
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

    const getSupplierList = async () => {
      loading.value = true
      try {
        const res = await service.get('/supplier/list', {
          params: {
            current: pagination.current,
            size: pagination.size,
            keyword: searchText.value
          }
        })
        supplierList.value = res.data.records || []
        pagination.total = res.data.total || 0
      } catch (err) {
        console.error('获取供应商列表失败:', err)
        ElMessage.error('获取供应商列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleAdd = () => {
      isEdit.value = false
      editForm.id = null
      editForm.supplierName = ''
      editForm.supplierContact = ''
      editForm.phone = ''
      editForm.email = ''
      editForm.address = ''
      editForm.description = ''
      showEditDialog.value = true
    }

    const handleEdit = (row) => {
      isEdit.value = true
      editForm.id = row.id
      editForm.supplierName = row.supplierName
      editForm.supplierContact = row.supplierContact
      editForm.phone = row.phone
      editForm.email = row.email
      editForm.address = row.address
      editForm.description = row.description || ''
      showEditDialog.value = true
    }

    const handleEditSubmit = async () => {
      try {
        await editFormRef.value.validate()
        const url = isEdit.value ? `/supplier/${editForm.id}` : '/supplier'
        const method = isEdit.value ? 'put' : 'post'
        const res = await service[method](url, editForm)
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '更新供应商成功' : '添加供应商成功')
          showEditDialog.value = false
          getSupplierList()
        } else {
          ElMessage.error(res.msg || (isEdit.value ? '更新供应商失败' : '添加供应商失败'))
        }
      } catch (err) {
        console.error('操作失败:', err)
        ElMessage.error('操作失败')
      }
    }

    const handleExport = async () => {
      showExportDialog.value = false
      try {
        const params = new URLSearchParams()
        if (searchText.value) {
          params.append('keyword', searchText.value)
        }
        if (exportAll.value) {
          params.append('exportAll', 'true')
        } else {
          params.append('current', '1')
          params.append('size', pagination.size.toString())
        }
        
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        const response = await fetch(`/api/supplier/export?${params.toString()}`, {
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
        a.download = `供应商信息_${timestamp}.xlsx`
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

    const handleSelectionChange = (selection) => {
      selectedRowIds.value.clear()
      selection.forEach(row => {
        selectedRowIds.value.add(row.id)
      })
    }

    const handleSelectAll = () => {
      if (tableRef.value) {
        tableRef.value.toggleAllSelection()
      }
    }

    const handleDeselectAll = () => {
      if (tableRef.value) {
        tableRef.value.clearSelection()
      }
    }

    const handleBatchDelete = () => {
      if (selectedRowIds.value.size === 0) {
        ElMessage.warning('请先选择要删除的供应商')
        return
      }
      ElMessageBox.confirm(`确定要删除选中的 ${selectedRowIds.value.size} 个供应商吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const supplierIds = Array.from(selectedRowIds.value)
          const res = await service.delete(`/supplier/batch?ids=${supplierIds.join(',')}`)
          if (res.code === 200) {
            ElMessage.success('批量删除成功')
            selectedRowIds.value.clear()
            getSupplierList()
          } else {
            ElMessage.error(res.msg || '删除失败')
          }
        } catch (error) {
          console.error('Delete error:', error)
          ElMessage.error('删除失败，请稍后重试')
        }
      }).catch(() => {})
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该供应商吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await service.delete(`/supplier/${row.id}`)
          if (res.code === 200) {
            ElMessage.success('删除成功')
            getSupplierList()
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
      getSupplierList()
    }

    const handleCurrentChange = (val) => {
      pagination.current = val
      getSupplierList()
    }

    onMounted(() => {
      getSupplierList()
    })

    return {
      loading,
      searchText,
      supplierList,
      isEdit,
      showEditDialog,
      showExportDialog,
      showManagement,
      tableRef,
      selectedRowIds,
      editFormRef,
      editForm,
      pagination,
      editRules,
      getIndex,
      formatDate,
      getSupplierList,
      handleAdd,
      handleEdit,
      handleEditSubmit,
      handleDelete,
      handleExport,
      handleSelectionChange,
      handleSelectAll,
      handleDeselectAll,
      handleBatchDelete,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.supplier-info {
  padding: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 400px;
}

.page-header p {
  color: #606266;
  font-size: 14px;
}

.content {
  margin-top: 20px;
}

.management-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 15px;
  margin-top: 15px;
  margin-bottom: 20px;
  background: var(--bg-color);
  border-radius: 8px;
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
  
  .toolbar .el-input {
    width: 100% !important;
  }
  
  .toolbar .el-button {
    width: 100%;
  }
}
</style>
