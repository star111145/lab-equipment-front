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
      </div>

      <el-table
        v-loading="loading"
        :data="stockList"
        style="width: 100%; margin-top: 20px"
        border
      >
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
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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
      pagination,
      getIndex,
      formatDate,
      getWarehouseList,
      getStockList,
      handleSizeChange,
      handleCurrentChange
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
