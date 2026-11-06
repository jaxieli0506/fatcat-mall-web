<script setup>
import { onMounted, ref, computed } from 'vue'
import api from '@/services/jjapi'
import { useAdminAuthStore } from '@/stores/adminauth'
import { useNotificationStore } from '@/stores/notification'

const adminAuthStore = useAdminAuthStore()
const notificationStore = useNotificationStore()

// 發送通知相關
const title = ref('')
const description = ref('')
const receiverType = ref('all_users') // 預設
const receiverIds = ref([]) // 若選特定對象
const notificationType = ref(6) // 例如 6=系統公告
const sending = ref(false)
const message = ref('')

// 查看通知相關
const activeTab = ref('view') // 'send' 或 'view'

// 使用 store 的通知資料
const notifications = computed(() => notificationStore.notifications)
const loading = computed(() => notificationStore.loading)

// 通知類型選項
const notificationTypes = [
  { value: 1, label: '訂單相關' },
  { value: 2, label: '付款相關' },
  { value: 3, label: '物流相關' },
  { value: 4, label: '優惠券相關' },
  { value: 5, label: '客訴相關' },
  { value: 6, label: '系統公告' },
  { value: 7, label: '促銷活動' },
  { value: 8, label: '退款相關' },
  { value: 9, label: '評論相關' }
]

// 取得管理員通知列表
async function fetchNotifications() {
  const admin = localStorage.getItem('adminUser')
  const adminId = admin ? JSON.parse(admin).adminId : null
  if(!adminId) {
    message.value = '請先登入'
    return
  }
  
  await notificationStore.fetchAdminNotifications(adminId)
  if (notificationStore.error) {
    message.value = notificationStore.error
  }
}

// 單一通知標為已讀
async function markAsRead(notification) {
  try {
    await notificationStore.markAsRead(notification)
    message.value = '已標為已讀'
  } catch (e) {
    message.value = '標為已讀失敗'
  }
}

// 全部標為已讀
async function markAllAsRead() {
  try {
    await notificationStore.markAllAsRead()
    message.value = '全部已標為已讀'
  } catch (e) {
    message.value = '標為已讀失敗'
  }
}

// 常用範例
function fillTemplate(t, d, type = 6) {
  title.value = t
  description.value = d
  notificationType.value = type
}

// 發送通知
async function sendNotification() {
  if (!title.value || !description.value) {
    message.value = '請填寫標題與內容'
    return
  }
  sending.value = true
  try {
    await api.post('/Notifications/Send', {
      title: title.value,
      description: description.value,
      notificationType: notificationType.value,
      receiverType: receiverType.value,
      receiverIds: receiverType.value === 'specific' ? receiverIds.value : []
    })
    message.value = '發送成功！'
    // 清空表單
    title.value = ''
    description.value = ''
    receiverIds.value = []
    // 重新取得通知(讓右上角鈴鐺顯示未讀數量)
    fetchNotifications()
  } catch (e) {
    message.value = '發送失敗'
  }
  sending.value = false
}

// 格式化時間
function formatTime(timeString){
  if(!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-TW',{
    year:'numeric',
    month:'2-digit',
    day:'2-digit',
    hour:'2-digit',
    minute:'2-digit',
    hour12:false
  })
}

// 取得通知類型標籤
function getNotificationTypeLabel(type){
  const found = notificationTypes.find(t=>t.value === type)
  return found ? found.label : '未知類型'
}

// 取得通知類型顏色
function getNotificationTypeColor(type){
  const colors = {
    1: 'primary',   // 訂單相關
    2: 'success',   // 付款相關
    3: 'info',      // 物流相關
    4: 'warning',   // 優惠券相關
    5: 'danger',    // 客訴相關
    6: 'secondary', // 系統公告
    7: 'primary',   // 促銷活動
    8: 'warning',   // 退款相關
    9: 'info'       // 評論相關
  }
  return colors[type] || 'secondary'
}

onMounted(()=> {
  fetchNotifications()
})
</script>

