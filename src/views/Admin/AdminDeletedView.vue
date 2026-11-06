<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAdminAuthStore } from '@/stores/adminauth'
import { useRouter } from 'vue-router'

const adminAuthStore = useAdminAuthStore()
const router = useRouter()

// 響應式資料
const deletedAdmins = ref([])
const loading = ref(false)
const showRestoreModal = ref(false)
const selectedAdmin = ref(null)
const showDetailModal = ref(false)

// 搜尋和篩選
const searchTerm = ref('')
const roleFilter = ref('')
const isSearching = ref(false)

// 角色選項
const roleOptions = [
  { value: '', label: '全部角色' },
  { value: '管理員', label: '管理員' },
  { value: '超級管理員', label: '超級管理員' }
]

// 權限檢查
const canViewDeleted = computed(() => {
  return adminAuthStore.admin?.role === '超級管理員'
})

const canRestore = computed(() => {
  return adminAuthStore.admin?.role === '超級管理員'
})

// 計算屬性：篩選後的已刪除管理員列表
const filteredDeletedAdmins = computed(() => {
  let filtered = deletedAdmins.value

  // 搜尋篩選
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase().trim()
    if (term) {
      filtered = filtered.filter(admin => 
        (admin.name && admin.name.toLowerCase().includes(term)) ||
        (admin.email && admin.email.toLowerCase().includes(term)) ||
        (admin.phone && admin.phone.includes(term))
      )
    }
  }

  // 角色篩選
  if (roleFilter.value !== '') {
    filtered = filtered.filter(admin => admin.role === roleFilter.value)
  }

  return filtered
})

// API 呼叫函數
const fetchDeletedAdmins = async () => {
  loading.value = true
  try {
    const result = await adminAuthStore.fetchDeletedAdmins({
      searchKeyword: searchTerm.value,
      sortBy: 'AdminId',
      sortOrder: 'desc',
      page: 1,
      pageSize: 1000
    })

    console.log('取得已刪除管理員列表:', result) 

    // 防呆
    if (result.success && result.data && Array.isArray(result.data.admins)) {
      deletedAdmins.value = result.data.admins
    } else {
      deletedAdmins.value = []
      console.error('取得已刪除管理員列表失敗:', result.message)
    }
  } catch (error) {
    deletedAdmins.value = []
    console.error('取得已刪除管理員列表時發生錯誤:', error)
  } finally {
    loading.value = false
  }
}

// 復原管理員
const restoreAdmin = async () => {
  try {
    const result = await adminAuthStore.restoreAdmin(selectedAdmin.value.adminId)
    
    if (result.success) {
      showRestoreModal.value = false
      await fetchDeletedAdmins()
      alert('管理員復原成功')
    } else {
      alert(result.message || '復原失敗')
    }
  } catch (error) {
    console.error('復原失敗:', error)
    alert('復原失敗')
  }
}

// 開啟復原管理員 Modal
const openRestoreModal = (admin) => {
  selectedAdmin.value = admin
  showRestoreModal.value = true
}

// 開啟詳細資料 Modal
const openDetailModal = (admin) => {
  selectedAdmin.value = admin
  showDetailModal.value = true
}


// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未提供'
  const date = new Date(dateStr)
  if (isNaN(date)) return '格式錯誤'
  return date.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', 
                                        hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// 防抖搜尋
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

const handleSearch = debounce(() => {
  isSearching.value = true
  setTimeout(() => {
    isSearching.value = false
  }, 200)
}, 300)

// 清除搜尋
const clearSearch = () => {
  searchTerm.value = ''
  isSearching.value = false
}

// 生命週期
onMounted(() => {
  // 權限檢查
  if (!canViewDeleted.value) {
    alert('您沒有權限查看此頁面')
    router.push('/admin/settings')
    return
  }
  
  console.log('AdminDeletedView 已掛載')
  fetchDeletedAdmins()
})
</script>

