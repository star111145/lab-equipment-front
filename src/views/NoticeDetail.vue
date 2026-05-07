<template>
  <div class="notice-detail-page">
    <div class="notice-container">
      <el-card class="notice-card">
        <div class="notice-header">
          <div class="notice-header-top">
            <el-button type="primary" link @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
          </div>
          <h1 class="notice-title">{{ notice.title }}</h1>
          <div class="notice-meta">
            <span class="notice-creator">
              <el-icon><User /></el-icon>
              {{ notice.creatorName || '未知' }}
            </span>
            <span class="notice-time">
              <el-icon><Clock /></el-icon>
              {{ formatDate(notice.createTime) }}
            </span>
          </div>
        </div>
        <el-divider />
        <div class="notice-content">
          {{ notice.content }}
        </div>
        <div class="notice-navigation">
          <div class="nav-row">
            <div class="nav-item prev" v-if="adjacentNotices.prev" @click="goToNotice(adjacentNotices.prev.id)">
              <el-icon><ArrowLeft /></el-icon>
              <div class="nav-text">
                <span class="nav-label">上一篇</span>
                <span class="nav-title">{{ adjacentNotices.prev.title }}</span>
              </div>
            </div>
            <div class="nav-placeholder" v-else></div>
            
            <div class="nav-item next" v-if="adjacentNotices.next" @click="goToNotice(adjacentNotices.next.id)">
              <div class="nav-text">
                <span class="nav-label">下一篇</span>
                <span class="nav-title">{{ adjacentNotices.next.title }}</span>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="nav-placeholder" v-else></div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, User, Clock } from '@element-plus/icons-vue'
import service from '@/api/request'

export default {
  name: 'NoticeDetail',
  components: {
    ArrowLeft,
    ArrowRight,
    User,
    Clock
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const notice = ref({})
    const adjacentNotices = ref({ prev: null, next: null })

    const loadNotice = async () => {
      const noticeId = route.query.id
      if (!noticeId) {
        router.push('/platform/home')
        return
      }
      
      try {
        const res = await service.get(`/notice/${noticeId}`)
        if (res.data) {
          notice.value = res.data
        }
        loadAdjacentNotices(noticeId)
      } catch (error) {
        console.error('获取公告详情失败:', error)
      }
    }

    const loadAdjacentNotices = async (id) => {
      try {
        const res = await service.get(`/notice/adjacent/${id}`)
        if (res.data) {
          adjacentNotices.value = res.data
        }
      } catch (error) {
        console.error('获取相邻公告失败:', error)
      }
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

    const goBack = () => {
      router.push('/platform/home')
    }

    const goToNotice = (id) => {
      router.push({ path: '/platform/notice', query: { id } })
    }

    watch(() => route.query.id, () => {
      if (route.path === '/platform/notice') {
        loadNotice()
      }
    })

    onMounted(() => {
      loadNotice()
    })

    return {
      notice,
      adjacentNotices,
      formatDate,
      goBack,
      goToNotice
    }
  }
}
</script>

<style scoped>
.notice-detail-page {
  min-height: calc(100vh - 120px);
  padding: 20px;
  background-color: #f5f7fa;
}

.notice-container {
  max-width: 900px;
  margin: 0 auto;
}

.notice-card {
  border-radius: 8px;
}

.notice-header {
  padding: 20px 0;
}

.notice-header-top {
  margin-bottom: 20px;
}

.notice-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
  line-height: 1.5;
  text-align: center;
}

.notice-meta {
  display: flex;
  justify-content: center;
  gap: 30px;
  color: #909399;
  font-size: 14px;
}

.notice-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.notice-content {
  padding: 30px 20px;
  font-size: 16px;
  line-height: 2;
  color: #303133;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 200px;
}

.notice-navigation {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  margin-top: 20px;
}

.nav-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.nav-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  background: #f5f7fa;
}

.nav-item:hover {
  background: #ecf5ff;
}

.nav-placeholder {
  flex: 1;
}

.nav-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.nav-label {
  font-size: 12px;
  color: #909399;
}

.nav-title {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
