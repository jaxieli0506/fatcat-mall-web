<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/jjapi.js'

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
const members = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedMember = ref(null)

// 搜尋和篩選
const searchTerm = ref('')
const statusFilter = ref('')
const genderFilter = ref('')
const thirdPartyFilter = ref('')
const isSearching = ref(false)

// 表單資料
const createForm = ref({
  name: '',
  email: '',
  phone: '',
  gender: null,
  birthdate: ''
})

// 表單錯誤訊息
const nameErr = ref('')
const emailErr = ref('')
const clearErrors = () => {
  nameErr.value = ''
  emailErr.value = ''
}

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  gender: null,
  birthdate: '',
  status: 1
})

// 狀態選項
const statusOptions = [
  { value: '', label: '全部狀態' },
  { value: 0, label: '已刪除' },
  { value: 1, label: '正常' },
  { value: 2, label: '黑名單' }
]

const genderOptions = [
  { value: '', label: '全部性別' },
  { value: 0, label: '男' },
  { value: 1, label: '女' }
]

const thirdPartyOptions = [
  { value: '', label: '全部' },
  { value: false, label: '一般註冊' },
  { value: true, label: '第三方登入' }
]

// 計算屬性：篩選後的會員列表
const filteredMembers = computed(() => {
  let filtered = members.value

  // 搜尋篩選（支援多欄位搜尋）
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase().trim()
    if (term) {
      filtered = filtered.filter(member => 
        (member.name && member.name.toLowerCase().includes(term)) ||
        (member.email && member.email.toLowerCase().includes(term)) ||
        (member.phone && member.phone.includes(term))
      )
    }
  }

  // 狀態篩選
  if (statusFilter.value !== '') {
    filtered = filtered.filter(member => member.status === parseInt(statusFilter.value))
  }

  // 性別篩選
  if (genderFilter.value !== '') {
    filtered = filtered.filter(member => member.gender === parseInt(genderFilter.value))
  }

  // 第三方登入篩選
  if (thirdPartyFilter.value !== '') {
    filtered = filtered.filter(member => member.isThirdparty === thirdPartyFilter.value)
  }

  return filtered
})

//表單驗證
const validateForm = (form) => {
    clearErrors()
    let hasError = false

    //驗證姓名
    if (!form.name || form.name.trim() === '') {
        nameErr.value = '姓名是必填項目！'
        hasError = true
    }

    //驗證Email
    if (!form.email || form.email.trim() === '') {
        emailErr.value = 'Email是必填項目！'
        hasError = true
    } else if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        emailErr.value = 'Email格式錯誤！'
        hasError = true
    }
    
    return !hasError
}

// API 呼叫函數
const fetchMembers = async () => {
  loading.value = true
  try {
    const response = await api.get('/admin/members')
    members.value = response.data
  } catch (error) {
    console.error('取得會員列表失敗:', error)
  } finally {
    loading.value = false
  }
}

const createMember = async () => {
    if (!validateForm(createForm.value)) {
        console.error('表單驗證失敗')
        return
    }

  try {
    // 準備發送的資料，確保必填欄位有值
    const memberData = {
      name: createForm.value.name.trim(),
      email: createForm.value.email.trim(),
      phone: createForm.value.phone || ''
    }
    
    // 只有當有選擇性別時才添加 gender 欄位
    if (createForm.value.gender !== null) {
      memberData.gender = createForm.value.gender
    }
    
    // 只有當有選擇日期時才添加 birthdate 欄位
    if (createForm.value.birthdate) {
      memberData.birthdate = createForm.value.birthdate
    }
    
    console.log('發送資料:', memberData)
    const response = await api.post('/admin/members', memberData)
    console.log('新增成功:', response.data)
    showCreateModal.value = false
    resetCreateForm()
    clearErrors()
    await fetchMembers()
    alert('會員新增成功')
  } catch (error) {
    console.error('新增失敗:', error)
    console.error('錯誤詳情:', error.response?.data)
    
    // 顯示詳細的錯誤資訊
    if (error.response?.data?.errors) {
      const errorMessages = []
      for (const [field, messages] of Object.entries(error.response.data.errors)) {
        errorMessages.push(`${field}: ${messages.join(', ')}`)
      }
      alert(`驗證錯誤:\n${errorMessages.join('\n')}`)
    } else {
      alert(error.response?.data?.message || '新增失敗')
    }
  }
}

