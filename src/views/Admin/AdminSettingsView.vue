<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAdminAuthStore } from '@/stores/adminauth'
//不用套用jjapi的原因是 adminAuthStore 已經包含了所有需要的API方法
const adminAuthStore = useAdminAuthStore()

// 防抖函數
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

// 響應式資料
const admins = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedAdmin = ref(null)
const showDetailModal = ref(false)

// 搜尋和篩選
const searchTerm = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const isSearching = ref(false)

// 表單資料
const createForm = ref({
  email: '',
  password: '',
  name: '',
  phone: '',
  role: '管理員'
})

const editForm = ref({
  email: '',
  password: '',
  name: '',
  phone: '',
  role: '管理員',
  status: 1
})

// 表單錯誤訊息
const emailErr = ref('')
const passwordErr = ref('')
const nameErr = ref('')
const phoneErr = ref('')

const clearErrors = () => {
  emailErr.value = ''
  passwordErr.value = ''
  nameErr.value = ''
  phoneErr.value = ''
}

// 角色選項
const roleOptions = [
  { value: '', label: '全部角色' },
  { value: '管理員', label: '管理員' },
  { value: '超級管理員', label: '超級管理員' }
]

// 狀態選項
const statusOptions = [
  { value: '', label: '全部狀態' },
  { value: 1, label: '啟用' },
  { value: 0, label: '停用' }
]

// 超級管理員權限區域  - 從 adminAuthStore 讀取管理員資料
// 可以編輯管理員
const canEdit = computed(() => {
  return adminAuthStore.admin?.role === '超級管理員'
})

// 可以刪除管理員
const canDelete = computed(() => {
  return adminAuthStore.admin?.role === '超級管理員'
})

// 可以查看已刪除的管理員
const canViewDeleted = computed(() => {
  return adminAuthStore.admin?.role === '超級管理員'
})

// 計算屬性：篩選後的管理員列表
const filteredAdmins = computed(() => {
  let filtered = admins.value

  // 搜尋篩選（支援多欄位搜尋）
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

  // 狀態篩選
  if (statusFilter.value !== '') {
    filtered = filtered.filter(admin => admin.status === parseInt(statusFilter.value))
  }

  return filtered
})

// 表單驗證
const validateForm = (form, isEdit = false) => {
  clearErrors()
  let hasError = false

  // 驗證Email
  if (!form.email || form.email.trim() === '') {
    emailErr.value = 'Email是必填項目！'
    hasError = true
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    emailErr.value = 'Email格式錯誤！'
    hasError = true
  }

  // 驗證密碼（新增時必填）
  if (!isEdit && (!form.password || form.password.trim() === '')) {
    passwordErr.value = '密碼是必填項目！'
    hasError = true
  } else if (!isEdit && form.password && form.password.length < 6) {
    passwordErr.value = '密碼長度至少為6個字元！'
    hasError = true
  }

  // 驗證姓名
  if (!form.name || form.name.trim() === '') {
    nameErr.value = '姓名是必填項目！'
    hasError = true
  }

  // 驗證電話
  if (!form.phone || form.phone.trim() === '') {
    phoneErr.value = '電話是必填項目！'
    hasError = true
  }

  return !hasError
}

// API 呼叫函數
const fetchAdmins = async () => {
  loading.value = true
  try {
    const result = await adminAuthStore.fetchAdmins({
      searchKeyword: searchTerm.value,
      sortBy: 'AdminId',
      sortOrder: 'asc',
      page: 1,
      pageSize: 1000 // 取得所有資料以便前端篩選
    })

    if (result.success) {
      admins.value = result.data.admins
    } else {
      console.error('取得管理員列表失敗:', result.message)
    }
  } catch (error) {
    console.error('取得管理員列表時發生錯誤:', error)
  } finally {
    loading.value = false
  }
}

// 添加開啟詳細資料 Modal 的函數
const openDetailModal = (admin) => {
  selectedAdmin.value = admin
  showDetailModal.value = true
}


