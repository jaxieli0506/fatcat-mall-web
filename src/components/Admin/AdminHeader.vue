<script setup>
import { ref, onMounted, onUnmounted, computed, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminAuthStore } from '@/stores/adminauth';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const adminAuthStore = useAdminAuthStore();
const notificationStore = useNotificationStore();
const currentTime = ref('');
let timer = null;
const isDropdownOpen = ref(false);
const adminInfo = ref(null);

// 注入側邊欄切換函數和狀態
const toggleSidebar = inject('toggleSidebar');
const isSidebarCollapsed = inject('isSidebarCollapsed', ref(false));

// 使用 store 的未讀通知數量
const unreadCount = computed(() => notificationStore.unreadCount);

const welcomeMessage = computed(() => {
  if (adminInfo.value && adminInfo.value.name) {
    return ` ${adminInfo.value.name}，您好`;
  }
  return '管理員，您好';
});

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const logout = async () => {
  await adminAuthStore.logout();
  router.push('/admin/login');
};

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '-');
};

// 取得未讀通知數量
async function fetchUnreadCount(){
  const admin = localStorage.getItem('adminUser');
  const adminId = admin? JSON.parse(admin).adminId:null;
  if(!adminId){
    console.log('無法從localstorage 取得 adminId，未讀通知數量設為 0')
    return
  }
  if(!adminAuthStore.isAuthenticated){
    console.log('未登入，未讀通知數量設為 0');
    return;
  }
  await notificationStore.fetchAdminNotifications(adminId);
}

// 點擊通知按鈕跳轉到通知頁面
function goToNotification(){
  router.push({ name: 'AdminNotifications'})
}

onMounted(() => {
  const storedAdmin = localStorage.getItem('adminUser');
  if (storedAdmin) {
    adminInfo.value = JSON.parse(storedAdmin);
  }
  updateTime();
  timer = setInterval(updateTime, 1000);

  // 取得未讀通知數量
  fetchUnreadCount();
});

onUnmounted(() => {
  clearInterval(timer);
});

// 如果有登入狀態變化, 重新取得未讀數量
watch(()=> adminAuthStore.isAuthenticated, (newVal)=>{
  if(newVal){
    fetchUnreadCount();
  }else{
    notificationStore.clearNotifications();
  }
});
</script>

<template>
  <header class="admin-header">
    <div class="header-left">
      <button class="sidebar-toggle-btn" @click="toggleSidebar">
        <i class="bi" :class="isSidebarCollapsed ? 'bi-arrow-right' : 'bi-list'"></i>
      </button>
      <div class="search-bar">
        <i class="bi bi-search"></i>
        <input type="text" placeholder="搜尋功能...">
      </div>
    </div>
    <div class="header-right">
      <span class="user-info">{{ welcomeMessage }}</span>
      <div class="divider"></div>
      <span class="date-time">{{ currentTime }}</span>
      <div class="divider"></div>
      <div class="icon-group">
        <!-- 通知按鈕 -->
         <button type="button" class="btn btn-primary position-relative notification-btn" @click="goToNotification" title="通知">
          <i class="bi bi-bell-fill"></i>
          <span v-if="unreadCount > 0 " 
            class="position-absolute top-0 start-100 badge rounded-pill bg-danger"
            style="transform: translate(-50%,2%);">
            {{ unreadCount > 99 ? '99+': unreadCount }}
            <span class="visually-hidden">unread message</span>
          </span>
         </button>
        
        <div class="profile-section">
          <i class="bi bi-person-circle" @click="toggleDropdown"></i>
          
          <div v-if="isDropdownOpen" class="profile-dropdown">
            <button @click="logout" class="dropdown-item logout-btn">登出</button>
          </div>
        </div>

      </div>
    </div>
  </header>
</template>

<style scoped>
.admin-header {
  height: 70px;
  background-color: #515050;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  flex-shrink: 0;
}
.header-left, .header-right, .search-bar, .icon-group {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.sidebar-toggle-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #f6f7f7;
  transition: transform 0.3s ease;
}

.sidebar-toggle-btn:hover {
  transform: scale(1.1);
}

.sidebar-toggle-btn i {
  transition: transform 0.3s ease;
}
.search-bar {
  background-color: #f8f9fa;
  border-radius: 20px;
  padding: 0.5rem 1rem;
}
.search-bar i { color: #6c757d; }
.search-bar input {
  border: none;
  background: none;
  outline: none;
  padding-left: 0.5rem;
}
.user-info, .date-time {
    font-size: 0.9rem;
    color: #ffffff;
}
.divider {
  width: 1px;
  height: 20px;
  background-color: #dee2e6;
}
.icon-group i {
  font-size: 1.2rem;
  cursor: pointer;
  color: #ffffff;
}
/* 通知按鈕樣式 */
.notification-btn {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.2rem;
  transition: color 0.3s ease;
  padding: 0.5rem;
}

.notification-btn:hover {
  color: #ffe0f0;
  background: none;
  border: none;
}

.notification-btn:focus {
  box-shadow: none;
}
/* --- 下拉選單樣式 --- */
.profile-section {
  position: relative;
}
.profile-dropdown {
  position: absolute;
  top: 150%; 
  right: 0;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
  border: 1px solid #dee2e6;
  width: 180px;
  z-index: 100;
  padding: 0.5rem 0;
}
.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1.25rem;
  text-align: left;
  color: #212529;
  text-decoration: none;
  background: none;
  border: none;
  font-size: 1rem;
}
.dropdown-item:hover {
  background-color: #f8f9fa;
}
.dropdown-divider {
  height: 1px;
  margin: 0.5rem 0;
  overflow: hidden;
  background-color: #e9ecef;
}
.logout-btn {
  color: #dc3545;
}
.logout-btn:hover {
  color: white;
  background-color: #dc3545;
}
</style>