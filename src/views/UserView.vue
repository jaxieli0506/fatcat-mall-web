<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import authService from '@/services/authService'
import PasswordChangeModel from '@/components/PasswordChangeModel.vue'
import AddressManager from '@/components/AddressManager.vue'
import { useexLoginStore } from '@/stores/exLogin'
import Swal from 'sweetalert2'

const authStore = useAuthStore()
const passwordModal = ref(null)

// 初始化標記，避免重複初始化
const isInitialized = ref(false)

// 初始化數據
const initializeData = async () => {
    // 如果已經初始化過，直接返回
    if (isInitialized.value) {
        return
    }
    
    if (authStore.isAuthenticated) {
        try {
            // 先獲取最新用戶資料
            const result = await authStore.fetchUserProfile()
            
            if (result.success) {
                // 然後初始化編輯表單
                if (authStore.user) {
                    editForm.value = {
                        name: authStore.user.name || '',
                        birthdate: authStore.user.birthdate ? new Date(authStore.user.birthdate).toISOString().split('T')[0] : '',
                        phone: authStore.user.phone || '',
                        gender: authStore.user.gender
                    }
                }
                // 標記為已初始化
                isInitialized.value = true
            } else {
                console.error('Failed to fetch user profile:', result.message)
                throw new Error(result.message || '獲取用戶資料失敗')
            }
        } catch (error) {
            console.error('Error in initializeData:', error)
            throw error
        }
    } else {
        throw new Error('用戶未登入')
    }
}

// 在 onMounted 中調用
onMounted(async () => {
    // 檢查用戶是否已登入
    if (!authStore.isAuthenticated) {
        // 重定向到登入頁面
        window.location.href = '/login'
        return
    }
    
    try {
        await initializeData()
        console.log('用戶資料初始化完成')
    } catch (error) {
        console.error('Error initializing user data:', error)
        alert('載入用戶資料時發生錯誤，請重新登入')
        // 如果載入失敗，重定向到登入頁面
        window.location.href = '/login'
        return
    }
    // 載入第三方登入連結（獨立處理）
    try {
        await loadExloginConnections()
        console.log('第三方登入連結載入完成')
    } catch (error) {
        console.error('載入第三方登入連結失敗:', error)
        // 不影響頁面載入
    }
})

// 編輯模式控制
const editMode = ref({
    name: false,
    birthdate: false,
    phone: false,
    gender: false
})

// 編輯表單數據
const editForm = ref({
    name: '',
    birthdate: '',
    phone: '',
    gender: null
})

// 檔案上傳相關
const fileInput = ref(null)
const isUploading = ref(false)

// 計算用戶頭像URL
const getUserAvatar = computed(() => {
    if (authStore.user?.picPath) {
        // 如果有自定義頭像，確保URL正確
        return authStore.user.picPath.startsWith('http') 
            ? authStore.user.picPath 
            : `https://localhost:7017${authStore.user.picPath}`
    }
    // 預設頭像
    return '/pingu.png'
})

// 觸發檔案選擇
const triggerFileUpload = () => {
    fileInput.value?.click()
}

// 處理檔案選擇
const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查檔案大小（2MB限制）
    if (file.size > 2 * 1024 * 1024) {
        alert('檔案大小不能超過 2MB')
        return
    }

    // 檢查檔案類型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
        alert('只支援 JPG、PNG、GIF 格式')
        return
    }

    try {
            // 顯示上傳中狀態
            isUploading.value = true;
            
            // 上傳檔案
            const result = await authService.uploadAvatar(file);
            
            if (result.success) {
                // 更新用戶頭像
                await authStore.fetchUserProfile();
                alert('頭像上傳成功！');
            } else {
                alert('上傳失敗：' + result.message);
            }
        } catch (error) {
            console.error('上傳錯誤:', error);
            alert('上傳失敗：' + error.message);
        } finally {
            isUploading.value = false;
            // 清空檔案選擇器
            event.target.value = '';
        }
};

