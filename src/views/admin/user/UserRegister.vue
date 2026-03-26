<template>
  <div class="user-register">
    <div class="page-header">
      <h2>用户注册</h2>
      <p>注册新用户</p>
    </div>
    <div class="content">
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addRules"
        label-width="120px"
        style="max-width: 800px; margin: 0 auto"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="学号/工号" prop="studentId">
          <el-input v-model="addForm.studentId" placeholder="请输入学号或工号" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="addForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="addForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="addForm.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
            <el-radio :value="0">未知</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="addForm.role">
            <el-radio value="student">学生</el-radio>
            <el-radio value="teacher">教师</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="addForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAddSubmit">保存</el-button>
          <el-button type="warning" @click="handleBatchAdd" style="margin-left: 20px">批量添加</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-dialog
      v-model="showBatchAddDialog"
      title="批量添加用户"
      width="600px"
    >
      <el-alert
        title="请按以下格式输入用户数据（JSON格式）"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #default>
          <pre style="margin: 10px 0; padding: 10px; background: #f5f7fa; border-radius: 4px; overflow: auto">
 //注：username可为空；gender字段为1时为男，2时为女，0时为未知；
 //role字段为student时为学生，teacher时为教师，admin时为管理员；
 //status字段为1时为正常，0时为禁用           
[
  {
    "username": "user1", 
    "password": "123456Aa",
    "studentId": "2024001",
    "realName": "张三",
    "email": "user1@example.com",
    "phone": "13800138001",
    "gender": 1, 
    "role": "student", 
    "status": 1 
  },
  {
    "username": "user2",
    "password": "123456Aa",
    "studentId": "2024002",
    "realName": "李四",
    "email": "user2@example.com",
    "phone": "13800138002",
    "gender": 2,
    "role": "teacher",
    "status": 1
  }
]</pre
          >
        </template>
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="用户数据">
          <el-input
            v-model="batchData"
            type="textarea"
            :rows="10"
            placeholder="请输入JSON格式的用户数据"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchAddSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import service from '@/api/request'
import { Plus, Upload } from '@element-plus/icons-vue'

export default {
  name: 'UserRegister',
  setup() {
    const showAddDialog = ref(false)
    const showBatchAddDialog = ref(false)
    const addFormRef = ref(null)

    const addForm = reactive({
      username: '',
      password: '',
      studentId: '',
      realName: '',
      email: '',
      phone: '',
      gender: 0,
      role: 'student',
      status: 1
    })

    const batchData = ref('')

    const addRules = reactive({
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 8, message: '密码长度至少 8 位', trigger: 'blur' },
        { 
          pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
          message: '密码必须包含字母和数字', 
          trigger: 'blur' 
        }
      ],
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

    const handleAddSubmit = async () => {
      try {
        await addFormRef.value.validate()
        const res = await service.post('/user/add', addForm)
        if (res.code === 200) {
          ElMessage.success('添加用户成功')
          addFormRef.value.resetFields()// 重置表单字段，字段多时手动清空字段值
          addForm.username = ''
          addForm.password = ''
          addForm.studentId = ''
          addForm.realName = ''
          addForm.email = ''
          addForm.phone = ''
          addForm.gender = 0
          addForm.role = 'student'
          addForm.status = 1
        } else {
          ElMessage.error(res.msg || '添加用户失败')
        }
      } catch (err) {
        console.error('添加用户失败:', err)
        ElMessage.error('添加用户失败')
      }
    }

    const handleBatchAdd = () => {
      batchData.value = ''
      showBatchAddDialog.value = true
    }

    const handleBatchAddSubmit = async () => {
      try {
        const users = JSON.parse(batchData.value)
        if (!Array.isArray(users)) {
          throw new Error('数据格式错误，必须是数组')
        }
        const res = await service.post('/user/batch', users)
        if (res.code === 200) {
          ElMessage.success('批量添加成功')
          showBatchAddDialog.value = false
          batchData.value = ''
        } else {
          ElMessage.error('批量添加失败')
        }
      } catch (err) {
        console.error('批量添加失败:', err)
        ElMessage.error(err.message || '批量添加失败')
      }
    }

    return {
      showAddDialog,
      showBatchAddDialog,
      addFormRef,
      addForm,
      batchData,
      addRules,
      handleAddSubmit,
      handleBatchAdd,
      handleBatchAddSubmit,
      Plus,
      Upload
    }
  }
}
</script>

<style scoped>
.user-register {
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

@media (max-width: 768px) {
  .user-register {
    padding: 15px;
  }
  
  .page-header h2 {
    font-size: 20px;
  }
  
  .page-header p {
    font-size: 13px;
  }
  
  .content {
    padding: 15px;
  }
  
  .el-form {
    max-width: 100% !important;
  }
  
  .el-form-item__label {
    font-size: 13px !important;
  }
}
</style>
