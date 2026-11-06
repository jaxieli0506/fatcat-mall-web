import api from './jjapi'
import { exLoginService } from './exLoginService'

export const lineAuthService = {
    // LINE 登入流程 - 使用 LINE OAuth 2.0 Access Token
    async lineLogin(lineData) {
        try {
            console.log('LINE OAuth 登入資料:', lineData)
            
            // 調用後端的 LINE 登入 API
            const response = await api.post('/auth/line-login', {
                loginProvider: 'LINE',
                providerId: lineData.providerId, // LINE user ID
                accessToken: lineData.accessToken, // LINE access token
                email: lineData.email, // LINE 可能不提供 email
                name: lineData.name
            })
            
            console.log('後端 LINE 登入回應:', response.data)
            
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
                    lineData: lineData
                }
            } else {
                // 其他錯誤
                throw new Error(response.data.message || 'LINE 登入失敗')
            }
        } catch (error) {
            console.error('LINE 登入流程錯誤:', error)
            
            // 檢查是否是網路錯誤或後端錯誤
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message)
            } else {
                throw new Error(error.message || 'LINE 登入失敗')
            }
        }
    },

    // 儲存 LINE 登入資料以便後續註冊時使用
    storeLineDataForRegistration(lineData) {
        try {
            localStorage.setItem('pendingLineRegistration', JSON.stringify({
                ...lineData,
                timestamp: Date.now()
            }))
            console.log('LINE 註冊資料已儲存')
        } catch (error) {
            console.error('儲存 LINE 註冊資料失敗:', error)
        }
    },

    // 取得暫存的 LINE 註冊資料
    getPendingLineRegistrationData() {
        try {
            const stored = localStorage.getItem('pendingLineRegistration')
            if (!stored) return null

            const data = JSON.parse(stored)
            
            // 檢查資料是否過期（1小時後過期）
            if (Date.now() - data.timestamp > 3600000) {
                this.clearPendingLineRegistrationData()
                return null
            }

            return data
        } catch (error) {
            console.error('取得 LINE 註冊資料失敗:', error)
            this.clearPendingLineRegistrationData()
            return null
        }
    },

    // 清除暫存的 LINE 註冊資料
    clearPendingLineRegistrationData() {
        try {
            localStorage.removeItem('pendingLineRegistration')
            console.log('LINE 註冊資料已清除')
        } catch (error) {
            console.error('清除 LINE 註冊資料失敗:', error)
        }
    },

    // 初始化 LINE 登入流程（重用現有的 exLoginService）
    async initLineLogin() {
        try {
            console.log('開始 LINE 登入流程...')
            
            // 使用現有的 LINE 登入服務
            const lineResult = await exLoginService.initLineLogin()
            
            console.log('LINE 授權成功，準備處理登入...')
            
            return {
                success: true,
                lineData: {
                    providerId: lineResult.userID,
                    accessToken: lineResult.accessToken,
                    email: lineResult.email,
                    name: lineResult.name
                }
            }
        } catch (error) {
            console.error('LINE 登入授權失敗:', error)
            throw new Error(error.message || 'LINE 登入授權失敗')
        }
    }
} 