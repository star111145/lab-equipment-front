<template>
  <div class="user-list">
    <div class="page-header">
      <h2>用户列表</h2>
      <p>管理所有系统用户</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索学（工）号/真实姓名/邮箱/手机号"
          clearable
          style="width: 300px"
          @input="getUserList"
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
        <el-button type="danger" @click="handleDeleteAll">删除全部用户</el-button>
        <el-button type="info" @click="showManagement = false">
          返回
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="userList"
        style="width: 100%; margin-top: 20px"
        border
        ref="tableRef"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="showManagement" type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="avatar" label="头像" width="100" align="center">
          <template #default="{ row }">
            <el-avatar
              v-if="row.avatar && row.avatar !== '' && row.avatar !== '未设置'"
              :src="row.avatar"
              size="large"
              shape="square"
              class="user-avatar"
              @error="handleAvatarError(row)"
              @click="viewLargeAvatar(row.avatar)"
            />
            <el-avatar
              v-else
              size="large"
              shape="square"
              :src="defaultAvatar"
              class="user-avatar"
            />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="studentId" label="学号/工号" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="gender" label="性别" width="120">
          <template #default="{ row }">
            <div class="gender-tags">
              <el-tag v-if="row.gender === 0" type="info" size="small" disable-transitions>
                <el-icon><IceCreamRound /></el-icon>
                <span>未知</span>
              </el-tag>
              <el-tag v-else-if="row.gender === 1" type="primary" size="small" disable-transitions>
                <el-icon><Male /></el-icon>
                <span>男</span>
              </el-tag>
              <el-tag v-else type="danger" size="small" disable-transitions>
                <el-icon><Female /></el-icon>
                <span>女</span>
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'admin'" type="warning">管理员</el-tag>
            <el-tag v-else-if="row.role === 'teacher'" type="success">教师</el-tag>
            <el-tag v-else type="info">学生</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="注册时间" width="180">
          <template #default="{ row }">
            {{ row.createTime ? formatDate(row.createTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="warning" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleResetPassword(row)">重置密码</el-button>
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
      title="编辑用户"
      width="600px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="学号/工号" prop="studentId">
          <el-input v-model="editForm.studentId" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="editForm.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="头像">
          <div class="avatar-upload-container">
            <div class="avatar-preview-box">
              <el-avatar
                v-if="editForm.avatar && editForm.avatar !== '' && editForm.avatar !== '未设置'"
                :src="editForm.avatar"
                size="large"
                shape="square"
                class="user-avatar"
                @error="handleAvatarError(null)"
              />
              <el-avatar
                v-else
                size="large"
                :src="defaultAvatar"
                shape="square"
                class="user-avatar"
              />
            </div>
            <div class="avatar-actions">
              
              <div class="upload-hint">
                <el-icon><InfoFilled /></el-icon>
                <span>支持上传 PNG、JPG、JPEG、WEBP 格式图片</span>
              </div>
              <el-upload
                v-model:file-list="avatarFileList"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleAvatarFileChange"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                :limit="1"
                class="upload-btn"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>选择图片</el-button>
              </el-upload>
              <el-button
                v-if="editForm.avatar && editForm.avatar !== '' && editForm.avatar !== '未设置'"
                type="danger"
                size="small"
                @click="clearAvatar"
              >
                清除
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="editForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
            <el-radio :value="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="editForm.role">
            <el-radio value="student">学生</el-radio>
            <el-radio value="teacher">教师</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showViewDialog"
      title="用户详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ viewForm.username }}</el-descriptions-item>
        <el-descriptions-item label="学号/工号">{{ viewForm.studentId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ viewForm.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ viewForm.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ viewForm.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <div class="avatar-section">
            <el-avatar
              v-if="viewForm.avatar && viewForm.avatar !== '' && viewForm.avatar !== '未设置'"
              :src="viewForm.avatar"
              size="large"
              shape="square"
              class="user-avatar"
              @error="handleAvatarError(null)"
              @click="viewLargeAvatar(viewForm.avatar)"
            />
            <el-avatar
              v-else
              size="large"
              shape="square"
              :src="defaultAvatar"
              class="user-avatar"
            />
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          <el-tag v-if="viewForm.gender === 1" type="primary">男</el-tag>
          <el-tag v-else-if="viewForm.gender === 2" type="danger">女</el-tag>
          <el-tag v-else type="info">未知</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-if="viewForm.role === 'admin'" type="warning">管理员</el-tag>
          <el-tag v-else-if="viewForm.role === 'teacher'" type="success">教师</el-tag>
          <el-tag v-else type="info">学生</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewForm.status === 1 ? 'success' : 'danger'">
            {{ viewForm.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ viewForm.createTime ? formatDate(viewForm.createTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ viewForm.updateTime ? formatDate(viewForm.updateTime) : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="showResetDialog"
      title="重置密码"
      width="500px"
    >
      <el-form
        ref="resetFormRef"
        :model="resetForm"
        :rules="resetRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="resetForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResetDialog = false">取消</el-button>
        <el-button type="primary" @click="handleResetPasswordSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showExportDialog"
      title="导出统计报表"
      width="400px"
      :close-on-click-modal="false"
    >
      <div style="text-align: center; padding: 20px 0;">
        <p style="margin-bottom: 20px; color: #666;">确定要导出用户记录吗？</p>
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
import { ElMessage, ElMessageBox, ElImageViewer } from 'element-plus'
import service from '@/api/request'
import { Search, IceCreamRound, Male, Female, Upload, InfoFilled } from '@element-plus/icons-vue'

export default {
  name: 'UserList',
  setup() {
    const loading = ref(false)
    const searchText = ref('')
    const showEditDialog = ref(false)
    const showViewDialog = ref(false)
    const showResetDialog = ref(false)
    const showManagement = ref(false)
    const tableRef = ref(null)
    const selectedRowIds = ref(new Set())  // 存储已选择的用户ID
    const avatarFileList = ref([])
    const defaultAvatar = require('@/assets/default_avatar.png')
    const userList = ref([])  // 显示的用户列表
    const showExportDialog = ref(false)
    const exportAll = ref(false)

    const editFormRef = ref(null)
    const resetFormRef = ref(null)

    const editForm = reactive({
      id: null,
      username: '',
      studentId: '',
      realName: '',
      email: '',
      phone: '',
      avatar: '',
      gender: 0,
      role: 'student',
      status: 1
    })

    const viewForm = reactive({
      username: '',
      studentId: '',
      realName: '',
      email: '',
      phone: '',
      avatar: '',
      gender: 0,
      role: '',
      status: 1,
      createTime: '',
      updateTime: ''
    })

    const resetForm = reactive({
      newPassword: '',
      confirmPassword: ''
    })

    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    const editRules = reactive({
      studentId: [
        { required: true, message: '请输入学号/工号', trigger: 'blur' },
        { 
          pattern: /^\d{8,11}$/,
          message: '学号/工号必须是8-11位数字', 
          trigger: 'blur' 
        }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { 
          pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
          message: '请输入有效的邮箱地址', 
          trigger: 'blur' 
        }
      ],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { 
          pattern: /^1[3-9]\d{9}$/,
          message: '请输入有效的手机号', 
          trigger: 'blur' 
        }
      ]
    })

    const resetRules = reactive({
      newPassword: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 8, message: '密码长度至少 8 位', trigger: 'blur' },
        { 
          pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
          message: '密码必须包含字母和数字', 
          trigger: 'blur' 
        }
      ],
      confirmPassword: [
        { required: true, message: '请再次输入新密码', trigger: 'blur' },
        { 
          validator: (rule, value, callback) => {
            if (value !== resetForm.newPassword) {
              callback(new Error('两次输入的密码不一致'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ]
    })

    const getUserList = async () => {
      loading.value = true
      try {
        const res = await service.get('/user/list', {
          params: {
            current: pagination.current,
            size: pagination.size,
            keyword: searchText.value
          }
        })
        userList.value = res.data.records
        pagination.total = res.data.total
      } catch (err) {
        console.error('获取用户列表失败:', err)
        ElMessage.error('获取用户列表失败')
      } finally {
        loading.value = false
      }
    }

    const handleEdit = async (row) => {
      try {
        const res = await service.get(`/user/${row.id}`)
        editForm.id = res.data.id
        editForm.username = res.data.username
        editForm.studentId = res.data.studentId || ''
        editForm.realName = res.data.realName || ''
        editForm.email = res.data.email || ''
        editForm.phone = res.data.phone || ''
        editForm.avatar = res.data.avatar || ''
        editForm.gender = res.data.gender || 0
        editForm.role = res.data.role || 'student'
        editForm.status = res.data.status || 1
        showEditDialog.value = true
      } catch (err) {
        console.error('获取用户详情失败:', err)
      }
    }

    const handleEditSubmit = async () => {
      try {
        await editFormRef.value.validate()
        const res = await service.put(`/user/${editForm.id}`, editForm)
        console.log('更新用户响应:', res)
        if (res.code === 200) {
          ElMessage.success('更新用户成功')
          showEditDialog.value = false
          getUserList()
        } else {
          ElMessage.error(res.msg || '更新用户失败')
        }
      } catch (err) {
        console.error('更新用户失败:', err)
        ElMessage.error('更新用户失败')
      }
    }

    const handleView = (row) => {
      viewForm.username = row.username
      viewForm.studentId = row.studentId || ''
      viewForm.realName = row.realName || ''
      viewForm.email = row.email || ''
      viewForm.phone = row.phone || ''
      viewForm.avatar = row.avatar || ''
      viewForm.gender = row.gender || 0
      viewForm.role = row.role || 'student'
      viewForm.status = row.status || 1
      viewForm.createTime = row.createTime ? formatDate(row.createTime) : '-'
      viewForm.updateTime = row.updateTime ? formatDate(row.updateTime) : '-'
      showViewDialog.value = true
    }

    const handleResetPassword = () => {
      resetForm.newPassword = ''
      resetForm.confirmPassword = ''
      showResetDialog.value = true
    }

    const handleResetPasswordSubmit = async () => {
      try {
        await resetFormRef.value.validate()
        const userId = userList.value.find(u => u.username === resetForm.username)?.id
        await service.put(`/user/${userId}/reset-password`, resetForm)
        ElMessage.success('重置密码成功')
        showResetDialog.value = false
      } catch (err) {
        console.error('重置密码失败:', err)
      }
    }

    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除该用户吗？', '警告', {
        type: 'warning'
      })
        .then(async () => {
          try {
            const res = await service.delete(`/user/${row.id}`)
            if (res.code === 200) {
              ElMessage.success('删除用户成功')
              getUserList()
            } else {
              ElMessage.error(res.msg || '删除用户失败')
            }
          } catch (err) {
            console.error('删除用户失败:', err)
            ElMessage.error('删除用户失败')
          }
        })
        .catch(() => {})
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }
    
    // 获取序号（考虑分页）
    const getIndex = (index) => {
      return (pagination.current - 1) * pagination.size + index + 1
    }

    onMounted(() => {
      getUserList()
    })
    // 处理分页大小变化
    const handleSizeChange = async (size) => {
      pagination.size = size
      await getUserList()
    }

    const handleCurrentChange = async (current) => {
      pagination.current = current
      await getUserList()
    }
    // 处理全选/取消全选
    const handleSelectAll = () => {
      if (tableRef.value) {
        tableRef.value.clearSelection()
        
        selectedRowIds.value.clear()
        userList.value.forEach(row => {
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
    // 处理行选择变化
    const handleSelectionChange = (selection) => {
      selectedRowIds.value.clear()
      selection.forEach(row => {
        selectedRowIds.value.add(row.id)
      })
    }
    // 处理批量删除
    const handleBatchDelete = async () => {
      if (selectedRowIds.value.size === 0) {
        ElMessage.warning('请先选择要删除的用户')
        return
      }
      
      ElMessageBox.confirm(`确定要删除选中的 ${selectedRowIds.value.size} 个用户吗？`, '警告', {
        type: 'warning'
      })
        .then(async () => {
          try {
            const userIds = Array.from(selectedRowIds.value)
            await service.delete('/user/batch', { params: { userIds } })
            ElMessage.success('批量删除用户成功')
            selectedRowIds.value.clear()
            getUserList()
          } catch (err) {
            console.error('批量删除用户失败:', err)
            ElMessage.error('批量删除用户失败')
          }
        })
        .catch(() => {})
    }

    // 导出用户信息
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
        const response = await fetch(`/api/user/export?${params.toString()}`, {
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
        a.download = `用户信息_${timestamp}.xlsx`
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

    const handleDeleteAll = async () => {
      ElMessageBox.confirm('确定要删除全部用户吗？此操作将保留至少一个管理员账户。', '警告', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false
      })
        .then(async () => {
          // 二次确认
          ElMessageBox.confirm('您确定要继续删除全部用户吗？此操作不可撤销。', '警告', {
            type: 'warning',
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            closeOnClickModal: false
          })
            .then(async () => {
              try {
                // 获取当前登录用户的信息
                const currentUser = JSON.parse(localStorage.getItem('user'))
                
                // 获取所有用户
                const res = await service.get('/user/list', {
                  params: {
                    current: 1,
                    size: pagination.total,
                    keyword: ''
                  }
                })
                
                // 过滤掉当前登录用户和其他管理员
                const userIds = res.data.records
                  .filter(row => {
                    // 保留当前登录用户
                    if (row.id === currentUser.id) {
                      return false
                    }
                    
                    // 如果是管理员，并且当前登录用户不是管理员，则保留
                    if (row.role === 'admin' && currentUser.role !== 'admin') {
                      return false
                    }
                    
                    return true
                  })
                  .map(row => row.id)
                
                if (userIds.length > 0) {
                  await service.delete('/user/batch', { params: { userIds } })
                  ElMessage.success('删除全部用户成功')
                  getUserList()
                } else {
                  ElMessage.warning('没有可删除的用户')
                }
              } catch (err) {
                console.error('删除全部用户失败:', err)
                ElMessage.error('删除全部用户失败')
              }
            })
            .catch(() => {
              ElMessage.info('已取消删除全部用户')
            })
        })
        .catch(() => {
          ElMessage.info('已取消删除全部用户')
        })
    }

    const handleAvatarError = (row) => {
      editForm.avatar = ''
      viewForm.avatar = ''
      if (row) {
        row.avatar = ''
      }
    }

    const clearAvatar = () => {
      editForm.avatar = ''
      avatarFileList.value = []
    }

    const handleAvatarFileChange = async (file) => {
      if (!file.raw) return
      
      const formData = new FormData()
      formData.append('file', file.raw)
      
      try {
        const res = await service.post('/user/upload-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        editForm.avatar = res.data
        ElMessage.success('头像上传成功')
        avatarFileList.value = []
      } catch (err) {
        console.error('头像上传失败:', err)
        ElMessage.error('头像上传失败')
      }
    }

    const viewLargeAvatar = (avatar) => {
      if (avatar && avatar !== '' && avatar !== '未设置' && (avatar.startsWith('http://')
       || avatar.startsWith('https://') || avatar.startsWith('/'))) {
        const images = [avatar]
        ElImageViewer({ images, initialIndex: 0 })
      }
    }

    return {
      loading,
      userList,
      searchText,
      showEditDialog,
      showViewDialog,
      showResetDialog,
      showExportDialog,
      showManagement,
      tableRef,
      selectedRowIds,
      editFormRef,
      resetFormRef,
      editForm,
      viewForm,
      resetForm,
      pagination,
      editRules,
      resetRules,
      handleEdit,
      handleEditSubmit,
      handleView,
      handleResetPassword,
      handleResetPasswordSubmit,
      handleDelete,
      handleSelectionChange,
      handleSelectAll,
      handleDeselectAll,
      handleBatchDelete,
      handleDeleteAll,
      handleExport,
      handleAvatarError,
      handleAvatarFileChange,
      clearAvatar,
      viewLargeAvatar,
      getUserList,
      handleSizeChange,
      handleCurrentChange,
      getIndex,
      formatDate,
      defaultAvatar,
      avatarFileList,
      Search,
      Upload,
      IceCreamRound,
      Male,
      Female,
      InfoFilled,
    }
  }
}
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.page-header p {
  color: #606266;
  font-size: 14px;
}

.content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  min-height: 400px;
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

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar .el-input {
    width: 100% !important;
  }
  
  .management-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .management-bar .el-button {
    width: 100%;
  }
}

.gender-tags {
  display: flex;
  gap: 10px;
}

.gender-tags .el-tag {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 10px;
}

.gender-tags .el-tag .el-icon {
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  margin-inline-end: 2px;
}

.management-bar {
  display: flex;
  margin-left: auto;
  gap: 5px;
  align-items: center;
}

.avatar-section {
  text-align: center;
}

.avatar-preview-box {
  margin-bottom: 10px;
  text-align: center;
}

.avatar-upload-container {
  display: flex;
  align-items: flex-start;
  gap: 20px;
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

.avatar-url-input {
  margin-top: 10px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border: 1px solid #dcdde6;
}



</style>
