<template>
  <div class="equipment-list">
    <div class="page-header">
      <h2>查找设备</h2>
      <p>浏览和搜索所有设备</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-select
          v-model="searchType"
          placeholder="设备类型"
          clearable
          style="width: 150px"
          @change="getEquipmentList"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="type in equipmentTypeList"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>
        <el-input
          v-model="searchText"
          placeholder="搜索设备编号/设备名称"
          clearable
          style="width: 300px; margin-left: 20px;"
          @input="getEquipmentList"
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

      <div v-if="showManagement && isAdmin" class="management-bar">
        <el-button type="primary" @click="handleExport" :disabled="selectedRowIds.size === 0">
          导出Excel
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
        :data="equipmentList"
        style="width: 100%; margin-top: 20px"
        border
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement" type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="120" />
        <el-table-column prop="equipmentName" label="设备名称" width="150" />
        <el-table-column prop="description" label="设备描述" width="200" />
         <el-table-column prop="equipmentImage" label="设备图片" width="100">
          <template #default="{ row }">
            <el-avatar
              v-if="row.equipmentImage && row.equipmentImage !== '' && row.equipmentImage !== '未设置'"
              :src="row.equipmentImage"
              size="large"
              shape="square"
              class="equipment-avatar"
              @error="handleImageError(row)"
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
        <el-table-column prop="equipmentType" label="设备类型" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getEquipmentTypeColor(row.equipmentTypeId)"
              size="small" 
              disable-transitions
            >
              {{ getEquipmentTypeText(row.equipmentTypeId) || row.equipmentType || '未设置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="equipmentStatus" label="设备状态" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.equipmentStatus)"
              disable-transitions
            >
              {{ getStatusText(row.equipmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="equipmentLocation" label="设备位置" width="120" />
        <el-table-column prop="supplier" label="供应商" width="150">
          <template #default="{ row }">
            <span>{{ row.supplier || '未设置' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="availableQuantity" label="可用数量" width="100" />
        <el-table-column prop="stockQuantity" label="库存数量" width="100" />
        <el-table-column label="二维码" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewQRCode(row.id)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button 
              v-if="row.availableQuantity > 0" 
              type="success" 
              link 
              @click="handleBorrow(row)"
            >借用</el-button>
            <el-button 
              v-else 
              type="success" 
              link 
              disabled
            >借用</el-button>
            <el-button type="warning" link @click="handleRepair(row)">报修</el-button>
            <template v-if="isAdmin">
              <el-button type="info" link @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
      title="设备详情"
      width="600px"
    >
      <div class="dialog-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ viewForm.equipmentNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ viewForm.equipmentName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">
            <el-tag 
              :type="getEquipmentTypeColor(viewForm.equipmentTypeId)"
              size="small" 
              disable-transitions
            >
              {{ getEquipmentTypeText(viewForm.equipmentTypeId) || viewForm.equipmentType || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag 
              :type="getStatusType(viewForm.equipmentStatus)"
              disable-transitions
            >
              {{ getStatusText(viewForm.equipmentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备位置">{{ viewForm.equipmentLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="库存数量">{{ viewForm.stockQuantity || 0 }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ viewForm.supplier || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="设备图片">
          <div class="avatar-section">
            <el-avatar
              v-if="viewForm.equipmentImage && viewForm.equipmentImage !== '' && viewForm.equipmentImage !== '未设置'"
              :src="viewForm.equipmentImage"
              size="large"
              shape="square"
              class="equipment-avatar"
              @error="handleImageError(null)"
            />
            <el-avatar
              v-else
              size="large"
              shape="square"
              :src="defaultImage"
              class="equipment-avatar"
            />
          </div>
        </el-descriptions-item>
         <el-descriptions-item label="设备描述">{{ viewForm.description || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="qrcode-section" v-if="viewForm.qrcodeUrl">
          <h4>设备二维码</h4>
          <div class="qrcode-container">
            <img :src="viewForm.qrcodeUrl" alt="设备二维码" class="qrcode-image" />
          </div>
        </div>
        
      </div>
    </el-dialog>

    <el-dialog
      v-model="showEditDialog"
      title="编辑设备"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="设备编号" prop="equipmentNumber">
          <el-input v-model="editForm.equipmentNumber" disabled />
        </el-form-item>
        <el-form-item label="设备名称" prop="equipmentName">
          <el-input v-model="editForm.equipmentName" />
        </el-form-item>
        <el-form-item label="设备类型" prop="equipmentType">
          <el-input v-model="editForm.equipmentType" />
        </el-form-item>
        <el-form-item label="设备状态" prop="equipmentStatus">
          <el-radio-group v-model="editForm.equipmentStatus">
            <el-radio :value="0">维修中</el-radio>
            <el-radio :value="1">空闲</el-radio>
            <el-radio :value="2">被预约</el-radio>
            <el-radio :value="3">已借用</el-radio>
            <el-radio :value="4">故障</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="设备位置" prop="equipmentLocation">
          <el-input v-model="editForm.equipmentLocation" />
        </el-form-item>
        <el-form-item label="库存数量" prop="stockQuantity">
          <el-input-number v-model="editForm.stockQuantity" :min="0" />
        </el-form-item>
        <el-form-item label="设备图片" prop="equipmentImage">
          <div class="avatar-upload-container">
            <div class="avatar-preview-box">
              <el-avatar
                v-if="editForm.equipmentImage && editForm.equipmentImage !== '' && editForm.equipmentImage !== '未设置'"
                :src="editForm.equipmentImage"
                size="large"
                shape="square"
                class="equipment-avatar"
                @error="handleImageError(null)"
              />
              <el-avatar
                v-else
                size="large"
                shape="square"
                :src="defaultImage"
                class="equipment-avatar"
              />
            </div>
            <div class="avatar-actions">
               <div class="upload-hint">
                <el-icon><InfoFilled /></el-icon>
                <span>支持上传 PNG、JPG、JPEG、WEBP 格式图片</span>
              </div>
              <el-upload
                  v-model:file-list="fileList"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileChange"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  :limit="1"
                  class="upload-btn"
                >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>选择图片</el-button>
              </el-upload>
              <el-button
                v-if="editForm.equipmentImage && editForm.equipmentImage !== '' && editForm.equipmentImage !== '未设置'"
                type="danger"
                size="small"
                @click="clearImage"
              >
                清除
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="设备描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showBorrowDialog"
      title="借用设备"
      width="500px"
    >
      <el-form
        :model="borrowForm"
        label-width="100px"
      >
        <el-form-item label="设备编号">
          <el-input v-model="borrowForm.equipmentNumber" disabled />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="borrowForm.equipmentName" disabled />
        </el-form-item>
        <el-form-item label="借用数量">
          <el-input-number v-model="borrowForm.quantity" :min="1" :max="borrowForm.availableQuantity" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="borrowForm.realName" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="borrowForm.phone" />
        </el-form-item>
        <el-form-item label="借用理由">
          <el-input v-model="borrowForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBorrowDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBorrowSubmit">确定</el-button>
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
          </div>
          <div v-if="repairForm.faultImageList && repairForm.faultImageList.length > 0" class="image-actions">
            <el-button
              type="danger"
              size="small"
              @click="clearRepairImage"
            >
              清除图片
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="故障描述" prop="faultDescription">
          <el-input v-model="repairForm.faultDescription" type="textarea" :rows="3" placeholder="请描述设备故障情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRepairSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'
import { Search, UploadFilled } from '@element-plus/icons-vue'

export default {
  name: 'EquipmentList',
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const searchType = ref('')
    const equipmentTypeList = ref([])
    const showEditDialog = ref(false)
    const showViewDialog = ref(false)
    const showBorrowDialog = ref(false)
    const showRepairDialog = ref(false)
    const equipmentList = ref([])
    const editFormRef = ref(null)
    const repairFormRef = ref(null)
    const isAdmin = ref(true)
    const showManagement = ref(false)
    const tableRef = ref(null)
    const selectedRowIds = ref(new Set())
    const fileList = ref([])
    const repairFileList = ref([])
    const defaultImage = require('@/assets/default_equipment.png')

    const editForm = reactive({
      id: null,
      equipmentNumber: '',
      equipmentName: '',
      equipmentType: '',
      equipmentTypeId: null,
      equipmentStatus: 1,
      equipmentLocation: '',
      stockQuantity: 0,
      description: '',
      supplier: '',
      equipmentImage: '',
      qrcodeUrl: ''
    })

    const viewForm = reactive({
      equipmentNumber: '',
      equipmentName: '',
      equipmentType: '',
      equipmentTypeId: null,
      equipmentStatus: 1,
      equipmentLocation: '',
      stockQuantity: 0,
      equipmentCreateTime: '',
      description: '',
      supplier: '',
      equipmentImage: '',
      qrcodeUrl: ''
    })

    const borrowForm = reactive({
      id: null,
      equipmentNumber: '',
      equipmentName: '',
      quantity: 1,
      availableQuantity: 0,
      realName: '',
      phone: '',
      reason: ''
    })

    const repairForm = reactive({
      id: null,
      equipmentNumber: '',
      equipmentName: '',
      faultDescription: '',
      faultImageList: []
    })

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    const editRules = reactive({
      equipmentName: [
        { required: true, message: '请输入设备名称', trigger: 'blur' }
      ],
      equipmentStatus: [
        { required: true, message: '请选择设备状态', trigger: 'change' }
      ]
    })

    const repairRules = reactive({
      faultDescription: [
        { required: true, message: '请描述故障情况', trigger: 'blur' }
      ]
    })

    const getEquipmentList = async () => {
      loading.value = true
      try {
        const res = await service.get('/equipment/list', {
          params: {
            current: pagination.current,
            size: pagination.size,
            keyword: searchText.value,
            equipmentType: searchType.value
          }
        })
        equipmentList.value = res.data.records
        pagination.total = res.data.total
      } catch (err) {
        console.error('获取设备列表失败:', err)
        ElMessage.error('获取设备列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleEdit = async (row) => {
      try {
        const res = await service.get(`/equipment/${row.id}`)
        editForm.id = res.data.id
        editForm.equipmentNumber = res.data.equipmentNumber
        editForm.equipmentName = res.data.equipmentName
        editForm.equipmentType = res.data.equipmentType
        editForm.equipmentTypeId = res.data.equipmentTypeId
        editForm.equipmentStatus = res.data.equipmentStatus
        editForm.equipmentLocation = res.data.equipmentLocation
        editForm.stockQuantity = res.data.stockQuantity
        editForm.description = res.data.description
        editForm.supplier = res.data.supplier || ''
        editForm.equipmentImage = res.data.equipmentImage || ''
        editForm.qrcodeUrl = res.data.qrcodeUrl || ''
        showEditDialog.value = true
      } catch (err) {
        console.error('获取设备详情失败:', err)
      }
    }

    const handleEditSubmit = async () => {
      try {
        await editFormRef.value.validate()
        const res = await service.put(`/equipment/${editForm.id}`, editForm)
        if (res.code === 200) {
          ElMessage.success('更新设备成功')
          showEditDialog.value = false
          getEquipmentList()
        } else {
          ElMessage.error(res.msg || '更新设备失败')
        }
      } catch (err) {
        console.error('更新设备失败:', err)
        ElMessage.error('更新设备失败')
      }
    }

    const handleView = (row) => {
      viewForm.equipmentNumber = row.equipmentNumber
      viewForm.equipmentName = row.equipmentName
      viewForm.equipmentType = row.equipmentType
      viewForm.equipmentTypeId = row.equipmentTypeId
      viewForm.equipmentStatus = row.equipmentStatus
      viewForm.equipmentLocation = row.equipmentLocation
      viewForm.stockQuantity = row.stockQuantity
      viewForm.equipmentCreateTime = row.equipmentCreateTime ? formatDate(row.equipmentCreateTime) : '-'
      viewForm.description = row.description
      viewForm.supplier = row.supplier || '未设置'
      viewForm.equipmentImage = row.equipmentImage || ''
      viewForm.qrcodeUrl = row.qrcodeUrl || ''
      showViewDialog.value = true
    }

    const handleBorrow = (row) => {
      borrowForm.id = row.id
      borrowForm.equipmentNumber = row.equipmentNumber
      borrowForm.equipmentName = row.equipmentName
      borrowForm.availableQuantity = row.availableQuantity || row.stockQuantity
      showBorrowDialog.value = true
    }

    const handleRepair = (row) => {
      repairForm.id = row.id
      repairForm.equipmentNumber = row.equipmentNumber
      repairForm.equipmentName = row.equipmentName
      repairForm.faultDescription = ''
      repairForm.faultImageList = []
      repairFileList.value = []
      showRepairDialog.value = true
    }

    const handleRepairSubmit = async () => {
      try {
        await repairFormRef.value.validate()
        const res = await service.post('/lifecycle/repair', {
          equipmentId: repairForm.id,
          faultDescription: repairForm.faultDescription,
          faultImageList: repairForm.faultImageList,
          repairQuantity: 1 // 默认报修数量为1
        })
        if (res.code === 200) {
          ElMessage.success('报修申请提交成功')
          showRepairDialog.value = false
          repairForm.faultImageList = []
          repairFileList.value = []
        } else {
          ElMessage.error(res.msg || '报修申请提交失败')
        }
      } catch (err) {
        console.error('报修申请提交失败:', err)
        ElMessage.error('报修申请提交失败')
      }
    }

    const handleBorrowSubmit = async () => {
      try {
        const res = await service.post(`/equipment/${borrowForm.id}/borrow`, borrowForm)
        if (res.code === 200) {
          ElMessage.success('设备借用成功')
          showBorrowDialog.value = false
          getEquipmentList()
        } else {
          ElMessage.error(res.msg || '设备借用失败')
        }
      } catch (err) {
        console.error('设备借用失败:', err)
        ElMessage.error('设备借用失败')
      }
    }

    const handleDelete = async (row) => {
      try {
        const res = await service.delete(`/equipment/${row.id}`)
        if (res.code === 200) {
          ElMessage.success('设备删除成功')
          getEquipmentList()
        } else {
          ElMessage.error(res.msg || '设备删除失败')
        }
      } catch (err) {
        console.error('设备删除失败:', err)
        ElMessage.error('设备删除失败')
      }
    }

    const viewQRCode = async (id) => {
      try {
        const res = await service.get(`/equipment/${id}/qrcode`, { responseType: 'blob' })
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `equipment_${id}_qrcode.png`)
        document.body.appendChild(link)
        link.click()
        link.remove()
      } catch (err) {
        console.error('获取二维码失败:', err)
        ElMessage.error('获取二维码失败')
      }
    }

    const handleImageError = (row) => {
      editForm.equipmentImage = ''
      viewForm.equipmentImage = ''
      if (row) {
        row.equipmentImage = ''
      }
    }

    const clearImage = () => {
      editForm.equipmentImage = ''
      fileList.value = []
    }

    const handleFileChange = async (file) => {
      if (!file.raw) return
      
      const formData = new FormData()
      formData.append('file', file.raw)
      
      try {
        const res = await service.post('/equipment/upload-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        editForm.equipmentImage = res.data
        ElMessage.success('图片上传成功')
        fileList.value = []
      } catch (err) {
        console.error('图片上传失败:', err)
        ElMessage.error('图片上传失败')
      }
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
        if (!repairForm.faultImageList) {
          repairForm.faultImageList = []
        }
        repairForm.faultImageList.push(res.data)
        ElMessage.success('图片上传成功')
      } catch (err) {
        console.error('图片上传失败:', err)
        ElMessage.error('图片上传失败')
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
        tableRef.value.clearSelection()
        selectedRowIds.value.clear()
        equipmentList.value.forEach(row => {
          selectedRowIds.value.add(row.id)
        })
        tableRef.value.toggleAllSelection()
      }
    }

    const handleDeselectAll = () => {
      if (tableRef.value) {
        tableRef.value.clearSelection()
        selectedRowIds.value.clear()
      }
    }

    const handleBatchDelete = async () => {
      if (selectedRowIds.value.size === 0) {
        ElMessage.warning('请先选择要删除的设备')
        return
      }
      
      ElMessageBox.confirm(`确定要删除选中的 ${selectedRowIds.value.size} 个设备吗？`, '警告', {
        type: 'warning'
      })
        .then(async () => {
          try {
            const equipmentIds = Array.from(selectedRowIds.value)
            await service.delete('/equipment/batch', { params: { equipmentIds } })
            ElMessage.success('批量删除设备成功')
            selectedRowIds.value.clear()
            getEquipmentList()
          } catch (err) {
            console.error('批量删除设备失败:', err)
            ElMessage.error('批量删除设备失败')
          }
        })
        .catch(() => {})
    }

    const handleExport = () => {
      if (selectedRowIds.value.size === 0) {
        ElMessage.warning('请先选择要导出的设备')
        return
      }
      
      const equipmentIds = Array.from(selectedRowIds.value)
      window.location.href = `/api/equipment/export?equipmentIds=${equipmentIds.join(',')}`
    }

    const clearRepairImage = () => {
      repairForm.faultImageList = []
      repairFileList.value = []
    }

    const handleRepairFileExceed = () => {
      ElMessage.warning(`最多只能上传 5 张图片，当前已上传 ${repairForm.faultImageList.length} 张`)
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }

    const getStatusText = (status) => {
      const statusMap = {
        0: '维修中',
        1: '空闲',
        2: '被预约',
        3: '已借用',
        4: '故障'
      }
      return statusMap[status] || '未知'
    }

    const getStatusType = (status) => {
      const typeMap = {
        0: 'warning',
        1: 'success',
        2: 'primary',
        3: 'info',
        4: 'danger'
      }
      return typeMap[status] || 'info'
    }

    const getEquipmentTypeText = (typeId) => {
      const typeMap = {
        1: '计算机类',
        2: '电子类',
        3: '实验仪器',
        4: '办公设备',
        5: '其他设备'
      }
      return typeMap[typeId] || '未知'
    }

    const getEquipmentTypeColor = (typeId) => {
      const colorMap = {
        1: 'primary',
        2: 'warning',
        3: 'danger',
        4: 'success',
        5: 'info'
      }
      return colorMap[typeId] || 'info'
    }

    const getIndex = (index) => {
      return (pagination.current - 1) * pagination.size + index + 1
    }

    const handleSizeChange = async (size) => {
      pagination.size = size
      await getEquipmentList()
    }

    const handleCurrentChange = async (current) => {
      pagination.current = current
      await getEquipmentList()
    }

    onMounted(() => {
      getEquipmentList()
      getEquipmentTypeList()
    })

    const getEquipmentTypeList = async () => {
      try {
        const res = await service.get('/equipment/types')
        equipmentTypeList.value = res.data || []
      } catch (err) {
        console.error('获取设备类型列表失败:', err)
      }
    }

    return {
      loading,
      searchText,
      searchType,
      equipmentTypeList,
      showEditDialog,
      showViewDialog,
      showBorrowDialog,
      showRepairDialog,
      equipmentList,
      editFormRef,
      repairFormRef,
      editForm,
      viewForm,
      borrowForm,
      repairForm,
      pagination,
      editRules,
      repairRules,
      isAdmin,
      showManagement,
      tableRef,
      selectedRowIds,
      getEquipmentList,
      getEquipmentTypeList,
      handleEdit,
      handleEditSubmit,
      handleView,
      handleBorrow,
      handleBorrowSubmit,
      handleRepair,
      handleRepairSubmit,
      handleDelete,
      viewQRCode,
      handleSelectionChange,
      handleSelectAll,
      handleDeselectAll,
      handleBatchDelete,
      handleExport,
      handleImageError,
      handleFileChange,
      handleRepairFileChange,
      clearImage,
      clearRepairImage,
      handleRepairFileExceed,
      formatDate,
      getStatusText,
      getStatusType,
      getEquipmentTypeText,
      getEquipmentTypeColor,
      getIndex,
      handleSizeChange,
      handleCurrentChange,
      Search,
      UploadFilled,
      defaultImage,
      fileList,
      repairFileList
    }
  }
}
</script>

<style scoped>
.equipment-list {
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
  flex-wrap: wrap;
  gap: 10px;
}

.management-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.equipment-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  border: 1px solid #dcdde6;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

.equipment-avatar {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 1px solid #dcdde6;
}

.dialog-content {
  .image-section {
    margin: 20px 0;
    text-align: center;
    
    .image-title {
      font-size: 16px;
      color: #606266;
      margin-bottom: 10px;
      font-weight: 500;
    }
  }
}

.image-preview {
  margin-bottom: 10px;
  text-align: center;
}

.upload-container {
  margin-bottom: 10px;
}

.image-url-input {
  margin-top: 10px;
}

.avatar-upload-container {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.avatar-preview-box {
  margin-bottom: 10px;
  text-align: center;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  margin-bottom: 5px;
}

.upload-hint {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
}

.image-preview {
  margin-top: 15px;
  text-align: center;
}

.repair-upload {
  margin-bottom: 20px;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 10px;
}

.image-actions {
  margin-top: 10px;
  text-align: center;
}

.qrcode-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  
  h4 {
    font-size: 16px;
    color: #303133;
    margin-bottom: 15px;
    font-weight: 500;
  }
}

.qrcode-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  
  .qrcode-image {
    max-width: 200px;
    max-height: 200px;
    object-fit: contain;
  }
}
</style>

