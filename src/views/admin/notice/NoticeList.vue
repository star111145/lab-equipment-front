<template>
  <div class="notice-list">
    <div class="page-header">
      <h2>公告列表</h2>
      <p>查看和管理所有公告</p>
    </div>
    <div class="content">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          placeholder="搜索公告标题/内容"
          clearable
          style="width: 300px"
          @input="getNoticeList"
        >
          <template #suffix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleCreate" style="margin-left: auto;">
          <el-icon><Plus /></el-icon>
          创建公告
        </el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="noticeList"
        style="width: 100%; margin-top: 20px"
        stripe
      >
        <el-table-column type="index" label="序号" width="60" align="center" :index="getIndex" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="creatorName" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ scope.row.createTime ? formatDate(scope.row.createTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="handleView(scope.row)">详情</el-button>
            <el-button type="warning" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next, jumper"
        @current-change="handlePageChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </div>

    <el-dialog
      v-model="viewDialogVisible"
      title="公告详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题">{{ viewForm.title }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ viewForm.creatorName }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">{{ viewForm.content }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewForm.createTime ? formatDate(viewForm.createTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ viewForm.updateTime ? formatDate(viewForm.updateTime) : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import service from '@/api/request'

export default {
  name: 'NoticeList',
  components: {
    Plus,
    Search
  },
  setup() {
    const noticeList = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const viewDialogVisible = ref(false)
    const dialogTitle = ref('创建公告')
    const formRef = ref(null)
    const submitLoading = ref(false)
    const searchText = ref('')
    
    const form = reactive({
      id: null,
      title: '',
      content: '',
      creatorId: null,
      updaterId: null
    })
    
    const viewForm = reactive({
      id: null,
      title: '',
      content: '',
      creatorName: '',
      createTime: '',
      updateTime: ''
    })
    
    const rules = {
      title: [
        { required: true, message: '请输入公告标题', trigger: 'blur' },
        { min: 1, max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
      ],
      content: [
        { required: true, message: '请输入公告内容', trigger: 'blur' },
        { min: 1, max: 1000, message: '内容长度不能超过1000个字符', trigger: 'blur' }
      ]
    }
    
    const getNoticeList = async () => {
      loading.value = true
      try {
        const res = await service.get('/notice/list', {
          params: {
            currentPage: currentPage.value,
            pageSize: pageSize.value,
            keyword: searchText.value
          }
        })
        
        noticeList.value = res.data.records
        total.value = res.data.total
      } catch (error) {
        console.error('获取公告列表失败:', error)
        ElMessage.error('获取公告列表失败')
      } finally {
        loading.value = false
      }
    }
    
    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    }
    
    const getIndex = (index) => {
      return (currentPage.value - 1) * pageSize.value + index + 1
    }
    
    const handleCreate = () => {
      dialogTitle.value = '创建公告'
      form.id = null
      form.title = ''
      form.content = ''
      const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
      form.creatorId = currentUserId
      form.updaterId = null
      dialogVisible.value = true
    }
    
    const handleEdit = (row) => {
      dialogTitle.value = '编辑公告'
      form.id = row.id
      form.title = row.title
      form.content = row.content
      form.creatorId = row.creatorId
      const currentUserId = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null
      form.updaterId = currentUserId
      dialogVisible.value = true
    }
    
    const handleView = (row) => {
      viewForm.id = row.id
      viewForm.title = row.title
      viewForm.content = row.content
      viewForm.creatorName = row.creatorName
      viewForm.createTime = row.createTime
      viewForm.updateTime = row.updateTime
      viewDialogVisible.value = true
    }
    
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        
        submitLoading.value = true
        
        if (form.id) {
          await service.put('/notice', form)
          ElMessage.success('更新公告成功')
        } else {
          await service.post('/notice', form)
          ElMessage.success('创建公告成功')
        }
        
        dialogVisible.value = false
        getNoticeList()
      } catch (error) {
        if (error.response?.data?.msg) {
          ElMessage.error(error.response.data.msg)
        } else {
          ElMessage.error('操作失败')
        }
      } finally {
        submitLoading.value = false
      }
    }
    
    const handleDelete = async (row) => {
      try {
        await ElMessageBox.confirm('确定要删除该公告吗？', '提示', {
          type: 'warning'
        })
        
        await service.delete(`/notice/${row.id}`)
        ElMessage.success('删除公告成功')
        getNoticeList()
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('删除公告失败')
        }
      }
    }
    
    const handleClose = () => {
      dialogVisible.value = false
      formRef.value?.resetFields()
    }
    
    const handlePageChange = (page) => {
      currentPage.value = page
      getNoticeList()
    }
    
    onMounted(() => {
      getNoticeList()
    })
    
    return {
      noticeList,
      loading,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      viewDialogVisible,
      dialogTitle,
      formRef,
      submitLoading,
      getNoticeList,
      searchText,
      form,
      viewForm,
      rules,
      Plus,
      Search,
      handleCreate,
      handleEdit,
      handleView,
      handleSubmit,
      handleDelete,
      handleClose,
      handlePageChange,
      getIndex,
      formatDate
    }
  }
}
</script>

<style scoped>
.notice-list {
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
  justify-content: flex-end;
}
</style>