// 格式化生日
const formatBirthdate = (dateString) => {
    if (!dateString) return '未設定'
    return new Date(dateString).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

// 格式化性別
const formatGender = (gender) => {
    if (gender === null || gender === undefined) return '未設定'
    switch (gender) {
        case 0: return '男'
        case 1: return '女'
        case 2: return '其他'
        default: return '未設定'
    }
}

// 切換編輯模式
const toggleEdit = (field) => {
    if (editMode.value[field]) {
        // 保存該欄位
        saveField(field)
    } else {
        // 進入編輯模式
        editMode.value[field] = true
        // 初始化編輯值
        if (field === 'name') editForm.value.name = authStore.user?.name || ''
        if (field === 'phone') editForm.value.phone = authStore.user?.phone || ''
        if (field === 'gender') editForm.value.gender = authStore.user?.gender
        if (field === 'birthdate') {
            // 將日期轉為 YYYY-MM-DD 格式
            const date = authStore.user?.birthdate
            if (date) {
                editForm.value.birthdate = new Date(date).toISOString().split('T')[0]
            }
        }
    }
}

// 保存單個欄位
const saveField = async (field) => {
    try {
        // 準備更新的數據
        const updateData = {}
        
        if (field === 'name') {
            updateData.name = editForm.value.name
        } else if (field === 'phone') {
            updateData.phone = editForm.value.phone
        } else if (field === 'gender') {
            updateData.gender = editForm.value.gender
        } else if (field === 'birthdate') {
            updateData.birthdate = new Date(editForm.value.birthdate).toISOString()
        }
        
        console.log(`保存 ${field}:`, updateData)
        
        // 調用 API 更新
        const result = await authStore.updateProfile(updateData)
        
        if (result.success) {
            // 退出編輯模式
            editMode.value[field] = false
            
            // 顯示成功提示
            alert(`${field} 更新成功！`)
            
        } else {
            alert('更新失敗：' + result.message)
        }
        
    } catch (error) {
        console.error(`保存 ${field} 失敗:`, error)
        alert('保存失敗，請稍後再試')
    }
}

// 開啟密碼變更對話框
const openPasswordModal = () => {
    if (passwordModal.value) {
        passwordModal.value.showModal()
    }
}

// 處理密碼變更
const handlePasswordChange = async (passwordData) => {
    try {
        // 準備API請求數據
        const changePasswordData = {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword
        }

        // 調用狀態管理中的密碼變更方法
        const result = await authStore.changePassword(changePasswordData)

        if (result.success) {
            // 成功提示
            alert(result.message || '密碼變更成功！')

            // 通知組件處理成功結果
            if (passwordModal.value) {
                passwordModal.value.handlePasswordChangeResult(true, result.message)
            }
        } else {
           // 失敗時不顯示 alert，改為讓組件顯示錯誤訊息
            if (passwordModal.value) {
                passwordModal.value.handlePasswordChangeResult(false, result.message)
            }
        }
    } catch (error) {
        console.error('密碼變更錯誤:', error)
        // 網絡錯誤或其他異常
        if (passwordModal.value) {
            passwordModal.value.handlePasswordChangeResult(false, '密碼變更時發生錯誤，請稍後再試')
        }
    }
}

// 檢查是否有變更
const hasChanges = computed(() => {
    return Object.values(editMode.value).some(mode => mode === true)
})

// 保存所有變更
const saveAllChanges = async () => {
    try{
        // 準備更新數據
        const updateData = {}
        
        // 只傳送有變更的欄位
        if (editMode.value.name && editForm.value.name !== authStore.user?.name) {
            updateData.name = editForm.value.name
        }
        if (editMode.value.phone && editForm.value.phone !== authStore.user?.phone) {
            updateData.phone = editForm.value.phone
        }
        if (editMode.value.gender && editForm.value.gender !== authStore.user?.gender) {
            updateData.gender = editForm.value.gender
        }
        if (editMode.value.birthdate && editForm.value.birthdate) {
            updateData.birthdate = new Date(editForm.value.birthdate).toISOString()
        }
        
        // 如果沒有任何變更，不執行更新
        if (Object.keys(updateData).length === 0) {
            alert('沒有任何變更需要保存')
            return
        }
        
        console.log('準備更新的數據:', updateData)

         // 調用 API 更新
        const result = await authStore.updateProfile(updateData)
        
        if (result.success) {
            // 成功提示
            alert('個人資料更新成功！')
            
            // 關閉所有編輯模式
            Object.keys(editMode.value).forEach(key => {
                editMode.value[key] = false
            })
            
            // 重新整理頁面數據
            await authStore.fetchUserProfile()

            // 手動更新表單資料（避免重複調用 initializeData）
            if (authStore.user) {
                editForm.value = {
                    name: authStore.user.name || '',
                    birthdate: authStore.user.birthdate ? new Date(authStore.user.birthdate).toISOString().split('T')[0] : '',
                    phone: authStore.user.phone || '',
                    gender: authStore.user.gender
                }
            }
            
        } else {
            // 錯誤提示
            alert('更新失敗：' + result.message)
        }
        

    }
    catch(error){
        console.error('保存變更錯誤:', error)
            alert('保存失敗：' + error.message)
        
    }

}

//第三方登入相關-------------------------------------------------------------------
const exLoginStore = useexLoginStore()
const loadExloginConnections = async ()=>{
    try {
        await exLoginStore.fetchConnections()
        console.log('✅ 第三方登入連結載入成功')
    } catch (error) {
        console.warn('⚠️ 第三方登入連結載入失敗，但不影響頁面：', error.message)
        // 設定空的連結，避免 UI 錯誤
        exLoginStore.connections = []
        // 不拋出錯誤，讓頁面正常載入
    }
}

//FB 登入處理
const handleFBLogin = async ()=>{
    try{
        const result = await exLoginStore.initFBLogin()
        if(result.success){
            Swal.fire({
                icon:'success',
                title:'綁定成功',
                text:'Facebook帳號已成功綁定',
                confirmButtonText:'確定'
            })
        }else{
            throw new Error(result.message)
        }
    }catch(error){
        Swal.fire({
            icon:'error',
            title:'綁定失敗',
            text:error.message || 'Facebook帳號綁定失敗',
            confirmButtonText:'確定'
        })
    }
}

// Google 登入處理
const handleGoogleLogin = async () => {
    try {
        const result = await exLoginStore.initGoogleLogin()
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '綁定成功',
                text: 'Google 帳號已成功綁定',
                confirmButtonText: '確定'
            })
        } else {
            throw new Error(result.message)
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: '綁定失敗',
            text: error.message || 'Google 帳號綁定失敗',
            confirmButtonText: '確定'
        })
    }
}

