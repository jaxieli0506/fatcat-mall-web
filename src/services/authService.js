import api from "./jjapi";

///// 負責使用者登入 (勿與管理員登入混用 !!) ///////////////////////
// 認證相關的 API 服務
export const authService = {
    // 呼叫登入 API
    async login(loginData) {
        try {
            const response = await api.post('/auth/login', loginData)
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '登入失敗' }
        }
    },

    //  呼叫註冊 API
    async register(registerData) {
        try {
            const response = await api.post('/auth/register', registerData)
            return response.data
        }
        catch (error) {
            throw error.response?.data || { message: '註冊失敗' }
        }
    },

    // 獲取用戶資訊
    async getProfile() {
        try {
            const response = await api.get('/auth/profile')
            return response.data
        }
        catch (error) {
            throw error.response?.data || { message: '獲取用戶資訊失敗' }
        }
    },
    // 新增到 authService 物件中
    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/auth/upload-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: '上傳頭像失敗' };
        }
    },

    // 更新用戶資料
    async updateProfile(userData) {
        try {
            const response = await api.put('/auth/profile', userData)
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '更新用戶資料失敗' }
        }
    },

    //// 密碼變更
    async changePassword(passwordData) {
        try {
            const response = await api.post('/auth/change-password', passwordData)
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '密碼變更失敗' }
        }
    },

    // 忘記密碼 - 發送重設密碼郵件
    async forgotPassword(email) {
        try {
            const response = await api.post('/auth/forgot-password', { email })
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '發送重設密碼郵件失敗' }
        }
    },

    // 重設密碼 - 使用令牌重設密碼
    async resetPassword(resetData) {
        try {
            const response = await api.post('/auth/reset-password', resetData)
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '重設密碼失敗' }
        }
    },

    // 呼叫登出 API
    async logout() {
        try {
            // 呼叫後端登出 API
            await api.post('/auth/logout')
        } catch (error) {
            // 即使後端失敗也繼續清除本地狀態
            console.warn('後端登出失敗，但仍清除本地狀態')
        } finally {
            // 無論如何都要清除本地狀態（修正：移除 this 調用）
            authService.clearAuthData()
        }
    },

    // 清除認證資料
    clearAuthData() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 清除其他相關資料
    },

    // 檢查用戶是否已登入
    isAuthenticated() {
        const token = localStorage.getItem('token')
        if (!token) {
            return false
        }
        try {
            // 簡單的 token 格式檢查
            const payload = JSON.parse(atob(token.split('.')[1]))
            const currentTime = Date.now() / 1000
            return payload.exp > currentTime
        }
        catch (error) {
            return false
        }
    },

    // 儲存認證資訊到 localStorage
    saveAuthData(authData) {
        localStorage.setItem('token', authData.token)
        localStorage.setItem('user', JSON.stringify({
            userId: authData.userId,
            name: authData.name,
            email: authData.email,
            picPath: authData.picPath
        }))
    },

    // 清除認證資訊
    clearAuthData() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    },

    // 獲取當前用戶資訊
    getCurrentUser() {
        const userStr = localStorage.getItem('user')
        return userStr ? JSON.parse(userStr) : null
    }
}




export default authService
