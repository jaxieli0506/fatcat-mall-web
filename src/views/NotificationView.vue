<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'

const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const message = ref('')

// 使用 store 的狀態
const notifications = computed(() => notificationStore.userNotifications)
const loading = computed(() => notificationStore.userLoading)
const error = computed(() => notificationStore.userError)

// 取得通知列表
async function fetchNotifications() {
  const user = localStorage.getItem('user')
  const userId = user ? JSON.parse(user).userId : null
   
  if (!userId || !authStore.isAuthenticated) {
    message.value = '請先登入'
    return
  }
  
  try {
    await notificationStore.fetchUserNotifications(userId)
    if (error.value) {
      message.value = error.value
    }
  } catch (e) {
    message.value = '取得通知失敗'
  }
}

// 單一通知標為已讀
async function markAsRead(notification) {
  console.log('標記通知為已讀:', notification)
  console.log('通知 ID:', notification.notificationId)
  try {
    await notificationStore.markUserAsRead(notification)
    message.value = '已標為已讀'
    // 清除訊息
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (e) {
    message.value = '標為已讀失敗'
  }
}

// 全部標為已讀
async function markAllAsRead() {
  try {
    await notificationStore.markAllUserAsRead()
    message.value = '全部已標為已讀'
    // 清除訊息
    setTimeout(() => {
      message.value = ''
    }, 2000)
  } catch (e) {
    message.value = '標為已讀失敗'
  }
}

// 格式化時間
function formatTime(timeString) {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// 取得通知類型標籤
function getNotificationTypeLabel(type) {
  const types = {
    1: '訂單相關',
    2: '付款相關',
    3: '物流相關',
    4: '優惠券相關',
    5: '客訴相關',
    6: '系統公告',
    7: '促銷活動',
    8: '退款相關',
    9: '評論相關'
  }
  return types[type] || '未知類型'
}

// 取得通知類型顏色
function getNotificationTypeColor(type) {
  const colors = {
    1: 'bg-primary',    // 訂單相關
    2: 'bg-success',    // 付款相關
    3: 'bg-info',       // 物流相關
    4: 'bg-warning',    // 優惠券相關
    5: 'bg-danger',     // 客訴相關
    6: 'bg-secondary',  // 系統公告
    7: 'bg-primary',    // 促銷活動
    8: 'bg-warning',    // 退款相關
    9: 'bg-info'        // 評論相關
  }
  return colors[type] || 'bg-secondary'
}

onMounted(fetchNotifications)
</script>

<template>
  <div class="container">
    <h2><i class="fas fa-bell me-2"></i>我的通知</h2>
    
    <!-- 訊息提示 -->
    <div v-if="message" class="alert" :class="message.includes('成功') || message.includes('已讀') ? 'alert-success' : 'alert-danger'">
      {{ message }}
    </div>
    
    <!-- 載入中 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">載入中...</span>
      </div>
    </div>
    
    <!-- 通知內容 -->
    <div v-else>
      <!-- 全部標為已讀按鈕 -->
      <div class="mb-3 text-end">
        <button 
          class="btn btn-outline-primary" 
          @click="markAllAsRead" 
          :disabled="!notifications.some(n => !n.isRead)"
        >
          <i class="fas fa-check-double me-2"></i>全部標為已讀
        </button>
      </div>
      
      <!-- 通知列表 -->
      <div v-if="notifications.length">
        <div class="list-group">
          <div v-for="n in notifications" :key="n.notificationId"
               class="list-group-item"
               :class="!n.isRead ? 'list-group-item-info border-start border-4 border-info' : ''">
            <div class="d-flex w-100 justify-content-between">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                  <h6 class="card-title mb-0 me-2">{{ n.title }}</h6>
                  <span class="badge" :class="getNotificationTypeColor(n.notificationType)">
                    {{ getNotificationTypeLabel(n.notificationType) }}
                  </span>
                  <span v-if="!n.isRead" class="badge bg-danger ms-2">未讀</span>
                </div>
                <p class="mb-1 text-muted">{{ n.description }}</p>
                <small class="text-muted">
                  <i class="fas fa-clock me-1"></i>
                  {{ formatTime(n.time) }}
                </small>
                <span v-if="n.isRead && n.readTime" class="badge bg-success ms-2">
                  已讀於 {{ formatTime(n.readTime) }}
                </span>
              </div>
              <div class="ms-3">
                <button v-if="!n.isRead" 
                        @click="markAsRead(n)" 
                        class="btn btn-outline-success btn-sm">
                  <i class="fas fa-check me-1"></i>標為已讀
                </button>
                <span v-else class="text-success">
                  <i class="fas fa-check-circle me-1"></i>已讀
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空狀態 -->
      <div v-else class="text-center py-5">
        <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
        <h4 class="text-muted">目前沒有通知</h4>
        <p class="text-muted">當有新的通知時，會顯示在這裡</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 80%; margin: 40px auto; }
</style>