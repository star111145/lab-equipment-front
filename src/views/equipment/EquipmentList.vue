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
          v-if="isAdmin && !showManagement"
          type="primary"
          @click="showManagement = true"
          style="margin-left: auto;"
        >
          管理
        </el-button>
      </div>

      <div v-if="showManagement && isAdmin" class="management-bar">
        <el-button type="primary" @click="showExportDialog = true; exportAll = false">
          统计报表
        </el-button>
        <el-button type="success" @click="handleAdd">
          <el-icon><Plus /></el-icon>添加设备
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
        <el-table-column v-if="showManagement && isAdmin" type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="equipmentNumber" label="设备编号" width="140" />
        <el-table-column prop="equipmentName" label="设备名称" width="140" />
        <el-table-column prop="equipmentModel" label="设备型号" width="140" />
        <el-table-column prop="description" label="设备描述" width="200" />
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
              :type="getStatusType(row.equipmentStatus, row.stockQuantity, row.availableQuantity, row.borrowQuantity, row.reserveQuantity)"
              disable-transitions
            >
              {{ getStatusText(row.equipmentStatus, row.stockQuantity, row.availableQuantity, row.borrowQuantity, row.reserveQuantity) }}
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
        <el-table-column label="上架状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isListed ? 'success' : 'danger'" disable-transitions>
              {{ row.isListed ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="故障数量" width="100">
          <template #default="{ row }">
            <el-tag :type="row.unavailableQuantity > 0 ? 'danger' : 'info'" disable-transitions>
              {{ row.unavailableQuantity || 0 }} 台
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="二维码" width="180">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewQRCode(row.id, row.qrcodeUrl)">查看</el-button>
            <el-button type="warning" link @click="regenerateQRCode(row.id)">重制</el-button>
            <el-button type="success" link @click="testMobileScan(row.equipmentNumber)">测试</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button 
              v-if="row.availableQuantity > 0" 
              type="success" 
              link 
              @click="handleReserve(row)"
            >预约</el-button>
            <el-button 
              v-else 
              type="success" 
              link 
              disabled
            >预约</el-button>
            <template v-if="isAdmin">
              <el-button type="warning" link @click="handleRepair(row)">报修</el-button>
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
          <el-descriptions-item label="设备型号">{{ viewForm.equipmentModel || '-' }}</el-descriptions-item>
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
              :type="getStatusType(viewForm.equipmentStatus, viewForm.stockQuantity, viewForm.availableQuantity, viewForm.borrowQuantity, viewForm.reserveQuantity)"
              disable-transitions
            >
              {{ getStatusText(viewForm.equipmentStatus, viewForm.stockQuantity, viewForm.availableQuantity, viewForm.borrowQuantity, viewForm.reserveQuantity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设备位置">{{ viewForm.equipmentLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="库存数量">{{ viewForm.stockQuantity || 0 }}</el-descriptions-item>
          <el-descriptions-item label="可用数量">
            <el-tag :type="viewForm.availableQuantity > 0 ? 'success' : 'danger'">
              {{ viewForm.availableQuantity || 0 }} 台
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="故障数量">
            <el-tag :type="viewForm.unavailableQuantity > 0 ? 'danger' : 'info'">
              {{ viewForm.unavailableQuantity || 0 }} 台
            </el-tag>
          </el-descriptions-item>
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
          <el-input v-model="editForm.equipmentName" placeholder="请输入设备名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="editForm.equipmentModel" placeholder="请输入设备型号" maxlength="100" />
        </el-form-item>
        <el-form-item label="设备类型" prop="equipmentTypeId">
          <el-select v-model="editForm.equipmentTypeId" placeholder="请选择设备类型" style="width: 100%">
            <el-option
              v-for="type in equipmentTypeListWithId"
              :key="type.id"
              :label="type.typeName"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态" prop="equipmentStatus">
          <el-radio-group v-model="editForm.equipmentStatus">
            <el-radio :value="1">空闲</el-radio>
            <el-radio :value="4">故障</el-radio>
          </el-radio-group>
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>已借用状态由系统自动计算</span>
          </div>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="editForm.warehouseId" placeholder="请选择仓库" clearable style="width: 100%">
            <el-option
              v-for="warehouse in warehouseList"
              :key="warehouse.id"
              :label="warehouse.warehouseName"
              :value="warehouse.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="editForm.supplierId" placeholder="请选择供应商" clearable style="width: 100%">
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.id"
              :label="supplier.supplierName"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库存数量" prop="stockQuantity">
          <NumberInput
            v-model="editForm.stockQuantity"
            :min="0"
            :max="10000"
          />
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
      v-model="showAddDialog"
      title="添加设备"
      width="600px"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="100px"
      >
        <el-form-item label="设备编号" prop="equipmentNumber">
          <el-input v-model="addForm.equipmentNumber" placeholder="请输入数字编号" maxlength="10" @input="handleNumberInput">
            <template #prefix>
              <span style="color: #409eff; font-weight: bold;">EQ</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="设备名称" prop="equipmentName">
          <el-input v-model="addForm.equipmentName" placeholder="请输入设备名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="addForm.equipmentModel" placeholder="请输入设备型号" maxlength="100" />
        </el-form-item>
        <el-form-item label="设备类型" prop="equipmentTypeId">
          <el-select v-model="addForm.equipmentTypeId" placeholder="请选择设备类型" style="width: 100%">
            <el-option
              v-for="type in equipmentTypeListWithId"
              :key="type.id"
              :label="type.typeName"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="addForm.warehouseId" placeholder="请选择仓库" clearable style="width: 100%">
            <el-option
              v-for="warehouse in warehouseList"
              :key="warehouse.id"
              :label="warehouse.warehouseName"
              :value="warehouse.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="addForm.supplierId" placeholder="请选择供应商" clearable style="width: 100%">
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.id"
              :label="supplier.supplierName"
              :value="supplier.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="初始库存" prop="stockQuantity">
          <NumberInput
            v-model="addForm.stockQuantity"
            :min="0"
            :max="10000"
          />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>添加设备后将自动创建入库记录</span>
          </div>
        </el-form-item>
        <el-form-item label="设备图片">
          <div class="avatar-upload-container">
            <div class="avatar-preview-box">
              <el-avatar
                v-if="addForm.equipmentImage && addForm.equipmentImage !== ''"
                :src="addForm.equipmentImage"
                size="large"
                shape="square"
                class="equipment-avatar"
                @error="handleAddImageError"
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
                v-model:file-list="addFileList"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAddFileChange"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                :limit="1"
                class="upload-btn"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>选择图片
                </el-button>
              </el-upload>
              <el-button
                v-if="addForm.equipmentImage && addForm.equipmentImage !== ''"
                type="danger"
                size="small"
                @click="clearAddImage"
              >
                清除
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="设备描述">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="请输入设备描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddSubmit">确定</el-button>
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
        <el-form-item label="设备型号">
          <el-input v-model="borrowForm.equipmentModel" disabled />
        </el-form-item>
        <el-form-item label="借用数量">
          <NumberInput
            v-model="borrowForm.quantity"
            :min="0"
            :max="borrowForm.availableQuantity"
          />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="borrowForm.realName" disabled />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>账号绑定信息，如需修改请到个人中心更新</span>
          </div>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="borrowForm.phone" disabled />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>账号绑定信息，如需修改请到个人中心更新</span>
          </div>
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
      v-model="showReserveDialog"
      title="预约设备"
      width="500px"
    >
      <el-form
        :model="reserveForm"
        label-width="100px"
      >
        <el-form-item label="设备编号">
          <el-input v-model="reserveForm.equipmentNumber" disabled />
        </el-form-item>
        <el-form-item label="设备名称">
          <el-input v-model="reserveForm.equipmentName" disabled />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model="reserveForm.equipmentModel" disabled />
        </el-form-item>
        <el-form-item label="预约时间" required>
          <el-date-picker
            v-model="reserveForm.reserveTime"
            type="datetime"
            placeholder="选择预约时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预约时长" required>
          <NumberInput
            v-model="reserveForm.reserveDuration"
            :min="0"
            :max="720"
          />
          小时（最多30天）
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="reserveForm.realName" disabled />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>账号绑定信息，如需修改请到个人中心更新</span>
          </div>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="reserveForm.phone" disabled />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>账号绑定信息，如需修改请到个人中心更新</span>
          </div>
        </el-form-item>
        <el-form-item label="预约用途">
          <el-input v-model="reserveForm.purpose" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReserveDialog = false">取消</el-button>
        <el-button type="primary" @click="handleReserveSubmit">确定</el-button>
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
            :max="isAdmin ? repairForm.stockQuantity : repairForm.borrowQuantity"
          />
          <div class="form-tip" style="margin-top: 5px; margin-left: 7px;">
            <el-icon><InfoFilled /></el-icon>
            <span>不要超过{{ isAdmin ? '库存数量' : '借出数量' }}</span>
          </div>
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="repairForm.realName" disabled />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>账号绑定信息，如需修改请到个人中心更新</span>
          </div>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="repairForm.phone" disabled />
          <div class="form-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>账号绑定信息，如需修改请到个人中心更新</span>
          </div>
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

    <el-dialog
      v-model="showQRCodeDialog"
      title="设备二维码"
      width="350px"
      :close-on-click-modal="false"
    >
      <div style="text-align: center; padding: 20px 0;">
        <img 
          v-if="viewQRCodeUrl" 
          :src="viewQRCodeUrl" 
          alt="设备二维码" 
          style="max-width: 280px; border: 1px solid #ddd; padding: 10px;"
          @error="(e) => e.target.src = ''"
        />
        <p v-else style="color: #999;">加载中...</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="downloadQRCode">下载二维码</el-button>
        <el-button @click="showQRCodeDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showExportDialog"
      title="导出统计报表"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="text-align: center; padding: 20px 0;">
        <p style="margin-bottom: 20px; color: #666;">确定要导出设备记录吗？</p>
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import service from '@/api/request'
import { websocketClient } from '@/utils/websocket'
import { Search, Upload, UploadFilled, InfoFilled, Plus } from '@element-plus/icons-vue'
import NumberInput from '@/components/NumberInput.vue'

const QR_BASE_URL = 'http://10.29.80.192:8090'

export default {
  name: 'EquipmentList',
  components: {
    NumberInput
  },
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const searchType = ref('')
    const equipmentTypeList = ref([])
    const equipmentTypeListWithId = ref([])
    const showEditDialog = ref(false)
    const showViewDialog = ref(false)
    const showAddDialog = ref(false)
    const showBorrowDialog = ref(false)
    const showReserveDialog = ref(false)
    const showRepairDialog = ref(false)
    const showExportDialog = ref(false)
    const showQRCodeDialog = ref(false)
    const viewQRCodeUrl = ref('')
    const currentQRCodeId = ref(null)
    const exportAll = ref(false)
    const equipmentList = ref([])
    const editFormRef = ref(null)
    const repairFormRef = ref(null)
    const isAdmin = ref(localStorage.getItem('isAdministrator') === 'true')
    const showManagement = ref(false)
    const tableRef = ref(null)
    const selectedRowIds = ref(new Set())
    const fileList = ref([])
    const repairFileList = ref([])
    const addFileList = ref([])
    const warehouseList = ref([])
    const supplierList = ref([])
    const defaultImage = require('@/assets/default_equipment.png')
    const router = useRouter()
    const route = useRoute()

    const editForm = reactive({
      id: null,
      equipmentNumber: '',
      equipmentName: '',
      equipmentModel: '',
      equipmentType: '',
      equipmentTypeId: null,
      equipmentStatus: 1,
      equipmentLocation: '',
      warehouseId: null,
      stockQuantity: 0,
      description: '',
      supplier: '',
      supplierId: null,
      equipmentImage: '',
      qrcodeUrl: ''
    })

    const addForm = reactive({
      equipmentNumber: '',
      equipmentName: '',
      equipmentModel: '',
      equipmentTypeId: null,
      warehouseId: null,
      supplierId: null,
      stockQuantity: 0,
      equipmentImage: '',
      description: ''
    })

    const addFormRef = ref(null)

    const viewForm = reactive({
      equipmentNumber: '',
      equipmentName: '',
      equipmentModel: '',
      equipmentType: '',
      equipmentTypeId: null,
      equipmentStatus: 1,
      equipmentLocation: '',
      stockQuantity: 0,
      availableQuantity: 0,
      borrowQuantity: 0,
      unavailableQuantity: 0,
      reserveQuantity: 0,
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
      equipmentModel: '',
      quantity: 0,
      availableQuantity: 0,
      realName: '',
      phone: '',
      reason: ''
    })

    const reserveForm = reactive({
      id: null,
      equipmentTypeId: null,
      equipmentNumber: '',
      equipmentName: '',
      equipmentModel: '',
      reserveTime: null,
      reserveDuration: 0,
      realName: '',
      phone: '',
      purpose: ''
    })

    const repairForm = reactive({
      id: null,
      equipmentNumber: '',
      equipmentName: '',
      equipmentModel: '',
      repairQuantity: 0,
      availableQuantity: 0,
      borrowQuantity: 0,
      stockQuantity: 0,
      realName: '',
      phone: '',
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

    const addRules = reactive({
      equipmentNumber: [
        { required: true, message: '请输入设备编号', trigger: 'blur' },
        { pattern: /^\d+$/, message: '设备编号必须为数字', trigger: 'blur' }
      ],
      equipmentName: [
        { required: true, message: '请输入设备名称', trigger: 'blur' }
      ],
      equipmentTypeId: [
        { required: true, message: '请选择设备类型', trigger: 'change' }
      ]
    })

    const repairRules = reactive({
      repairQuantity: [
        { required: true, message: '请输入报修数量', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            const maxQuantity = isAdmin.value ? repairForm.stockQuantity : repairForm.borrowQuantity
            if (!value || value <= 0) {
              callback(new Error('报修数量必须大于0'))
            } else if (value > maxQuantity) {
              callback(new Error(isAdmin.value ? '报修数量不能超过库存数量' : '报修数量不能超过借出数量'))
            } else {
              callback()
            }
          }, 
          trigger: 'blur' 
        }
      ],
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
        editForm.equipmentModel = res.data.equipmentModel || ''
        editForm.equipmentType = res.data.equipmentType
        editForm.equipmentTypeId = res.data.equipmentTypeId
        editForm.equipmentStatus = res.data.equipmentStatus
        editForm.equipmentLocation = res.data.equipmentLocation
        editForm.warehouseId = res.data.warehouseId
        editForm.stockQuantity = res.data.stockQuantity
        editForm.description = res.data.description
        editForm.supplier = res.data.supplier || ''
        editForm.supplierId = res.data.supplierId
        editForm.equipmentImage = res.data.equipmentImage || ''
        editForm.qrcodeUrl = res.data.qrcodeUrl || ''
        getWarehouseList()
        getSupplierList()
        equipmentTypeListWithId.value = await getEquipmentTypeListWithId()
        showEditDialog.value = true
      } catch (err) {
        console.error('获取设备详情失败:', err)
      }
    }

    const handleAdd = async () => {
      addForm.equipmentNumber = ''
      addForm.equipmentName = ''
      addForm.equipmentModel = ''
      addForm.equipmentTypeId = null
      addForm.warehouseId = null
      addForm.supplierId = null
      addForm.stockQuantity = 0
      addForm.equipmentImage = ''
      addForm.description = ''
      addFileList.value = []
      showAddDialog.value = true
      getWarehouseList()
      getSupplierList()
      equipmentTypeListWithId.value = await getEquipmentTypeListWithId()
    }

    const handleNumberInput = (value) => {
      addForm.equipmentNumber = value.replace(/\D/g, '')
    }

    const handleAddSubmit = async () => {
      try {
        await addFormRef.value.validate()
        const res = await service.post('/equipment', addForm)
        if (res.code === 200) {
          ElMessage.success('添加设备成功')
          showAddDialog.value = false
          getEquipmentList()
        } else {
          ElMessage.error(res.msg || '添加设备失败')
        }
      } catch (err) {
        console.error('添加设备失败:', err)
        ElMessage.error('添加设备失败')
      }
    }

    const handleAddFileChange = async (file) => {
      if (!file.raw) return
      const formData = new FormData()
      formData.append('file', file.raw)
      try {
        const res = await service.post('/equipment/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        addForm.equipmentImage = res.data
        ElMessage.success('图片上传成功')
        addFileList.value = []
      } catch (err) {
        console.error('图片上传失败:', err)
        ElMessage.error('图片上传失败')
      }
    }

    const handleAddImageError = () => {
      addForm.equipmentImage = ''
    }

    const clearAddImage = () => {
      addForm.equipmentImage = ''
      addFileList.value = []
    }

    const getWarehouseList = async () => {
      try {
        const res = await service.get('/warehouse/all')
        warehouseList.value = res.data || []
      } catch (err) {
        console.error('获取仓库列表失败:', err)
      }
    }

    const getSupplierList = async () => {
      try {
        const res = await service.get('/supplier/all')
        supplierList.value = res.data || []
      } catch (err) {
        console.error('获取供应商列表失败:', err)
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
      viewForm.equipmentModel = row.equipmentModel || ''
      viewForm.equipmentType = row.equipmentType
      viewForm.equipmentTypeId = row.equipmentTypeId
      viewForm.equipmentStatus = row.equipmentStatus
      viewForm.equipmentLocation = row.equipmentLocation
      viewForm.stockQuantity = row.stockQuantity
      viewForm.availableQuantity = row.availableQuantity
      viewForm.borrowQuantity = row.borrowQuantity
      viewForm.unavailableQuantity = row.unavailableQuantity
      viewForm.reserveQuantity = row.reserveQuantity
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
      borrowForm.equipmentModel = row.equipmentModel || ''
      borrowForm.availableQuantity = row.availableQuantity || row.stockQuantity
      borrowForm.realName = localStorage.getItem('realName') || ''
      borrowForm.phone = localStorage.getItem('phone') || ''
      borrowForm.reason = ''
      showBorrowDialog.value = true
    }

    const handleReserve = (row) => {
      reserveForm.id = row.id
      reserveForm.equipmentTypeId = row.equipmentTypeId
      reserveForm.equipmentNumber = row.equipmentNumber
      reserveForm.equipmentName = row.equipmentName
      reserveForm.equipmentModel = row.equipmentModel || ''
      reserveForm.reserveTime = null
      reserveForm.reserveDuration = 0
      reserveForm.realName = localStorage.getItem('realName') || ''
      reserveForm.phone = localStorage.getItem('phone') || ''
      reserveForm.purpose = ''
      showReserveDialog.value = true
    }

    const handleReserveSubmit = async () => {
      try {
        const checkExistRes = await service.get('/lifecycle/reserve/user/list', {
          params: { current: 1, size: 50, equipmentId: reserveForm.id, status: -1 }
        })
        if (checkExistRes.code === 200 && checkExistRes.data?.records) {
          const existingReserve = checkExistRes.data.records.find(r => 
            String(r.equipmentId) === String(reserveForm.id) && 
            (r.reserveStatus === 0 || r.reserveStatus === 1)
          )
          if (existingReserve) {
            ElMessage.warning('您已存在该设备的有效预约，请勿重复预约')
            return
          }
        }
        
        if (!reserveForm.reserveTime) {
          ElMessage.warning('请选择预约时间')
          return
        }
        const reserveTimeDate = new Date(reserveForm.reserveTime)
        const now = new Date()
        if (reserveTimeDate <= now) {
          ElMessage.warning('预约时间必须是未来时间')
          return
        }
        if (!reserveForm.reserveDuration || reserveForm.reserveDuration <= 0) {
          ElMessage.warning('请输入有效的预约时长（至少1小时）')
          return
        }
        if (!reserveForm.realName) {
          ElMessage.warning('请输入真实姓名')
          return
        }
        if (!reserveForm.phone) {
          ElMessage.warning('请输入联系电话')
          return
        }
        if (!reserveForm.purpose) {
          ElMessage.warning('请输入预约用途')
          return
        }
        
        const checkRes = await service.get('/lifecycle/reserve/check-conflict', {
          params: {
            equipmentId: reserveForm.id,
            reserveTime: reserveForm.reserveTime,
            reserveDuration: reserveForm.reserveDuration
          }
        })
        if (checkRes.code === 200 && checkRes.data) {
          ElMessage.warning('该时段设备已被预约，请选择其他时间')
          return
        }
        
        const res = await service.post('/lifecycle/reserve', {
          equipmentId: reserveForm.id,
          equipmentTypeId: reserveForm.equipmentTypeId,
          equipmentNumber: reserveForm.equipmentNumber,
          equipmentName: reserveForm.equipmentName,
          reserveTime: reserveForm.reserveTime,
          reserveDuration: reserveForm.reserveDuration,
          realName: reserveForm.realName,
          phone: reserveForm.phone,
          purpose: reserveForm.purpose
        })
        if (res.code === 200) {
          ElMessage.success(res.data || '预约申请已提交，等待管理员审核')
          showReserveDialog.value = false
          reserveForm.reserveTime = null
          reserveForm.reserveDuration = 0
          reserveForm.realName = localStorage.getItem('realName') || ''
          reserveForm.phone = localStorage.getItem('phone') || ''
          reserveForm.purpose = ''
          getEquipmentList()
          router.push('/platform/user/reserve')
        } else {
          ElMessage.error(res.msg || '设备预约失败')
        }
      } catch (err) {
        console.error('设备预约失败:', err)
        ElMessage.error('设备预约失败')
      }
    }

    const handleRepair = (row) => {
      repairForm.id = row.id
      repairForm.equipmentNumber = row.equipmentNumber
      repairForm.equipmentName = row.equipmentName
      repairForm.equipmentModel = row.equipmentModel || ''
      repairForm.availableQuantity = row.availableQuantity || 0
      repairForm.borrowQuantity = row.borrowQuantity || 0
      repairForm.stockQuantity = row.stockQuantity || 0
      repairForm.realName = localStorage.getItem('realName') || ''
      repairForm.phone = localStorage.getItem('phone') || ''
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
          equipmentNumber: repairForm.equipmentNumber,
          equipmentName: repairForm.equipmentName,
          realName: repairForm.realName,
          phone: repairForm.phone,
          repairQuantity: repairForm.repairQuantity,
          faultDescription: repairForm.faultDescription,
          faultImageList: repairForm.faultImageList
        })
        if (res.code === 200) {
          ElMessage.success('报修申请提交成功')
          showRepairDialog.value = false
          repairForm.faultImageList = []
          repairFileList.value = []
          repairForm.repairQuantity = 1
          router.push('/platform/user/repair')
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
        if (!borrowForm.quantity || borrowForm.quantity <= 0) {
          ElMessage.warning('请输入有效的借用数量（至少1）')
          return
        }
        if (borrowForm.quantity > borrowForm.availableQuantity) {
          ElMessage.warning('借用数量不能超过可用数量')
          return
        }
        const res = await service.post('/lifecycle/borrow', {
          equipmentId: borrowForm.id,
          equipmentNumber: borrowForm.equipmentNumber,
          equipmentName: borrowForm.equipmentName,
          realName: borrowForm.realName,
          phone: borrowForm.phone,
          borrowQuantity: borrowForm.borrowQuantity,
          expectReturnTime: borrowForm.expectReturnTime,
          purpose: borrowForm.reason
        })
        if (res.code === 200) {
          ElMessage.success('设备借用成功')
          showBorrowDialog.value = false
          getEquipmentList()
          router.push('/platform/user/borrow')
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

    const viewQRCode = async (id, qrcodeUrl) => {
      try {
        if (!qrcodeUrl) {
          const res = await service.post(`/equipment/${id}/regenerate-qrcode`)
          if (res.code === 200) {
            qrcodeUrl = res.data
            getEquipmentList()
          }
        }
        if (!qrcodeUrl) {
          const infoRes = await service.get(`/equipment/${id}`)
          if (infoRes.code === 200 && infoRes.data.qrcodeUrl) {
            qrcodeUrl = infoRes.data.qrcodeUrl
          }
        }
        if (qrcodeUrl) {
          viewQRCodeUrl.value = qrcodeUrl
          currentQRCodeId.value = id
          showQRCodeDialog.value = true
        } else {
          ElMessage.warning('无法获取二维码')
        }
      } catch (err) {
        console.error('获取二维码失败:', err)
        ElMessage.error('获取二维码失败')
      }
    }

    const downloadQRCode = async () => {
      if (!viewQRCodeUrl.value) return
      const link = document.createElement('a')
      link.href = viewQRCodeUrl.value
      link.download = `equipment_${currentQRCodeId.value}_qrcode.png`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    const regenerateQRCode = async (id) => {
      try {
        const res = await service.post(`/equipment/${id}/regenerate-qrcode`)
        if (res.code === 200) {
          ElMessage.success('二维码重新生成成功')
          getEquipmentList()
        } else {
          ElMessage.error(res.message || '生成失败')
        }
      } catch (err) {
        console.error('重新生成二维码失败:', err)
        ElMessage.error('重新生成二维码失败')
      }
    }

    const testMobileScan = (equipmentNumber) => {
      const url = `${QR_BASE_URL}/mobile/device?equipmentNumber=${equipmentNumber}`
      window.open(url, '_blank')
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

    const handleExport = async () => {
      showExportDialog.value = false
      try {
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        const params = new URLSearchParams()
        if (searchText.value) {
          params.append('keyword', searchText.value)
        }
        if (searchType.value) {
          params.append('equipmentType', searchType.value)
        }
        if (exportAll.value) {
          params.append('exportAll', 'true')
        } else {
          params.append('current', '1')
          params.append('size', pagination.size.toString())
        }
        
        const queryString = params.toString()
        const url = `/api/equipment/export?${queryString}`
        
        const response = await fetch(url, {
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
        a.download = `设备信息_${timestamp}.xlsx`
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

    const getStatusText = (equipmentStatus, stockQuantity, availableQuantity, borrowQuantity, reserveQuantity = 0) => {
      const manualStatusMap = {
        0: '故障',
        4: '故障'
      }
      if (manualStatusMap[equipmentStatus]) {
        return manualStatusMap[equipmentStatus]
      }
      if (!stockQuantity || stockQuantity === 0) return '无库存'
      if (availableQuantity === 0) return '已满'
      if (borrowQuantity > 0) return `已借出${borrowQuantity}台`
      if (reserveQuantity > 0) return `部分预约`
      return '空闲'
    }

    const getStatusType = (equipmentStatus, stockQuantity, availableQuantity, borrowQuantity, reserveQuantity = 0) => {
      const manualTypeMap = {
        0: 'warning',
        4: 'danger'
      }
      if (manualTypeMap[equipmentStatus]) {
        return manualTypeMap[equipmentStatus]
      }
      if (!stockQuantity || stockQuantity === 0) return 'info'
      if (availableQuantity === 0) return 'danger'
      if (borrowQuantity > 0) return 'primary'
      if (reserveQuantity > 0) return 'primary'
      return 'success'
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

    onMounted(async () => {
      await getEquipmentList()
      getEquipmentTypeList()
      websocketClient.on('reservation_refresh', handleWsMessage)
      websocketClient.on('borrow_refresh', handleWsMessage)
      websocketClient.on('repair_refresh', handleWsMessage)
      websocketClient.on('return_refresh', handleWsMessage)
      
      const equipmentId = route.query.id
      const action = route.query.action
      if (equipmentId && action === 'reserve') {
        const equipment = equipmentList.value.find(item => item.id === parseInt(equipmentId))
        if (equipment) {
          handleReserve(equipment)
        }
        router.replace({ query: {} })
      }
    })

    const handleWsMessage = () => {
      getEquipmentList()
    }

    onUnmounted(() => {
      websocketClient.off('reservation_refresh', handleWsMessage)
      websocketClient.off('borrow_refresh', handleWsMessage)
      websocketClient.off('repair_refresh', handleWsMessage)
      websocketClient.off('return_refresh', handleWsMessage)
    })

    const getEquipmentTypeList = async () => {
      try {
        const res = await service.get('/equipment/types')
        equipmentTypeList.value = res.data || []
      } catch (err) {
        console.error('获取设备类型列表失败:', err)
      }
    }

    const getEquipmentTypeListWithId = async () => {
      try {
        const res = await service.get('/equipment-type/all')
        return res.data || []
      } catch (err) {
        console.error('获取设备类型列表失败:', err)
        return []
      }
    }

    return {
      loading,
      searchText,
      searchType,
      equipmentTypeList,
      equipmentTypeListWithId,
      showEditDialog,
      showViewDialog,
      showAddDialog,
      showBorrowDialog,
      showReserveDialog,
      showRepairDialog,
      showExportDialog,
      showQRCodeDialog,
      viewQRCodeUrl,
      currentQRCodeId,
      equipmentList,
      editFormRef,
      repairFormRef,
      addFormRef,
      editForm,
      addForm,
      viewForm,
      borrowForm,
      reserveForm,
      repairForm,
      pagination,
      editRules,
      addRules,
      repairRules,
      isAdmin,
      showManagement,
      tableRef,
      selectedRowIds,
      getEquipmentList,
      getEquipmentTypeList,
      getEquipmentTypeListWithId,
      handleEdit,
      handleAdd,
      handleNumberInput,
      handleAddSubmit,
      handleAddFileChange,
      handleAddImageError,
      clearAddImage,
      handleEditSubmit,
      handleView,
      handleBorrow,
      handleBorrowSubmit,
      handleReserve,
      handleReserveSubmit,
      handleRepair,
      handleRepairSubmit,
      handleDelete,
      viewQRCode,
      regenerateQRCode,
      downloadQRCode,
      testMobileScan,
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
      Upload,
      UploadFilled,
      InfoFilled,
      Plus,
      defaultImage,
      fileList,
      repairFileList,
      addFileList,
      warehouseList,
      supplierList
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

.form-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>

