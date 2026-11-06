import api from './jjapi'

export const exLoginService = {
    // 獲取用戶的第三方登入連結
    async getConnections() {
        try {
            const response = await api.get('/ExternalLogin/connections')
            return response.data
        }
        catch (error) {
            throw error.response?.data || { message: '獲取第三方帳號連結失敗' }
        }
    },

    //綁定第三方帳號
    async bindAccount(providerData) {
        try {
            const response = await api.post('/ExternalLogin/bind', providerData)
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '綁定第三方帳號失敗' }
        }
    },

    //解除綁定第三方帳號
    async unbindAccount(provider) {
        try {
            const response = await api.post(`/ExternalLogin/unbind/${provider}`)
            return response.data
        } catch (error) {
            throw error.response?.data || { message: '解除綁定第三方帳號失敗' }
        }
    },

    //Facebook登入
    async initFBLogin() {
        return new Promise((resolve, reject) => {
            //檢查 FB SDK 是否已載入
            if (!window.FB) {
                reject(new Error(' FB SDK 尚未載入'))
                return
            }

            window.FB.login((response) => {
                if (response.authResponse) {
                    // 取得用戶基本資料
                    window.FB.api('/me', { fields: 'name,email' }, (userInfo) => {
                        if (userInfo && !userInfo.error) {
                            resolve({
                                accessToken: response.authResponse.accessToken,
                                userID: response.authResponse.userID,
                                email: userInfo.email || '',
                                name: userInfo.name || ''
                            })
                        } else {
                            reject(new Error('無法取得 Facebook 用戶資料'))
                        }
                    })
                } else {
                    reject(new Error('Facebook 登入失敗'))
                }
            }, { scope: 'email' })
        })
    },

    //Google 登入
    async initGoogleLogin() {
        return new Promise((resolve, reject) => {
            // 檢查 Google SDK 是否已載入
            if (!window.google) {
                reject(new Error('Google SDK 尚未載入'))
                return
            }

            try {
                // 初始化 Google OAuth
                window.google.accounts.oauth2.initTokenClient({
                    client_id: window.googleClientId,
                    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                    callback: async (response) => {
                        if (response.error) {
                            reject(new Error(`Google 登入失敗: ${response.error}`))
                            return
                        }

                        try {
                            // 使用 access_token 取得用戶資訊
                            const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`)
                            
                            if (!userInfoResponse.ok) {
                                throw new Error('無法取得 Google 用戶資料')
                            }

                            const userInfo = await userInfoResponse.json()
                            
                            resolve({
                                accessToken: response.access_token,
                                userID: userInfo.id,
                                email: userInfo.email || '',
                                name: userInfo.name || ''
                            })
                        } catch (error) {
                            reject(new Error('處理 Google 用戶資料時發生錯誤: ' + error.message))
                        }
                    }
                }).requestAccessToken()
            } catch (error) {
                reject(new Error('初始化 Google 登入時發生錯誤: ' + error.message))
            }
        })
    },

    // LINE 登入
    async initLineLogin() {
        return new Promise((resolve, reject) => {
            // 檢查 LINE Channel ID 是否已設定
            if (!window.lineChannelId) {
                reject(new Error('LINE Channel ID 尚未設定'))
                return
            }

            try {
                // 使用 LINE Login Web API
                const state = this.generateRandomString(32) // 產生隨機狀態字串
                const nonce = this.generateRandomString(32) // 產生隨機 nonce
                
                // 設定重導向 URI (需要與 LINE Developers Console 中設定的一致)
                const redirectUri = `${window.location.origin}/line-callback`
                
                // 建構 LINE Login URL
                const lineLoginUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
                lineLoginUrl.searchParams.append('response_type', 'code')
                lineLoginUrl.searchParams.append('client_id', window.lineChannelId)
                lineLoginUrl.searchParams.append('redirect_uri', redirectUri)
                lineLoginUrl.searchParams.append('state', state)
                lineLoginUrl.searchParams.append('scope', 'profile openid email')
                lineLoginUrl.searchParams.append('nonce', nonce)

                // 儲存狀態資訊到 sessionStorage
                sessionStorage.setItem('lineLoginState', state)
                sessionStorage.setItem('lineLoginNonce', nonce)
                
                // 建立彈出視窗進行 LINE 登入
                const loginWindow = window.open(
                    lineLoginUrl.toString(),
                    'lineLogin',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                )

                // 監聽彈出視窗的訊息
                const messageHandler = (event) => {
                    if (event.origin !== window.location.origin) {
                        return
                    }

                    if (event.data.type === 'LINE_LOGIN_SUCCESS') {
                        window.removeEventListener('message', messageHandler)
                        loginWindow.close()
                        
                        resolve({
                            accessToken: event.data.accessToken,
                            userID: event.data.userID,
                            email: event.data.email || '',
                            name: event.data.name || ''
                        })
                    } else if (event.data.type === 'LINE_LOGIN_ERROR') {
                        window.removeEventListener('message', messageHandler)
                        loginWindow.close()
                        reject(new Error(event.data.message || 'LINE 登入失敗'))
                    }
                }

                window.addEventListener('message', messageHandler)

                // 檢查彈出視窗是否被關閉
                const checkClosed = setInterval(() => {
                    if (loginWindow.closed) {
                        clearInterval(checkClosed)
                        window.removeEventListener('message', messageHandler)
                        reject(new Error('LINE 登入已取消'))
                    }
                }, 1000)
            } catch (error) {
                reject(new Error('初始化 LINE 登入時發生錯誤: ' + error.message))
            }
        })
    },

    // 產生隨機字串
    generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let result = ''
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return result
    },

    // 交換授權碼為 access token
    async exchangeLineCodeForToken(code, state) {
        try {
            console.log('🔄 開始交換 LINE 授權碼為 access token')
            console.log('📋 請求參數:', {
                code: code.substring(0, 10) + '...',
                state: state.substring(0, 10) + '...',
                redirectUri: `${window.location.origin}/line-callback`
            })

            // 驗證狀態
            const savedState = sessionStorage.getItem('lineLoginState')
            console.log('🔍 狀態驗證:', {
                received: state.substring(0, 10) + '...',
                saved: savedState ? savedState.substring(0, 10) + '...' : null,
                match: state === savedState
            })

            if (state !== savedState) {
                console.error('❌ 狀態參數驗證失敗')
                throw new Error('無效的狀態參數')
            }

            // 呼叫後端 API 來交換 token
            console.log('📡 呼叫後端 API: /ExternalLogin/line-token-exchange')
            
            const requestData = {
                code: code,
                redirectUri: `${window.location.origin}/line-callback`
            }
            
            console.log('📤 發送請求資料:', {
                code: code.substring(0, 10) + '...',
                redirectUri: requestData.redirectUri
            })

            const response = await api.post('/ExternalLogin/line-token-exchange', requestData)
            
            console.log('📥 後端回應:', {
                status: response.status,
                hasData: !!response.data,
                hasAccessToken: !!(response.data && response.data.accessToken),
                userID: response.data?.userID,
                name: response.data?.name
            })

            if (!response.data) {
                console.error('❌ 後端回應沒有資料')
                throw new Error('後端回應格式錯誤')
            }

            if (!response.data.accessToken) {
                console.error('❌ 後端回應沒有 access token')
                throw new Error('無法取得 access token')
            }

            console.log('✅ LINE token 交換成功')
            return response.data

        } catch (error) {
            console.error('❌ LINE token 交換失敗:', error)
            
            // 詳細記錄錯誤資訊
            if (error.response) {
                console.error('📋 錯誤回應詳情:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    headers: error.response.headers
                })
            }
            
            throw error.response?.data || { message: '交換 LINE token 失敗: ' + error.message }
        }
    }
}