// LINE 登入處理
const handleLineLogin = async () => {
    try {
        const result = await exLoginStore.initLineLogin()
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '綁定成功',
                text: 'LINE 帳號已成功綁定',
                confirmButtonText: '確定'
            })
        } else {
            throw new Error(result.message)
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: '綁定失敗',
            text: error.message || 'LINE 帳號綁定失敗',
            confirmButtonText: '確定'
        })
    }
}

// 解除綁定處理
const handleUnbind = async (provider) => {
    try {
        const result = await Swal.fire({
            title: '確定要解除綁定嗎？',
            text: `您確定要解除 ${provider} 帳號的綁定嗎？`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '確定解除',
            cancelButtonText: '取消'
        })

        if (result.isConfirmed) {
            const unbindResult = await exLoginStore.unbindAccount(provider)
            if (unbindResult.success) {
                Swal.fire({
                    icon: 'success',
                    title: '解除綁定成功',
                    text: `${provider} 帳號已成功解除綁定`,
                    confirmButtonText: '確定'
                })
            } else {
                throw new Error(unbindResult.message)
            }
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: '解除綁定失敗',
            text: error.message || `${provider} 帳號解除綁定失敗`,
            confirmButtonText: '確定'
        })
    }
}

</script>

<template>
    <div class="user-profile-container">
        <!-- 主要個人資訊卡片 -->
        <div class="profile-main-card card">
            <div class="card-header text-center">
                <h4 class="mb-0">
                    <i class="bi bi-person-circle me-2"></i>個人資訊
                </h4>
            </div>
            
            <div class="card-body">
                <!-- 頭像上傳區域 -->
                <div class="avatar-upload-section row mb-4">
                    <div class="col-md-3 text-center">
                        <!-- 頭像顯示 -->
                        <div class="avatar-container mb-3" :class="{ 'uploading': isUploading }">
                            <img :src="getUserAvatar" alt="用戶頭像" class="user-avatar-large">
                            <div class="avatar-overlay">
                                <i class="bi" :class="isUploading ? 'bi-hourglass-split' : 'bi-camera-fill'"></i>
                            </div>
                            <!-- 上傳時的遮罩效果 -->
                            <div v-if="isUploading" class="upload-overlay">
                                <div class="spinner-border spinner-border-sm text-light" role="status">
                                    <span class="visually-hidden">上傳中...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-9">
                        <!-- 上傳按鈕和說明 -->
                        <div class="upload-controls">
                            <button class="btn btn-outline-primary mb-2" 
                                @click="triggerFileUpload" 
                                :disabled="isUploading">
                                <i class="bi me-2" :class="isUploading ? 'bi-hourglass-split' : 'bi-upload'"></i>
                                {{ isUploading ? '上傳中...' : '選擇圖片' }}
                            </button>
                            <!-- 上傳進度提示 -->
                            <div v-if="isUploading" class="upload-progress mb-2">
                                <div class="progress" style="height: 4px;">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                        role="progressbar" style="width: 100%"></div>
                                </div>
                                <small class="text-muted">正在上傳頭像，請稍候...</small>
                            </div>

                            <input type="file" ref="fileInput" @change="handleFileSelect" 
                                accept="image/*" style="display: none;">
                            
                            <div class="upload-info">
                                <p class="text-muted small mb-1">支援格式：JPG、PNG、GIF</p>
                                <p class="text-muted small mb-0">檔案大小：最大 2MB</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 個人資訊表單區域 -->
                <div class="personal-info-section">
                    <!-- 第一行：姓名 + EMAIL -->
                    <div class="info-row-group row mb-3">
                        <!-- 姓名 -->
                        <div class="col-md-6">
                            <div class="info-row">
                                <label class="info-label">姓名：</label>
                                <span v-if="!editMode.name" class="info-value">{{ authStore.user?.name || '未設定' }}</span>
                                <input v-else v-model="editForm.name" type="text" class="form-control info-input">
                                <button class="btn btn-link btn-sm" @click="toggleEdit('name')">
                                    <i class="bi" :class="editMode.name ? 'bi-check-lg' : 'bi-pencil-fill'"></i>
                                </button>
                            </div>
                        </div>

                        <!-- EMAIL -->
                        <div class="col-md-6">
                            <div class="info-row">
                                <label class="info-label">EMAIL：</label>
                                <span class="info-value">{{ authStore.user?.email || '未設定' }}</span>
                                <span class="text-muted small">（不可修改）</span>
                            </div>
                        </div>
                    </div>

                    <!-- 第二行：生日 + 手機 -->
                    <div class="info-row-group row mb-3">
                        <!-- 生日 -->
                        <div class="col-md-6">
                            <div class="info-row">
                                <label class="info-label">生日：</label>
                                <span v-if="!editMode.birthdate" class="info-value">{{ formatBirthdate(authStore.user?.birthdate) }}</span>
                                <input v-else v-model="editForm.birthdate" type="date" class="form-control info-input">
                                <button class="btn btn-link btn-sm" @click="toggleEdit('birthdate')">
                                    <i class="bi" :class="editMode.birthdate ? 'bi-check-lg' : 'bi-pencil-fill'"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 手機 -->
                        <div class="col-md-6">
                            <div class="info-row">
                                <label class="info-label">手機：</label>
                                <span v-if="!editMode.phone" class="info-value">{{ authStore.user?.phone || '未設定' }}</span>
                                <input v-else v-model="editForm.phone" type="tel" class="form-control info-input">
                                <button class="btn btn-link btn-sm" @click="toggleEdit('phone')">
                                    <i class="bi" :class="editMode.phone ? 'bi-check-lg' : 'bi-pencil-fill'"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 第三行：性別 -->
                    <div class="info-row-group row mb-3">
                        <div class="col-md-6">
                            <div class="info-row">
                                <label class="info-label">性別：</label>
                                <span v-if="!editMode.gender" class="info-value">{{ formatGender(authStore.user?.gender) }}</span>
                                <select v-else v-model="editForm.gender" class="form-control info-input">
                                    <option value="">請選擇性別</option>
                                    <option value="0">男</option>
                                    <option value="1">女</option>
                                    <option value="2">其他</option>
                                </select>
                                <button class="btn btn-link btn-sm" @click="toggleEdit('gender')">
                                    <i class="bi" :class="editMode.gender ? 'bi-check-lg' : 'bi-pencil-fill'"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 第四行：密碼（單獨一行） -->
                    <div class="info-row-group row mb-3">
                        <div class="col-12">
                            <div class="info-row">
                                <label class="info-label">密碼：</label>
                                <span class="info-value">••••••••••</span>
                                <button class="btn btn-outline-warning btn-sm" @click="openPasswordModal">
                                    更改密碼
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- 地址管理區域 -->
                <div class="address-management-section mb-4">
                    <AddressManager />
                </div>

                <!-- 第三方登入綁定區域 -->
                <div class="social-binding-section mb-4">
                    <h6 class="text-center mb-3">綁定第三方登入：</h6>
                    <div class="social-icons d-flex justify-content-center gap-3">
                        <!-- Facebook 按鈕 -->
                        <button 
                            class="btn btn-outline-primary social-btn facebook"
                            @click="handleFBLogin"
                            :disabled="exLoginStore.isLoading || exLoginStore.connections.some(c => c.loginProvider === 'Facebook')"
                        >
                            <i class="bi bi-facebook"></i>
                            <span>Facebook</span>
                            <span v-if="exLoginStore.connections.some(c => c.loginProvider === 'Facebook')" 
                                  class="badge bg-success ms-2">已綁定</span>
                        </button>
                        <div class="fb-login-button" data-width="" data-size="" data-button-type="" data-layout="" data-auto-logout-link="true" data-use-continue-as="false"></div>
                        <!-- Google 按鈕 -->
                        <button 
                            class="btn btn-outline-danger social-btn google"
                            @click="handleGoogleLogin"
                            :disabled="exLoginStore.isLoading || exLoginStore.connections.some(c => c.loginProvider === 'Google')"
                        >
                            <i class="bi bi-google"></i>
                            <span>Google</span>
                            <span v-if="exLoginStore.connections.some(c => c.loginProvider === 'Google')" 
                                  class="badge bg-success ms-2">已綁定</span>
                        </button>


                        <!-- LINE 按鈕 -->
                        <button 
                            class="btn btn-outline-success social-btn line"
                            @click="handleLineLogin"
                            :disabled="exLoginStore.isLoading || exLoginStore.connections.some(c => c.loginProvider === 'LINE')"
                        >
                            <i class="bi bi-line"></i>
                            <span>LINE</span>
                            <span v-if="exLoginStore.connections.some(c => c.loginProvider === 'LINE')" 
                                  class="badge bg-success ms-2">已綁定</span>
                        </button>
                    </div>

                    <!-- 已綁定的帳號列表 -->
                    <div v-if="exLoginStore.connections.length > 0" class="mt-4">
                        <h6 class="text-center mb-3">已綁定的帳號：</h6>
                        <div class="connected-accounts">
                            <div v-for="connection in exLoginStore.connections" 
                                 :key="connection.loginId" 
                                 class="connected-account d-flex justify-content-between align-items-center p-2 mb-2 border rounded">
                                <div class="d-flex align-items-center">
                                    <i :class="'bi bi-' + connection.loginProvider.toLowerCase() + ' me-2'"></i>
                                    <span>{{ connection.loginProvider }}</span>
                                    <small class="text-muted ms-2">
                                        綁定時間：{{ new Date(connection.createDate).toLocaleDateString() }}
                                    </small>
                                </div>
                                <button class="btn btn-sm btn-outline-danger" 
                                        @click="handleUnbind(connection.loginProvider)"
                                        :disabled="exLoginStore.isLoading">
                                    解除綁定
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 儲存按鈕區域 -->
                <div class="save-button-section text-center">
                    <button class="btn btn-primary btn-lg save-btn" @click="saveAllChanges" :disabled="!hasChanges">
                        <i class="bi bi-floppy-fill me-2"></i>儲存
                    </button>
                </div>
            </div>
        </div>

        <!-- 密碼變更 Modal -->
        <password-change-model ref="passwordModal" @password-changed="handlePasswordChange"></password-change-model>
    </div>