// 新增管理員
const createAdmin = async () => {
  if (!validateForm(createForm.value, false)) {
    console.error('表單驗證失敗')
    return
  }

  try {
    const adminData = {
      email: createForm.value.email.trim(),
      password: createForm.value.password,
      name: createForm.value.name.trim(),
      phone: createForm.value.phone.trim(),
      role: createForm.value.role
    }

    console.log('發送資料:', adminData)
    const result = await adminAuthStore.createAdmin(adminData)
    
    if (result.success) {
      showCreateModal.value = false
      resetCreateForm()
      clearErrors()
      await fetchAdmins()
      alert('管理員新增成功')
    } else {
      alert(result.message || '新增失敗')
    }
  } catch (error) {
    console.error('新增失敗:', error)
    alert(error.response?.data?.message || '新增失敗')
  }
}

const updateAdmin = async () => {
  if (!validateForm(editForm.value, true)) {
    console.error('表單驗證失敗')
    return
  } 

  try {
    const adminData = {
      email: editForm.value.email.trim(),
      name: editForm.value.name.trim(),
      phone: editForm.value.phone.trim(),
      role: editForm.value.role,
      status: editForm.value.status
    }

    // 只有當密碼不為空時才更新密碼
    if (editForm.value.password && editForm.value.password.trim() !== '') {
      adminData.password = editForm.value.password
    }

    console.log('發送資料:', adminData)
    const result = await adminAuthStore.updateAdmin(selectedAdmin.value.adminId, adminData)
    
    if (result.success) {
      showEditModal.value = false
      clearErrors()
      await fetchAdmins()
      alert('管理員更新成功')
    } else {
      alert(result.message || '更新失敗')
    }
  } catch (error) {
    console.error('更新失敗:', error)
    alert(error.response?.data?.message || '更新失敗')
  }
}

const deleteAdmin = async () => {
  try {
    const result = await adminAuthStore.deleteAdmin(selectedAdmin.value.adminId)
    
    if (result.success) {
      showDeleteModal.value = false
      await fetchAdmins()
      alert('管理員刪除成功')
    } else {
      alert(result.message || '刪除失敗')
    }
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗')
  }
}


// 輔助函數
const openEditModal = (admin) => {
  selectedAdmin.value = admin
  editForm.value = {
    email: admin.email,
    password: '', // 編輯時不顯示密碼
    name: admin.name,
    phone: admin.phone,
    role: admin.role,
    status: admin.status
  }
  showEditModal.value = true
}

const openDeleteModal = (admin) => {
  selectedAdmin.value = admin
  showDeleteModal.value = true
}

const resetCreateForm = () => {
  createForm.value = {
    email: '',
    password: '',
    name: '',
    phone: '',
    role: '管理員'
  }
}

const getStatusText = (status) => {
  return status === 1 ? '啟用' : '停用'
}

const getStatusBadgeClass = (status) => {
  return status === 1 ? 'bg-success' : 'bg-secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '未設定'
  return new Date(dateString).toLocaleDateString('zh-TW')
}

// 搜尋處理函數（使用防抖）
const handleSearch = debounce(() => {
  isSearching.value = true
  console.log('搜尋關鍵字:', searchTerm.value)
  
  setTimeout(() => {
    isSearching.value = false
  }, 200)
}, 300)

// 清除搜尋
const clearSearch = () => {
  searchTerm.value = ''
  isSearching.value = false
}

// 清除所有篩選
const clearAllFilters = () => {
  searchTerm.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
  isSearching.value = false
}

// 生命週期
onMounted(() => {
  console.log('AdminSettingsView 已掛載')
  console.log('adminAuthStore.admin:', adminAuthStore.admin)
  fetchAdmins()
})
</script>

