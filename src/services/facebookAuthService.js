import api from './jjapi'
import { exLoginService } from './exLoginService'

export const facebookAuthService = {
    // Facebook 登入流程 - 使用新的後端 API
    async facebookLogin() {
        try {
            // 1. 執行 Facebook 登入，獲取用戶資料
            const fbResponse = await exLoginService.initFBLogin()
            console.log('Facebook SDK 回應:', fbResponse)
            
            // 2. 調用後端的 Facebook 登入 API
            const response = await api.post('/auth/facebook-login', {
                loginProvider: 'Facebook',
                providerId: fbResponse.userID,
                accessToken: fbResponse.accessToken,
                email: fbResponse.email,
                name: fbResponse.name
            })
            
            console.log('後端 Facebook 登入回應:', response.data)
            
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
                    facebookData: fbResponse
                }
            } else {
                // 其他錯誤
                throw new Error(response.data.message || 'Facebook 登入失敗')
            }
        } catch (error) {
            console.error('Facebook 登入流程錯誤:', error)
            
            // 檢查是否是網路錯誤或後端錯誤
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message)
            } else {
                throw new Error(error.message || 'Facebook 登入失敗')
            }
        }
    },

    // 檢查 Facebook 帳號綁定狀況（這個功能需要後端支援）
    async checkFacebookBinding(facebookUserId) {
        try {
            // 目前後端沒有提供檢查特定第三方帳號綁定狀況的 API
            // 這裡暫時返回未綁定狀態
            // 未來可以呼叫類似 /api/ExternalLogin/check-binding/Facebook/{facebookUserId} 的 API
            
            return {
                isBound: false,
                userId: null
            }
        } catch (error) {
            console.error('檢查 Facebook 綁定狀況失敗:', error)
            return {
                isBound: false,
                userId: null
            }
        }
    },

    // 使用已綁定的會員帳號登入（這個功能需要後端支援）
    async loginWithBoundAccount(userId, facebookData) {
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

    // 處理 Facebook 註冊流程（將 Facebook 資料傳遞給註冊頁面）
    storeFacebookDataForRegistration(facebookData) {
        // 將 Facebook 資料暫存到 sessionStorage，供註冊頁面使用
        sessionStorage.setItem('pendingFacebookData', JSON.stringify({
            name: facebookData.name,
            email: facebookData.email,
            facebookUserId: facebookData.userID,
            accessToken: facebookData.accessToken,
            timestamp: Date.now()
        }))
    },

    // 從 sessionStorage 中獲取待處理的 Facebook 資料
    getPendingFacebookData() {
        try {
            const data = sessionStorage.getItem('pendingFacebookData')
            if (data) {
                const parsed = JSON.parse(data)
                // 檢查資料是否過期（30分鐘）
                if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                    return parsed
                } else {
                    this.clearPendingFacebookData()
                }
            }
            return null
        } catch (error) {
            console.error('獲取待處理 Facebook 資料失敗:', error)
            return null
        }
    },

    // 清除待處理的 Facebook 資料
    clearPendingFacebookData() {
        sessionStorage.removeItem('pendingFacebookData')
    }
} 