</template>

<style lang="css" scoped>
/* 色系定義 - 與項目一致的紫色主題 */
.user-profile-container {
    --deep-purple: #92559c;
    --light-purple: #d3a2da;
    --light-yellow: #ffd689;
    --orange-yellow: #ffa600;
    --deep-gray: #686868;
    --light-gray: #f6f6f6;
    --danger-red: #dc3545;
    --success-green: #28a745;
    
    /* 調整寬度設定 */
    max-width: 95%;
    width: 100%;
    margin: 2rem auto;
    padding: 0 1rem;
}

/* 在大螢幕上設定最大寬度 */
@media (min-width: 1200px) {
    .user-profile-container {
        max-width: 1100px;
    }
}

@media (min-width: 992px) and (max-width: 1199px) {
    .user-profile-container {
        max-width: 90%;
    }
}

@media (min-width: 768px) and (max-width: 991px) {
    .user-profile-container {
        max-width: 95%;
    }
}

/* 主卡片樣式 */
.profile-main-card {
    border: none;
    border-radius: 15px;
    box-shadow: 0 8px 25px rgba(146, 85, 156, 0.15);
    overflow: hidden;
}

.profile-main-card .card-header {
    background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 100%);
    color: white;
    border: none;
    padding: 1.5rem;
}

