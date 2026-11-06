import api from './jjapi'
import { exLoginService } from './exLoginService'

export const googleAuthService = {
    // Google 登入流程 - 使用 Google OAuth 2.0 Access Token
    async googleLogin(googleData) {
        try {
            console.log('Google OAuth 登入資料:', googleData)
            
            // 調用後端的 Google 登入 API
            const response = await api.post('/auth/google-login', {
                loginProvider: 'Google',
                providerId: googleData.providerId, // Google user ID
                accessToken: googleData.accessToken, // Google access token
                email: googleData.email,
                name: googleData.name
            })
            
            console.log('後端 Google 登入回應:', response.data)
            
            if (response.data.success) {
                // 登入成功
                return {
                    success: true,
                    message: response.data.message,
                    isNewUser: response.data.isNewUser || false,
                    loginData: response.data.data // 包含 token 和用戶資料
                }
            } else if (response.data.needBinding) {
                // 需要手動綁定（Email 已被其他帳號使用）
                return {
                    success: false,
                    needsManualBinding: true,
                    message: response.data.message,
                    email: response.data.email,
                    googleData: googleData
                }
            } else {
                // 其他錯誤
                throw new Error(response.data.message || 'Google 登入失敗')
            }
        } catch (error) {
            console.error('Google 登入流程錯誤:', error)
            
            // 檢查是否是網路錯誤或後端錯誤
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message)
            } else {
                throw new Error(error.message || 'Google 登入失敗')
            }
        }
    },

    // 檢查 Google 帳號綁定狀況
    async checkGoogleBinding(googleUserId) {
        try {
            // 目前後端沒有提供檢查特定第三方帳號綁定狀況的 API
            // 這裡暫時返回未綁定狀態
            // 未來可以呼叫類似 /api/ExternalLogin/check-binding/Google/{googleUserId} 的 API
            
            return {
                isBound: false,
                userId: null
            }
        } catch (error) {
            console.error('檢查 Google 綁定狀況失敗:', error)
            return {
                isBound: false,
                userId: null
            }
        }
    },

    // 使用已綁定的會員帳號登入
    async loginWithBoundAccount(userId, googleData) {
        try {
            // 目前後端沒有提供直接用第三方帳號登入的 API
            // 這裡暫時返回需要手動登入的狀態
            // 未來可以呼叫類似 /api/Auth/external-login 的 API
            
            return {
                success: false,
                needsManualLogin: true,
                message: '請使用您的電子郵件和密碼登入，然後在個人設定中管理第三方帳號綁定'
            }
        } catch (error) {
            console.error('第三方帳號登入失敗:', error)
            throw new Error('登入失敗，請稍後再試')
        }
    },

    // 處理 Google 註冊流程（將 Google 資料傳遞給註冊頁面）
    storeGoogleDataForRegistration(googleData) {
        // 將 Google 資料暫存到 sessionStorage，供註冊頁面使用
        sessionStorage.setItem('pendingGoogleData', JSON.stringify({
            name: googleData.name,
            email: googleData.email,
            googleUserId: googleData.providerId,
            accessToken: googleData.accessToken
        }))
    },

    // 清除暫存的 Google 資料
    clearStoredGoogleData() {
        sessionStorage.removeItem('pendingGoogleData')
    },

    // 取得暫存的 Google 資料
    getStoredGoogleData() {
        const data = sessionStorage.getItem('pendingGoogleData')
        return data ? JSON.parse(data) : null
    }
} 