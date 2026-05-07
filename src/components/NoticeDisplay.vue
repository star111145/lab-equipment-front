<template>
  <div class="notice-display">
    <div class="notice-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索公告标题"
        clearable
        @clear="loadNotices"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    <div v-if="loading" style="text-align: center; padding: 20px;">
      <el-icon class="is-loading"><Loading /></el-icon>
    </div>
    <div v-else-if="noticeList.length === 0" class="no-notice">
      暂无公告
    </div>
    <div v-else class="notice-list">
      <div 
        v-for="notice in noticeList" 
        :key="notice.id" 
        class="notice-item"
        @click="goToNoticeDetail(notice)"
      >
        <div class="notice-title">
          <el-icon><Bell /></el-icon>
          <span>{{ notice.title }}</span>
        </div>
        <div class="notice-time">{{ formatDate(notice.createTime) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Loading, Bell, Search } from '@element-plus/icons-vue'
import service from '@/api/request'

export default {
  name: 'NoticeDisplay',
  components: {
    Loading,
    Bell,
    Search
  },
  setup() {
    const router = useRouter()
    const noticeList = ref([])
    const loading = ref(false)
    const searchKeyword = ref('')

    const loadNotices = async () => {
      loading.value = true
      try {
        const res = await service.get('/notice/list', {
          params: { current: 1, size: 10, keyword: searchKeyword.value }
        })
        if (res.data && res.data.records) {
          noticeList.value = res.data.records || []
        }
      } catch (error) {
        console.error('获取公告列表失败:', error)
      } finally {
        loading.value = false
      }
    }

    const handleSearch = () => {
      loadNotices()
    }

    const goToNoticeDetail = (notice) => {
      router.push({ path: '/platform/notice', query: { id: notice.id } })
    }

    const formatDate = (dateTime) => {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    }

    onMounted(() => {
      loadNotices()
    })

    return {
      noticeList,
      loading,
      searchKeyword,
      handleSearch,
      goToNoticeDetail,
      formatDate,
      loadNotices
    }
  }
}
</script>

<style scoped>
.notice-display {
  width: 100%;
}

.notice-search {
  margin-bottom: 15px;
}

.no-notice {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notice-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.notice-item:hover {
  background: #ecf5ff;
  transform: translateX(5px);
}

.notice-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #303133;
}

.notice-title .el-icon {
  color: #409eff;
}

.notice-time {
  font-size: 12px;
  color: #909399;
}
</style>