.profile-main-card .card-header h4 {
    font-weight: 600;
    margin: 0;
}

.profile-main-card .card-body {
    padding: 2.5rem;
    background-color: #fafafa;
}

/* 調整各區域的間距 */
.avatar-upload-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.personal-info-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.social-binding-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.save-button-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}


/* 頭像上傳區域樣式 */
.avatar-upload-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-container {
    position: relative;
    display: inline-block;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.avatar-container:hover {
    transform: scale(1.05);
}

.user-avatar-large {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--light-purple);
    transition: border-color 0.3s ease;
}

.avatar-container:hover .user-avatar-large {
    border-color: var(--deep-purple);
}

.avatar-overlay {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--deep-purple);
    color: white;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    border: 3px solid white;
    transition: all 0.3s ease;
}

.avatar-container:hover .avatar-overlay {
    background: var(--orange-yellow);
    transform: scale(1.1);
}

.upload-controls {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
}

.upload-controls .btn {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.upload-controls .btn-outline-primary {
    border-color: var(--deep-purple);
    color: var(--deep-purple);
}

.upload-controls .btn-outline-primary:hover {
    background: var(--deep-purple);
    border-color: var(--deep-purple);
}

.upload-info p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--deep-gray);
}

/* 上傳狀態樣式 */
.avatar-container.uploading {
    opacity: 0.8;
    pointer-events: none;
}

