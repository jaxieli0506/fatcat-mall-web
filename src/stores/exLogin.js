import { defineStore } from "pinia";
import { ref } from "vue";
import { exLoginService } from "../services/exLoginService";

export const useexLoginStore = defineStore('exlogin', () => {
    const connections = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    // 獲取用戶的第三方登入連結
    const fetchConnections = async () => {
        try {
            isLoading.value = true
            error.value = null
            const response = await exLoginService.getConnections()
            connections.value = response.data
            return { success: true }
        } catch (err) {
            error.value = err.message
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    //綁定第三方帳號
    const bindAccount = async (provider, accessToken, providerId, email = '', name = '') => {
        try {
            isLoading.value = true
            error.value = null

            const bindData = {
                loginProvider: provider,
                providerId: providerId,
                accessToken: accessToken,
                email: email,
                name: name
            }
            const response = await exLoginService.bindAccount(bindData)

            if (response.success) {
                // 重新獲取連結列表
                await fetchConnections()
                return { success: true, message: '綁定成功' }
            } else {
                throw new Error(response.message || '綁定失敗')
            }
        } catch (err) {
            error.value = err.message
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 解除綁定第三方帳號
    const unbindAccount = async (provider) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await exLoginService.unbindAccount(provider)

            if (response.success) {
                // 重新獲取連結列表
                await fetchConnections()
                return { success: true, message: '解除綁定成功' }
            } else {
                throw new Error(response.message || '解除綁定失敗')
            }
        } catch (err) {
            error.value = err.message
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 初始化 Facebook 登入
    const initFBLogin = async () => {
        try {
            const fbResponse = await exLoginService.initFBLogin()
            return await bindAccount('Facebook', fbResponse.accessToken, fbResponse.userID, fbResponse.email, fbResponse.name)
        } catch (err) {
            return { success: false, message: err.message }
        }
    }

    // 初始化 Google 登入
    const initGoogleLogin = async () => {
        try {
            const googleResponse = await exLoginService.initGoogleLogin()
            return await bindAccount('Google', googleResponse.accessToken, googleResponse.userID, googleResponse.email, googleResponse.name)
        } catch (err) {
            return { success: false, message: err.message }
        }
    }

    // 初始化 LINE 登入
    const initLineLogin = async () => {
        try {
            const lineResponse = await exLoginService.initLineLogin()
            return await bindAccount('LINE', lineResponse.accessToken, lineResponse.userID, '', '')
        } catch (err) {
            return { success: false, message: err.message }
        }
    }

    return {
        connections,
        isLoading,
        error,
        fetchConnections,
        bindAccount,
        unbindAccount,
        initFBLogin,
        initGoogleLogin,
        initLineLogin
    }


})