<template>
  <div class="container-fluid">
    <div class="card shadow-sm">
      <div class="card-header bg-white py-3">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <button 
              @click="$router.push('/admin/settings')" 
              class="btn btn-outline-secondary me-3"
              type="button"
            >
              <i class="bi bi-arrow-left me-1"></i> 返回
            </button>
            <h1 class="h3 mb-0 page-title">
              <i class="fa-solid fa-trash-can fa-bounce"></i> 已刪除的管理員
            </h1>
          </div>
        </div>
      </div>
      
      <div class="card-body">
        <!-- 搜尋和篩選工具列 -->
        <div class="row mb-4">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
              <input 
                v-model="searchTerm"
                type="text" 
                class="form-control" 
                placeholder="搜尋姓名、Email 或電話"
                @keyup="handleSearch"
                @input="handleSearch"
              >
              <button 
                v-if="searchTerm" 
                type="button" 
                class="btn btn-outline-secondary" 
                @click="clearSearch"
                title="清除搜尋"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="col-md-2">
            <select v-model="roleFilter" class="form-select">
              <option v-for="option in roleOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary" @click="fetchDeletedAdmins">
              <i class="fas fa-refresh me-1"></i> 重新整理
            </button>
          </div>
        </div>

        <!-- 搜尋結果統計 -->
        <div class="row mb-3" v-if="searchTerm || roleFilter">
          <div class="col-12">
            <div class="alert alert-info d-flex align-items-center">
              <i class="fas fa-info-circle me-2"></i>
              <span>搜尋結果：顯示 {{ filteredDeletedAdmins.length }} 筆資料</span>
              <span v-if="searchTerm" class="ms-2">（關鍵字：「{{ searchTerm }}」）</span>
            </div>
          </div>
        </div>

        <!-- 已刪除管理員列表表格 -->
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Email</th>
                <th>姓名</th>
                <th>電話</th>
                <th>角色</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredDeletedAdmins.length === 0">
                <td colspan="5" class="text-center py-4 text-muted">
                  <i class="fas fa-trash fa-2x mb-2"></i>
                  <p class="mb-0">沒有找到已刪除的管理員資料</p>
                </td>
              </tr>
              <tr v-else v-for="admin in filteredDeletedAdmins" :key="admin.adminId">
                <td>
                  <strong>{{ admin.email }}</strong>
                  <small class="text-muted d-block">ID: {{ admin.adminId }}</small>
                </td>
                <td>{{ admin.name }}</td>
                <td>{{ admin.phone || '未設定' }}</td>
                <td>
                  <span class="badge bg-primary">
                    {{ admin.role || '未設定' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button 
                      v-if="canRestore"
                      class="btn btn-sm btn-outline-success" 
                      @click="openRestoreModal(admin)"
                      title="復原管理員"
                    >
                      <i class="bi bi-arrow-clockwise me-1"></i>復原
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-info"
                      @click="openDetailModal(admin)"
                      title="詳細資料"
                    >
                      <i class="bi bi-info-circle me-1"></i>詳細資料
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 復原確認 Modal -->
    <div class="modal fade" :class="{ show: showRestoreModal }" :style="{ display: showRestoreModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-arrow-clockwise text-success me-2"></i>確認復原
            </h5>
            <button type="button" class="btn-close" @click="showRestoreModal = false"></button>
          </div>
          <div class="modal-body">
            <p>確定要復原管理員「<strong>{{ selectedAdmin?.name }}</strong>」嗎？</p>
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              復原後，該管理員將重新啟用並可以正常登入系統。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showRestoreModal = false">取消</button>
            <button type="button" class="btn btn-success" @click="restoreAdmin">
              <i class="bi bi-arrow-clockwise me-1"></i>確認復原
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 詳細資料 Modal -->
    <div class="modal fade" :class="{ show: showDetailModal }" :style="{ display: showDetailModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-info-circle me-2"></i>管理員詳細資料
            </h5>
            <button type="button" class="btn-close" @click="showDetailModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">管理員 ID</label>
                  <p class="form-control-plaintext">{{ selectedAdmin?.adminId }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">Email</label>
                  <p class="form-control-plaintext">{{ selectedAdmin?.email }}</p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">姓名</label>
                  <p class="form-control-plaintext">{{ selectedAdmin?.name }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">電話</label>
                  <p class="form-control-plaintext">{{ selectedAdmin?.phone || '未設定' }}</p>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">角色</label>
                  <p class="form-control-plaintext">
                    <span class="badge bg-primary">{{ selectedAdmin?.role || '未設定' }}</span>
                  </p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">狀態</label>
                  <p class="form-control-plaintext">
                    <span class="badge bg-secondary ">
                      已刪除
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <!-- <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">建立時間</label>
                  <p class="form-control-plaintext">{{ formatDate(selectedAdmin?.createdAt) }}</p>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label fw-bold">最後更新時間</label>
                  <p class="form-control-plaintext">{{ formatDate(selectedAdmin?.updatedAt) }}</p>
                </div>
              </div>
            </div> -->
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDetailModal = false">關閉</button>
          </div>
        </div>
      </div>
    </div>


    <!-- Modal 背景遮罩 -->
    <div v-if="showRestoreModal || showDetailModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
/* 主題色彩 */
:root {
  --primary-color: rgb(115, 2, 95);
  --secondary-color: rgb(152, 102, 149);
}

/* 頁面標題樣式 */
.page-title {
  color: var(--primary-color);
  font-weight: 600;
}

.page-title i {
  color: var(--secondary-color);
}

/* 表格樣式 */
.table th {
  font-weight: 600;
  white-space: nowrap;
  background-color: var(--secondary-color) !important;
  color: black;
  border-color: var(--secondary-color);
}

.table td {
  vertical-align: middle;
}

.table-hover tbody tr:hover {
  background-color: rgba(152, 102, 149, 0.1);
}

/* 按鈕群組樣式 */
.btn-group .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* 徽章樣式 */
.badge {
  font-weight: 500;
  padding: 0.5em 0.75em;
  border-radius: 0.375rem;
}

/* 搜尋框樣式 */
.input-group .form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(115, 2, 95, 0.25);
}

.input-group-text {
  background-color: #f8f9fa;
  border-color: #ced4da;
  color: var(--secondary-color);
}

/* 表單控制項樣式 */
.form-control:focus,
.form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(115, 2, 95, 0.25);
}

/* 警告框樣式 */
.alert-info {
  background-color: rgba(152, 102, 149, 0.1);
  border-color: var(--secondary-color);
  color: var(--primary-color);
}

/* Modal 樣式 */
.modal-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.modal-title {
  color: var(--primary-color);
  font-weight: 600;
}

/* 載入動畫樣式 */
.spinner-border {
  width: 2rem;
  height: 2rem;
}

/* 空狀態樣式 */
.text-muted {
  color: #6c757d !important;
}

/* 動畫效果 */
.fa-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Modal 背景遮罩 */
.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>