.upload-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.upload-progress .progress {
    background-color: #e9ecef;
}

.upload-progress .progress-bar {
    background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 100%);
}

/* 按鈕禁用狀態 */
.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* 個人資訊區域樣式 */
.personal-info-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-row-group {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
}

.info-row-group .col-md-6,
.info-row-group .col-12 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
}

.info-row {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid #eee;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s ease;
    min-height: 60px;
}

.info-row:hover {
    background-color: #f0f0f0;
    border-color: var(--light-purple);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(146, 85, 156, 0.1);
}

.info-label {
    font-weight: 600;
    color: var(--deep-gray);
    min-width: 80px;
    margin: 0;
    font-size: 0.9rem;
}

.info-value {
    flex: 1;
    margin: 0 0.5rem;
    color: var(--deep-gray);
    font-size: 0.9rem;
}

.info-input {
    flex: 1;
    margin: 0 0.5rem;
    border: 1px solid var(--light-purple);
    border-radius: 4px;
    padding: 0.4rem 0.6rem;
    font-size: 0.9rem;
    transition: border-color 0.3s ease;
}

.info-input:focus {
    border-color: var(--deep-purple);
    box-shadow: 0 0 0 0.15rem rgba(146, 85, 156, 0.25);
    outline: none;
}

.info-row .btn-link {
    color: var(--deep-purple);
    text-decoration: none;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    transition: all 0.3s ease;
    font-size: 0.85rem;
}