const updateMember = async () => {
    if (!validateForm(editForm.value)) {
        console.error('表單驗證失敗')
        return
    }

  try {
    // 準備發送的資料，確保必填欄位有值
    const memberData = {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
      phone: editForm.value.phone || '',
      status: editForm.value.status
    }
    
    // 只有當有選擇性別時才添加 gender 欄位
    if (editForm.value.gender !== null) {
      memberData.gender = editForm.value.gender
    }
    
    // 只有當有選擇日期時才添加 birthdate 欄位
    if (editForm.value.birthdate) {
      memberData.birthdate = editForm.value.birthdate
    }
    
    console.log('發送資料:', memberData)
    await api.put(`/admin/members/${selectedMember.value.userId}`, memberData)
    showEditModal.value = false
    clearErrors()
    await fetchMembers()
    alert('會員更新成功')
  } catch (error) {
    console.error('更新失敗:', error)
    console.error('錯誤詳情:', error.response?.data)
    
    // 顯示詳細的錯誤資訊
    if (error.response?.data?.errors) {
      const errorMessages = []
      for (const [field, messages] of Object.entries(error.response.data.errors)) {
        errorMessages.push(`${field}: ${messages.join(', ')}`)
      }
      alert(`驗證錯誤:\n${errorMessages.join('\n')}`)
    } else {
      alert(error.response?.data?.message || '更新失敗')
    }
  }
}

const deleteMember = async () => {
  try {
    await api.delete(`/admin/members/${selectedMember.value.userId}`)
    showDeleteModal.value = false
    await fetchMembers()
    alert('會員刪除成功')
  } catch (error) {
    console.error('刪除失敗:', error)
    alert('刪除失敗')
  }
}

const updateMemberStatus = async (memberId, newStatus) => {
  try {
    await api.put(`/admin/members/${memberId}/status`, { status: newStatus })
    await fetchMembers()
    alert('狀態更新成功')
  } catch (error) {
    console.error('狀態更新失敗:', error)
    alert('狀態更新失敗')
  }
}

// 輔助函數
const openEditModal = (member) => {
  selectedMember.value = member
  editForm.value = {
    name: member.name,
    email: member.email,
    phone: member.phone,
    gender: member.gender,
    birthdate: member.birthdate ? member.birthdate.split('T')[0] : '',
    status: member.status
  }
  showEditModal.value = true
}

const openDeleteModal = (member) => {
  selectedMember.value = member
  showDeleteModal.value = true
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    email: '',
    phone: '',
    gender: null,
    birthdate: ''
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 0: return '已刪除'
    case 1: return '正常'
    case 2: return '黑名單'
    default: return '未知'
  }
}

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 0: return 'bg-danger'
    case 1: return 'bg-success'
    case 2: return 'bg-warning'
    default: return 'bg-secondary'
  }
}

const getGenderText = (gender) => {
  return gender === 0 ? '男' : gender === 1 ? '女' : gender === 2 ? '第三性' : '未設定'
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
  statusFilter.value = ''
  genderFilter.value = ''
  thirdPartyFilter.value = ''
  isSearching.value = false
}

// 生命週期
onMounted(() => {
  fetchMembers()
})
</script>

