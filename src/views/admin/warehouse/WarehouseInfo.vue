<template>
  <div class="warehouse-info">
    <div class="page-header">
      <h2>仓库信息</h2>
      <p>管理仓库基本信息</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索仓库名称/位置"
          clearable
          style="width: 300px"
          @input="getWarehouseList"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleAdd" style="margin-left: auto;">
          <el-icon><Plus /></el-icon>添加仓库
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="warehouseList"
        style="width: 100%; margin-top: 20px"
        border
      >
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="warehouseName" label="仓库名称" width="150" />
        <el-table-column prop="warehouseLocation" label="仓库位置" width="200" />
        <el-table-column prop="warehouseManagerName" label="管理员" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
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
      title="编辑仓库"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="仓库名称" prop="warehouseName">
          <el-input v-model="editForm.warehouseName" />
        </el-form-item>
        <el-form-item label="仓库位置" prop="warehouseLocation">
          <el-input v-model="editForm.warehouseLocation" />
        </el-form-item>
        <el-form-item label="管理员" prop="warehouseManagerId">
          <el-select v-model="editForm.warehouseManagerId" placeholder="请选择管理员" style="width: 100%">
            <el-option
              v-for="manager in managerList"
              :key="manager.id"
              :label="manager.label"
              :value="manager.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" />
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
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'
import { Search, Plus } from '@element-plus/icons-vue'

export default {
  name: 'WarehouseInfo',
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const showEditDialog = ref(false)
    const warehouseList = ref([])
    const managerList = ref([])
    const editFormRef = ref(null)

    const editForm = reactive({
      id: null,
      warehouseName: '',
      warehouseLocation: '',
      warehouseManagerId: null,
      phone: '',
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
      warehouseName: [
        { required: true, message: '请输入仓库名称', trigger: 'blur' }
      ],
      warehouseLocation: [
        { required: true, message: '请输入仓库位置', trigger: 'blur' }
      ]
    })

    const getManagerList = async () => {
      try {
        const res = await service.get('/user/managers')
        managerList.value = res.data || []
      } catch (err) {
        console.error('获取管理员列表失败:', err)
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }

    const getWarehouseList = async () => {
      loading.value = true
      try {
        const res = await service.get('/warehouse/list', {
          params: {
            current: pagination.current,
            size: pagination.size,
            keyword: searchText.value
          }
        })
        warehouseList.value = res.data.records
        pagination.total = res.data.total
      } catch (err) {
        console.error('获取仓库列表失败:', err)
        ElMessage.error('获取仓库列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleAdd = () => {
      editForm.id = null
      editForm.warehouseName = ''
      editForm.warehouseLocation = ''
      editForm.warehouseManagerId = null
      editForm.phone = ''
      editForm.description = ''
      showEditDialog.value = true
    }

    const handleEdit = (row) => {
      editForm.id = row.id
      editForm.warehouseName = row.warehouseName
      editForm.warehouseLocation = row.warehouseLocation
      editForm.warehouseManagerId = row.warehouseManagerId
      editForm.phone = row.phone || ''
      editForm.description = row.description || ''
      showEditDialog.value = true
    }

    const handleEditSubmit = async () => {
      try {
        await editFormRef.value.validate()
        if (editForm.id) {
          // 更新
          await service.put(`/warehouse/${editForm.id}`, editForm)
        } else {
          // 添加
          await service.post('/warehouse', editForm)
        }
        ElMessage.success(editForm.id ? '更新仓库成功' : '添加仓库成功')
        showEditDialog.value = false
        getWarehouseList()
      } catch (err) {
        console.error('保存仓库失败:', err)
        ElMessage.error('保存仓库失败')
      }
    }

    const handleDelete = async (row) => {
      ElMessageBox.confirm(`确定要删除仓库 "${row.warehouseName}" 吗？`, '警告', {
        type: 'warning'
      })
        .then(async () => {
          try {
            await service.delete(`/warehouse/${row.id}`)
            ElMessage.success('删除仓库成功')
            getWarehouseList()
          } catch (err) {
            console.error('删除仓库失败:', err)
            ElMessage.error('删除仓库失败')
          }
        })
        .catch(() => {})
    }

    const handleSizeChange = async (size) => {
      pagination.size = size
      await getWarehouseList()
    }

    const handleCurrentChange = async (current) => {
      pagination.current = current
      await getWarehouseList()
    }

    onMounted(() => {
      getWarehouseList()
      getManagerList()
    })

    return {
      loading,
      searchText,
      showEditDialog,
      warehouseList,
      managerList,
      editFormRef,
      editForm,
      pagination,
      editRules,
      getIndex,
      formatDate,
      getWarehouseList,
      getManagerList,
      handleAdd,
      handleEdit,
      handleEditSubmit,
      handleDelete,
      handleSizeChange,
      handleCurrentChange,
      Search,
      Plus
    }
  }
}
</script>

<style scoped>
.warehouse-info {
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

.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar .el-input {
    width: 100% !important;
  }
}
</style>