<template>
  <div class="container-fluid">
    <div class="card shadow-sm">
      <div class="card-header bg-white py-3">
        <div class="d-flex justify-content-between align-items-center">
          <h1 class="h3 mb-0 page-title">
            <i class="fa-solid fa-user-shield fa-bounce"></i> 管理員列表
          </h1>
          <div class="d-flex gap-2">
          <button 
            @click="showCreateModal = true" 
            class="btn btn-custom"
            type="button"
          >
            <i class="bi bi-person-plus me-1"></i> 新增管理員
          </button>
          <button 
            v-if="canViewDeleted"
            @click="$router.push('/admin/settings/deleted')" 
            class="btn btn-outline-secondary"
            type="button"
          >
            <i class="bi bi-trash me-1"></i> 查看已刪除的管理員
          </button>
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
            <select v-model="statusFilter" class="form-select">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary" @click="fetchAdmins">
              <i class="fas fa-refresh me-1"></i> 重新整理
            </button>
          </div>
        </div>

        <!-- 搜尋結果統計 -->
        <div class="row mb-3" v-if="searchTerm || roleFilter || statusFilter">
          <div class="col-12">
            <div class="alert alert-info d-flex align-items-center">
              <i class="fas fa-info-circle me-2"></i>
              <span>搜尋結果：顯示 {{ filteredAdmins.length }} 筆資料</span>
              <span v-if="searchTerm" class="ms-2">（關鍵字：「{{ searchTerm }}」）</span>
              <button 
                type="button" 
                class="btn btn-sm btn-outline-info ms-auto" 
                @click="clearAllFilters"
              >
                清除所有篩選
              </button>
            </div>
          </div>
        </div>

        <!-- 管理員列表表格 -->
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>Email</th>
                <th>姓名</th>
                <th>電話</th>
                <th>角色</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredAdmins.length === 0">
                <td colspan="8" class="text-center py-4 text-muted">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <p class="mb-0">沒有找到管理員資料</p>
                </td>
              </tr>
              <tr v-else v-for="admin in filteredAdmins" :key="admin.adminId">
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
                  <span class="badge" :class="getStatusBadgeClass(admin.status)">
                    {{ getStatusText(admin.status) }}
                  </span>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button 
                      v-if="canEdit"
                      class="btn btn-sm btn-outline-primary" 
                      @click="openEditModal(admin)"
                      title="編輯"
                    >
                      <i class="bi bi-pencil me-1"></i>編輯
                    </button>
                    <button 
                      class="btn btn-sm btn-outline-info"
                      @click="openDetailModal(admin)"
                      title="詳細資料"
                    >
                      <i class="bi bi-info-circle me-1"></i>詳細資料
                    </button>
                    <button 
                      v-if="canDelete" 
                      class="btn btn-sm btn-outline-danger" 
                      @click="openDeleteModal(admin)"
                      title="刪除"
                    >
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新增管理員 Modal -->
    <div class="modal fade" :class="{ show: showCreateModal }" :style="{ display: showCreateModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-plus me-2"></i>新增管理員
            </h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createAdmin">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input v-model="createForm.email" type="email" class="form-control" :class="{'is-invalid':emailErr}" placeholder="請輸入Email" @input="emailErr = ''" required>
                    <div class="invalid-feedback" v-if="emailErr">{{ emailErr }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">密碼 <span class="text-danger">*</span></label>
                    <input v-model="createForm.password" type="password" class="form-control" :class="{'is-invalid':passwordErr}" placeholder="請輸入密碼" @input="passwordErr = ''" required>
                    <div class="invalid-feedback" v-if="passwordErr">{{ passwordErr }}</div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">姓名 <span class="text-danger">*</span></label>
                    <input v-model="createForm.name" type="text" class="form-control" :class="{'is-invalid':nameErr}" placeholder="請輸入姓名" @input="nameErr = ''" required>
                    <div class="invalid-feedback" v-if="nameErr">{{ nameErr }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">電話 <span class="text-danger">*</span></label>
                    <input v-model="createForm.phone" type="tel" class="form-control" :class="{'is-invalid':phoneErr}" placeholder="請輸入電話" @input="phoneErr = ''" required>
                    <div class="invalid-feedback" v-if="phoneErr">{{ phoneErr }}</div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">角色</label>
                    <select v-model="createForm.role" class="form-select">
                      <option value="管理員">管理員</option>
                      <option value="超級管理員">超級管理員</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <div class="alert alert-info">
                      <i class="bi bi-info-circle me-2"></i>
                      <strong>預設設定：</strong><br>
                      • 狀態：啟用
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="createAdmin">
              <i class="bi bi-check me-1"></i>新增
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 編輯管理員 Modal -->
    <div class="modal fade" :class="{ show: showEditModal }" :style="{ display: showEditModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-pencil me-2"></i>編輯管理員
            </h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateAdmin">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input v-model="editForm.email" type="email" class="form-control" :class="{'is-invalid':emailErr}" placeholder="請輸入Email" @input="emailErr = ''" required>
                    <div class="invalid-feedback" v-if="emailErr">{{ emailErr }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">密碼 (留空則不修改)</label>
                    <input v-model="editForm.password" type="password" class="form-control" :class="{'is-invalid':passwordErr}" placeholder="請輸入新密碼" @input="passwordErr = ''">
                    <div class="invalid-feedback" v-if="passwordErr">{{ passwordErr }}</div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">姓名 <span class="text-danger">*</span></label>
                    <input v-model="editForm.name" type="text" class="form-control" :class="{'is-invalid':nameErr}" placeholder="請輸入姓名" @input="nameErr = ''" required>
                    <div class="invalid-feedback" v-if="nameErr">{{ nameErr }}</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">電話 <span class="text-danger">*</span></label>
                    <input v-model="editForm.phone" type="tel" class="form-control" :class="{'is-invalid':phoneErr}" placeholder="請輸入電話" @input="phoneErr = ''" required>
                    <div class="invalid-feedback" v-if="phoneErr">{{ phoneErr }}</div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">角色</label>
                    <select v-model="editForm.role" class="form-select">
                      <option value="管理員">管理員</option>
                      <option value="超級管理員">超級管理員</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">狀態</label>
                    <select v-model="editForm.status" class="form-select">
                      <option :value="1">啟用</option>
                      <option :value="0">停用</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="updateAdmin">
              <i class="bi bi-check me-1"></i>更新
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 刪除確認 Modal -->
    <div class="modal fade" :class="{ show: showDeleteModal }" :style="{ display: showDeleteModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-exclamation-triangle text-danger me-2"></i>確認刪除
            </h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>確定要刪除管理員「<strong>{{ selectedAdmin?.name }}</strong>」嗎？</p>
            <div class="alert alert-warning">
              <i class="bi bi-info-circle me-2"></i>
              此操作無法復原，請謹慎操作。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteAdmin">
              <i class="bi bi-trash me-1"></i>確認刪除
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
                    <span class="badge" :class="getStatusBadgeClass(selectedAdmin?.status)">
                      {{ getStatusText(selectedAdmin?.status) }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div class="row">
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
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDetailModal = false">關閉</button>
            <button 
              v-if="canEdit"
              type="button" 
              class="btn btn-primary" 
              @click="() => { showDetailModal = false; openEditModal(selectedAdmin); }"
            >
              <i class="bi bi-pencil me-1"></i>編輯
            </button>
          </div>
        </div>
      </div>
    </div>



    <!-- Modal 背景遮罩 -->
    <div v-if="showCreateModal || showEditModal || showDeleteModal || showDetailModal " class="modal-backdrop fade show"></div>
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

/* 自定義按鈕樣式 */
.btn-custom {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background-color: transparent;
  transition: all 0.3s ease;
}

.btn-custom:hover {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 表格樣式 */
.table th {
  font-weight: 600;
  white-space: nowrap;
  background-color: var(--secondary-color) !important;
  color:black;
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

/* 響應式設計 */
@media (max-width: 768px) {
  .btn-group {
    flex-direction: column;
  }
  
  .btn-group .btn {
    margin-bottom: 0.25rem;
  }
  
  .table-responsive {
    font-size: 0.875rem;
  }
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

.btn-group .dropdown-menu {
  z-index: 1060;
}

/* 下拉選單樣式 */
.dropdown-item:hover {
  background-color: rgba(152, 102, 149, 0.1);
}

.dropdown-item i {
  width: 1rem;
  text-align: center;
}

/* Bootstrap 相容性樣式 */
.d-flex {
  display: flex;
}

.justify-content-between {
  justify-content: space-between;
}

.justify-content-center {
  justify-content: center;
}

.justify-content-end {
  justify-content: flex-end;
}

.align-items-center {
  align-items: center;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-3 {
  gap: 1rem;
}

.mb-0 {
  margin-bottom: 0;
}

.mb-3 {
  margin-bottom: 1rem;
}

.mb-4 {
  margin-bottom: 1.5rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.me-1 {
  margin-right: 0.25rem;
}

.me-2 {
  margin-right: 0.5rem;
}

.ms-2 {
  margin-left: 0.5rem;
}

.ms-auto {
  margin-left: auto;
}

.py-3 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.py-4 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #6c757d;
}

.shadow-sm {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.table-responsive {
  overflow-x: auto;
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
</style>