.info-row .btn-link:hover {
    background-color: var(--light-purple);
    color: white;
}

.info-row .btn-outline-warning {
    border-color: var(--orange-yellow);
    color: var(--orange-yellow);
    border-radius: 6px;
    font-size: 0.8rem;
    padding: 0.3rem 0.6rem;
}

.info-row .btn-outline-warning:hover {
    background-color: var(--orange-yellow);
    border-color: var(--orange-yellow);
    color: white;
}

/* 響應式設計更新 */
@media (max-width: 768px) {
    .user-profile-container {
        margin: 1rem auto;
        padding: 0 0.5rem;
        max-width: 98%;
    }
    
    .profile-main-card .card-body {
        padding: 1.5rem;
    }
    
    .avatar-upload-section,
    .personal-info-section,
    .social-binding-section,
    .save-button-section {
        padding: 1.5rem;
    }
    
    .avatar-upload-section .row {
        text-align: center;
    }
    
    .avatar-upload-section .col-md-9 {
        margin-top: 1rem;
    }
    
    /* 手機版時改為單列 */
    .info-row-group .col-md-6 {
        margin-bottom: 0.75rem;
    }
    
    .info-row {
        min-height: 50px;
        padding: 0.5rem;
    }
    
    .info-label {
        min-width: 70px;
        font-size: 0.85rem;
    }
    
    .info-value,
    .info-input {
        font-size: 0.85rem;
    }
    
    .social-icons {
        flex-direction: column;
        align-items: center;
    }
    
    .social-btn {
        width: 100%;
        max-width: 200px;
        justify-content: center;
    }
}

@media (max-width: 576px) {
    .user-profile-container {
        margin: 0.5rem auto;
        padding: 0 0.25rem;
        max-width: 100%;
    }
    
    .profile-main-card .card-body {
        padding: 1rem;
    }
    
    .avatar-upload-section,
    .personal-info-section,
    .social-binding-section,
    .save-button-section {
        padding: 1rem;
    }
}
/* 第三方登入綁定區域樣式 */
.social-binding-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.social-binding-section h6 {
    color: var(--deep-gray);
    font-weight: 600;
    margin-bottom: 1rem;
}

.social-icons {
    gap: 1rem;
}

.social-btn {
    border-radius: 8px;
    padding: 0.6rem 1.2rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    min-width: 120px;
}

.social-btn:hover:not(:disabled) {
    transform: translateY(-2px);
}

.social-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
}

.connected-accounts {
    max-width: 600px;
    margin: 0 auto;
}

.connected-account {
    background-color: white;
    transition: all 0.3s ease;
}

.connected-account:hover {
    background-color: var(--light-gray);
}

/* 儲存按鈕區域樣式 */
.save-button-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.address-management-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.save-btn {
    background: linear-gradient(135deg, var(--deep-purple) 0%, var(--light-purple) 100%);
    border: none;
    border-radius: 10px;
    padding: 1rem 2rem;
    font-weight: 600;
    font-size: 1.1rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(146, 85, 156, 0.3);
}

.save-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--light-purple) 0%, var(--orange-yellow) 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(146, 85, 156, 0.4);
}

.save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 響應式設計 */
@media (max-width: 768px) {
    .user-profile-container {
        margin: 1rem auto;
        padding: 0 0.5rem;
    }
    
    .avatar-upload-section .row {
        text-align: center;
    }
    
    .avatar-upload-section .col-md-9 {
        margin-top: 1rem;
    }
    
    .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .info-label {
        min-width: auto;
    }
    
    .info-input,
    .info-value {
        margin: 0;
        width: 100%;
    }
    
    .social-icons {
        flex-direction: column;
        align-items: center;
    }
    
    .social-btn {
        width: 100%;
        max-width: 200px;
        justify-content: center;
    }
}
</style>