<template>
  <div class="container-fluid">
    <h2><i class="fas fa-bell me-2"></i>通知管理</h2>

    <!-- 訊息提示 -->
    <div v-if="message" class="alert" :class="message.includes('成功') || message.includes('已讀') ? 'alert-success' : 'alert-danger'">
      {{ message }}
    </div>

    <!-- 分頁標籤 -->
    <ul class="nav nav-tabs mb-4" id="notificationTabs" role="tablist">
      <li class="nav-item" role="presentation">
      <button class="nav-link" :class="{ active:activeTab === 'view'}"
           @click="activeTab = 'view'" type="button">
      <i class="fas fa-list me-2"></i>我的通知
      </button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" :class="{ active: activeTab === 'send' }" 
                @click="activeTab = 'send'" type="button">
          <i class="fas fa-paper-plane me-2"></i>發送通知
        </button>
      </li>
    </ul>

    <!-- 查看通知分頁 -->
    <div v-if="activeTab === 'view'" class="tab-content">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>我的通知列表</h4>
        <button v-if="notifications.filter(n => !n.isRead).length > 0" 
                @click="markAllAsRead" class="btn btn-outline-primary btn-sm">
          <i class="fas fa-check-double me-1"></i>全部標為已讀
        </button>
      </div>
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
      </div>
      <div v-else-if="notifications.length === 0" class="text-center py-4">
        <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
        <p class="text-muted">目前沒有任何通知</p>
      </div>

      <div v-else class="notification-list">
        <div v-for="notification in notifications" :key="notification.receiverId" 
             class="card mb-3" :class="{ 'border-primary': !notification.isRead }">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1">
                <div class="d-flex align-items-center mb-2">
                   <h6 class="card-title mb-0 me-2">{{ notification.title }}</h6>
                    <span class="badge" :class="`bg-${getNotificationTypeColor(notification.notificationType)}`">
                      {{ getNotificationTypeLabel(notification.notificationType) }}
                    </span>
                    <span v-if="!notification.isRead" class="badge bg-danger ms-2">未讀</span>
                </div>
                <p class="card-text text-muted">{{ notification.description }}</p>
                <small class="text-muted">
                  <i class="fas fa-clock me-1"></i>{{ formatTime(notification.time) }}
                </small>
              </div>
              <div class="ms-3">
                <button v-if="!notification.isRead" 
                        @click="markAsRead(notification)" 
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


    </div>
          <!-- 發送通知分頁 -->
      <div v-if="activeTab === 'send'" class="tab-content">
        <form @submit.prevent="sendNotification">
          <div class="mb-3">
            <label class="form-label">通知標題 <span class="text-danger">*</span></label>
            <input v-model="title" maxlength="50" class="form-control" required>
            <div class="form-text">{{ title.length }}/50 字元</div>
          </div>
          <div class="mb-3">
            <label class="form-label">通知內容 <span class="text-danger">*</span></label>
            <textarea v-model="description" maxlength="100" class="form-control" rows="4" required></textarea>
            <div class="form-text">{{ description.length }}/100 字元</div>
          </div>
          <div class="mb-3">
            <label class="form-label">通知類型 <span class="text-danger">*</span></label>
            <select v-model="notificationType" class="form-select">
              <option v-for="type in notificationTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">通知對象 <span class="text-danger">*</span></label>
            <select v-model="receiverType" class="form-select">
              <option value="all_admins">所有管理員</option>
              <option value="all_users">所有使用者</option>
              <option value="specific">特定對象</option>
            </select>
          </div>
          <div v-if="receiverType === 'specific'" class="mb-3">
            <label class="form-label">請輸入 UserId（可多選, 以逗號分隔）</label>
            <input class="form-control" @input="e => receiverIds.value = e.target.value.split(',').map(s => parseInt(s.trim())).filter(Boolean)" placeholder="例如：1001,1002,1003">
          </div>
          <div v-if="notificationType === 6" class="mb-3">
            <button type="button" class="btn btn-outline-secondary me-2" @click="fillTemplate('系統維護公告', '系統將於今晚23:00-01:00進行維護，請提前保存工作。')">維護公告</button>
            <button type="button" class="btn btn-outline-secondary me-2" @click="fillTemplate('系統更新通知', '系統已更新至新版本，新增了多項功能改進。')">更新通知</button>
            <button type="button" class="btn btn-outline-secondary me-2" @click="fillTemplate('緊急系統公告', '發現系統異常，請暫停相關操作，技術人員正在處理中。')">緊急公告</button>
            <button type="button" class="btn btn-outline-secondary" @click="fillTemplate('系統恢復正常', '系統維護已完成，所有功能已恢復正常，感謝您的耐心等待。')">恢復通知</button>
          </div>
          <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="submit" class="btn btn-warning" :disabled="sending">
              <i class="fas fa-paper-plane me-2"></i>發送通知
            </button>
          </div>
        </form>
      </div>
  </div>
</template>

<style scoped>
.notification-list .card.border-primary {
  border-width: 2px;
}
</style>