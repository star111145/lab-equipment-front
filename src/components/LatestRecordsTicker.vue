<template>
  <div v-if="records.length > 0" class="latest-records-ticker">
    <div class="ticker-content">
      <span class="ticker-label">最新动态：</span>
      <div class="ticker-scroll">
        <div v-for="record in displayRecords" :key="record.id + record.type" class="ticker-item" :class="{ clickable: canClick(record) }" @click="handleClick(record)">
          <span class="ticker-user">{{ record.userName }}</span>
          <span class="ticker-action">{{ getActionText(record.type) }}</span>
          <span class="ticker-equipment">{{ record.equipmentName }}</span>
          <el-tag size="small" :type="getStatusType(record.status)" style="margin-left: 5px;">{{ record.status }}</el-tag>
          <span class="ticker-time">{{ formatRelativeTime(record.createdAt) }}</span>
        </div>
      </div>
      <div v-if="records.length > 3" class="ticker-nav">
        <el-button type="primary" size="small" circle @click="prevPage">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span>
        <el-button type="primary" size="small" circle @click="nextPage">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

export default {
  name: 'LatestRecordsTicker',
  components: {
    ArrowLeft,
    ArrowRight
  },
  props: {
    records: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      currentIndex: 0,
      timer: null,
      isComponentMounted: true
    }
  },
  computed: {
    displayRecords() {
      if (this.records.length <= 3) {
        return this.records
      }
      return this.records.slice(this.currentIndex, this.currentIndex + 3)
    },
    totalPages() {
      return Math.ceil(this.records.length / 3)
    },
    currentPage() {
      return Math.floor(this.currentIndex / 3) + 1
    }
  },
  methods: {
    formatRelativeTime(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      
      if (minutes < 1) {
        return '刚刚'
      } else if (minutes < 60) {
        return `${minutes}分钟前`
      } else if (hours < 24) {
        return `${hours}小时前`
      } else if (days < 7) {
        return `${days}天前`
      } else {
        return dateString.substring(0, 10)
      }
    },
    getActionText(type) {
      switch (type) {
        case 'reservation': return '预约了'
        case 'borrow': return '借用了'
        case 'repair': return '报修了'
        case 'return': return '归还了'
        default: return '操作了'
      }
    },
    getStatusType(status) {
      switch (status) {
        case '待审核': return 'danger'
        case '已同意':
        case '已借出':
        case '已维修':
        case '已归还': return 'success'
        case '已拒绝':
        case '已取消': return 'info'
        case '报修中': return 'warning'
        default: return 'info'
      }
    },
    canClick(record) {
      const role = localStorage.getItem('role') || ''
      if (role === 'admin') {
        return true
      }
      const currentUserId = localStorage.getItem('userId')
      return record.userId && currentUserId && String(record.userId) === String(currentUserId)
    },
    handleClick(record) {
      const role = localStorage.getItem('role') || ''
      
      if (role !== 'admin') {
        const currentUserId = localStorage.getItem('userId')
        if (!record.userId || !currentUserId || String(record.userId) !== String(currentUserId)) {
          this.$message.warning('您只能查看自己的记录，无法查看他人的操作')
          return
        }
      }
      
      if (record.type === 'reservation') {
        if (role === 'admin') {
          this.$router.push({ path: '/platform/equipment/reserve', query: { id: record.id } })
        } else {
          this.$router.push({ path: '/platform/user/reserve', query: { id: record.id } })
        }
      } else if (record.type === 'borrow') {
        if (role === 'admin') {
          this.$router.push({ path: '/platform/equipment/borrow', query: { id: record.id } })
        } else {
          this.$router.push({ path: '/platform/user/borrow', query: { id: record.id } })
        }
      } else if (record.type === 'repair') {
        if (role === 'admin') {
          this.$router.push({ path: '/platform/equipment/repair', query: { id: record.id } })
        } else {
          this.$router.push({ path: '/platform/user/repair', query: { id: record.id } })
        }
      } else if (record.type === 'return') {
        if (role === 'admin') {
          this.$router.push({ path: '/platform/equipment/return', query: { id: record.id } })
        } else {
          this.$router.push({ path: '/platform/user/return', query: { id: record.id } })
        }
      }
    },
    prevPage() {
      this.resetTimer()
      if (this.currentIndex === 0) {
        this.currentIndex = (this.totalPages - 1) * 3
      } else {
        this.currentIndex = Math.max(0, this.currentIndex - 3)
      }
    },
    nextPage() {
      this.resetTimer()
      const nextIndex = this.currentIndex + 3
      if (nextIndex >= this.records.length) {
        this.currentIndex = 0
      } else {
        this.currentIndex = nextIndex
      }
    },
    resetTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
        this.startScroll()
      }
    },
    startScroll() {
      if (this.records.length > 3 && this.isComponentMounted) {
        this.timer = setInterval(() => {
          if (this.isComponentMounted) {
            this.nextPage()
          }
        }, 5000)
      }
    }
  },
  mounted() {
    this.isComponentMounted = true
    this.startScroll()
  },
  beforeUnmount() {
    this.isComponentMounted = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
</script>

<style scoped>
.latest-records-ticker {
  background: linear-gradient(90deg, #409eff 0%, #67c23a 50%, #e6a23c 100%);
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.ticker-content {
  display: flex;
  align-items: center;
  color: #fff;
}

.ticker-label {
  font-weight: bold;
  font-size: 14px;
  margin-right: 15px;
  white-space: nowrap;
}

.ticker-scroll {
  display: flex;
  gap: 15px;
  flex: 1;
  overflow: hidden;
}

.ticker-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  transition: all 0.3s;
  font-size: 13px;
  white-space: nowrap;
}

.ticker-item.clickable {
  cursor: pointer;
}

.ticker-item.clickable:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: translateY(-2px);
}

.ticker-user {
  font-weight: bold;
  color: #fff;
}

.ticker-action {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 3px;
}

.ticker-equipment {
  color: #fff;
  font-weight: 500;
}

.ticker-time {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin-left: 8px;
}

.ticker-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 15px;
}

.ticker-nav .el-button {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.ticker-nav .el-button:hover {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.7);
}

.page-indicator {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 40px;
  text-align: center;
}
</style>