<template>
  <div class="container-fluid">
    <div class="card shadow-sm">
      <div class="card-header bg-white py-3">
        <div class="d-flex justify-content-between align-items-center">
          <h1 class="h3 mb-0 page-title">
            <i class="fa-solid fa-person-through-window fa-bounce"></i> 會員列表
          </h1>
          <button class="btn btn-custom" @click="showCreateModal = true">
            <i class="bi bi-person-plus me-1"></i> 新增會員
          </button>
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
            <select v-model="statusFilter" class="form-select">
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="genderFilter" class="form-select">
              <option v-for="option in genderOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="thirdPartyFilter" class="form-select">
              <option v-for="option in thirdPartyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary" @click="fetchMembers">
              <i class="fas fa-refresh me-1"></i> 重新整理
            </button>
          </div>
        </div>

        <!-- 搜尋結果統計 -->
        <div class="row mb-3" v-if="searchTerm || statusFilter || genderFilter || thirdPartyFilter">
          <div class="col-12">
            <div class="alert alert-info d-flex align-items-center">
              <i class="fas fa-info-circle me-2"></i>
              <span>搜尋結果：顯示 {{ filteredMembers.length }} 筆資料</span>
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

        <!-- 會員列表表格 -->
        <div class="table-responsive">
          <table class="table table-hover align-middle">
            <thead class="table-light">
              <tr>
                <th>姓名</th>
                <th>性別</th>
                <th>Email</th>
                <th>生日</th>
                <th>電話</th>
                <th>狀態</th>
                <th>註冊日期</th>
                <th>登入方式</th>
                <th>最後登入</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="10" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredMembers.length === 0">
                <td colspan="10" class="text-center py-4 text-muted">
                  <i class="fas fa-inbox fa-2x mb-2"></i>
                  <p class="mb-0">沒有找到會員資料</p>
                </td>
              </tr>
              <tr v-else v-for="member in filteredMembers" :key="member.userId">
                <td>
                  <strong>{{ member.name }}</strong>
                  <small class="text-muted d-block">ID: {{ member.userId }}</small>
                </td>
                <td>{{ getGenderText(member.gender) }}</td>
                <td>{{ member.email }}</td>
                <td>{{ formatDate(member.birthdate) }}</td>
                <td>{{ member.phone || '未設定' }}</td>
                <td>
                  <span class="badge" :class="getStatusBadgeClass(member.status)">
                    {{ getStatusText(member.status) }}
                  </span>
                </td>
                <td>{{ formatDate(member.registerdate) }}</td>
                <td>
                  <span class="badge" :class="member.isThirdparty ? 'bg-info' : 'bg-secondary'">
                    {{ member.isThirdparty ? '第三方' : '一般' }}
                  </span>
                </td>
                <td>{{ formatDate(member.lastLogin) }}</td>
                <td>
                  <div class="btn-group" role="group">
                    <button 
                      class="btn btn-sm btn-outline-primary" 
                      @click="openEditModal(member)"
                      title="編輯"
                    >
                      <i class="bi bi-pencil me-1"></i>編輯
                    </button>
                    <button 
                      v-if="member.status !== 0"
                      class="btn btn-sm btn-outline-danger" 
                      @click="openDeleteModal(member)"
                      title="刪除"
                    >
                      <i class="bi bi-trash me-1"></i>刪除
                    </button>
                    <div class="btn-group" role="group">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        data-bs-toggle="dropdown"
                      >
                        狀態
                      </button>
                      <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" @click="updateMemberStatus(member.userId, 1)">
                          <i class="bi bi-check-circle text-success me-2"></i>設為正常
                        </a></li>
                        <li><a class="dropdown-item" href="#" @click="updateMemberStatus(member.userId, 2)">
                          <i class="bi bi-exclamation-triangle text-warning me-2"></i>設為黑名單
                        </a></li>
                        <li><a class="dropdown-item" href="#" @click="updateMemberStatus(member.userId, 0)">
                          <i class="bi bi-x-circle text-danger me-2"></i>軟刪除
                        </a></li>
                      </ul>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 新增會員 Modal -->
    <div class="modal fade" :class="{ show: showCreateModal }" :style="{ display: showCreateModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-person-plus me-2"></i>新增會員
            </h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createMember">
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
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input v-model="createForm.email" type="email" class="form-control" :class="{'is-invalid':emailErr}" placeholder="請輸入電子郵件" @input="emailErr = ''" required>
                    <div class="invalid-feedback" v-if="emailErr">{{ emailErr }}</div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">電話</label>
                    <input v-model="createForm.phone" type="text" class="form-control" placeholder="請輸入電話號碼">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">性別</label>
                    <select v-model="createForm.gender" class="form-select">
                      <option :value="null">請選擇</option>
                      <option :value="0">男</option>
                      <option :value="1">女</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">生日</label>
                    <input v-model="createForm.birthdate" type="date" class="form-control">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <div class="alert alert-info">
                      <i class="bi bi-info-circle me-2"></i>
                      <strong>預設設定：</strong><br>
                      • 狀態：正常<br>
                      • 密碼：123
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="createMember">
              <i class="bi bi-check me-1"></i>新增
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 編輯會員 Modal -->
    <div class="modal fade" :class="{ show: showEditModal }" :style="{ display: showEditModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-pencil me-2"></i>編輯會員
            </h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateMember">
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
                    <label class="form-label">Email <span class="text-danger">*</span></label>
                    <input v-model="editForm.email" type="email" class="form-control" :class="{'is-invalid':emailErr}" placeholder="請輸入電子郵件" @input="emailErr = ''" required>
                    <div class="invalid-feedback" v-if="emailErr">{{ emailErr }}</div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">電話</label>
                    <input v-model="editForm.phone" type="text" class="form-control" placeholder="請輸入電話號碼">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">狀態</label>
                    <select v-model="editForm.status" class="form-select">
                      <option :value="0">已刪除</option>
                      <option :value="1">正常</option>
                      <option :value="2">黑名單</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">性別</label>
                    <select v-model="editForm.gender" class="form-select">
                      <option :value="null">請選擇</option>
                      <option :value="0">男</option>
                      <option :value="1">女</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">生日</label>
                    <input v-model="editForm.birthdate" type="date" class="form-control">
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="updateMember">
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
            <p>確定要刪除會員「<strong>{{ selectedMember?.name }}</strong>」嗎？</p>
            <div class="alert alert-warning">
              <i class="bi bi-info-circle me-2"></i>
              此操作將執行軟刪除，會員狀態將設為「已刪除」。
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
            <button type="button" class="btn btn-danger" @click="deleteMember">
              <i class="bi bi-trash me-1"></i>確認刪除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 背景遮罩 -->
    <div v-if="showCreateModal || showEditModal || showDeleteModal" class="modal-backdrop fade show"></div>
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
</style>