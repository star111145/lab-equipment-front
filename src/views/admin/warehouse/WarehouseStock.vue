<template>
  <div class="warehouse-stock">
    <div class="page-header">
      <h2>出入库记录</h2>
      <p>管理仓库出入库记录</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select v-model="searchType" placeholder="类型" clearable style="width: 120px" @change="getStockList">
          <el-option label="入库" value="in" />
          <el-option label="出库" value="out" />
        </el-select>
        <el-select v-model="searchWarehouse" placeholder="仓库" clearable style="width: 150px" @change="getStockList">
          <el-option v-for="warehouse in warehouseList" :key="warehouse.id" :label="warehouse.warehouseName" :value="warehouse.id" />
        </el-select>
        <el-input
          v-model="searchEquipment"
          placeholder="搜索设备名称/编号"
          clearable
          style="width: 200px"
          @input="getStockList"
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
        <el-button type="info" @click="showManagement = false">
          返回
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="stockList"
        style="width: 100%; margin-top: 20px"
        border
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement" type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="warehouseName" label="仓库名称" width="150" />
        <el-table-column prop="supplierName" label="供应商名称" width="150" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="typeText" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.recordType === 1 ? 'success' : 'danger'">
              {{ row.typeText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="200" />
        <el-table-column prop="createTime" label="操作时间" width="180">
          <template #default="{ row }">
            {{ row.createTime ? formatDate(row.createTime) : '-' }}
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
      v-model="showExportDialog"
      title="导出统计报表"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="text-align: center; padding: 20px 0;">
        <p style="margin-bottom: 20px; color: #666;">确定要导出库存记录吗？</p>
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
  name: 'WarehouseStock',
  setup() {
    const loading = ref(false)
    const searchType = ref(null)
    const searchWarehouse = ref(null)
    const searchEquipment = ref('')
    const stockList = ref([])
    const warehouseList = ref([])
    const showExportDialog = ref(false)
    const exportAll = ref(false)
    const showManagement = ref(false)
    const tableRef = ref(null)
    const selectedRowIds = ref(new Set())
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

    const getWarehouseList = async () => {
      try {
        const res = await service.get('/warehouse/all')
        warehouseList.value = res.data || []
      } catch (err) {
        console.error('获取仓库列表失败:', err)
      }
    }

    const getStockList = async () => {
      loading.value = true
      try {
        const res = await service.get('/warehouse/record/list', {
          params: {
            current: pagination.current,
            size: pagination.size,
            recordType: searchType.value === 'in' ? 1 : searchType.value === 'out' ? 2 : undefined,
            warehouseId: searchWarehouse.value,
            keyword: searchEquipment.value
          }
        })
        stockList.value = res.data.records || []
        pagination.total = res.data.total || 0
      } catch (err) {
        console.error('获取出入库记录失败:', err)
        ElMessage.error('获取出入库记录失败')
      } finally {
        loading.value = false
      }
    }

    const handleSizeChange = (val) => {
      pagination.size = val
      getStockList()
    }

    const handleCurrentChange = (val) => {
      pagination.current = val
      getStockList()
    }

    // 获取序号（考虑分页）
    const getIndex = (index) => {
      return (pagination.current - 1) * pagination.size + index + 1
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
        ElMessage.warning('请先选择要删除的记录')
        return
      }
      ElMessageBox.confirm(`确定要删除选中的 ${selectedRowIds.value.size} 条出入库记录吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const recordIds = Array.from(selectedRowIds.value)
          const res = await service.delete(`/warehouse/record/batch?ids=${recordIds.join(',')}`)
          if (res.code === 200) {
            ElMessage.success('批量删除成功')
            selectedRowIds.value.clear()
            getStockList()
          } else {
            ElMessage.error(res.msg || '删除失败')
          }
        } catch (error) {
          console.error('Delete error:', error)
          ElMessage.error('删除失败，请稍后重试')
        }
      }).catch(() => {})
    }

    const handleExport = async () => {
      showExportDialog.value = false
      try {
        const params = new URLSearchParams()
        if (searchType.value) {
          params.append('type', searchType.value)
        }
        if (searchWarehouse.value) {
          params.append('warehouseId', searchWarehouse.value)
        }
        if (searchEquipment.value) {
          params.append('keyword', searchEquipment.value)
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
        const response = await fetch(`/api/warehouse/stock/export?${params.toString()}`, {
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
        a.download = `库存记录_${timestamp}.xlsx`
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

    onMounted(() => {
      getWarehouseList()
      getStockList()
    })

    return {
      loading,
      searchType,
      searchWarehouse,
      searchEquipment,
      stockList,
      warehouseList,
      showExportDialog,
      showManagement,
      tableRef,
      selectedRowIds,
      pagination,
      getIndex,
      formatDate,
      getWarehouseList,
      getStockList,
      handleSizeChange,
      handleCurrentChange,
      handleExport,
      handleSelectionChange,
      handleSelectAll,
      handleDeselectAll,
      handleBatchDelete
    }
  }
}
</script>

<style scoped>
.warehouse-stock {
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
  
  .toolbar .el-input,
  .toolbar .el-select {
    width: 100% !important;
  }
}
</style>
