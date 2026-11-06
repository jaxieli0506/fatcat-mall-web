import axios from "axios"

// 建立 axios 實例
const api = axios.create({
    baseURL: 'https://localhost:7017/api', // 統一的後端 API 基礎路徑
    timeout: 5000, // 請求逾時 5 秒
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Helper function：判斷是否為登入或驗證相關 API
function isAuthRelatedURL(url) {
    if (!url) return false
    return (
        url.includes('/auth/login') ||
        url.includes('/ExternalLogin') ||
        url.includes('/admin/login')
    )
}

// 請求攔截器：自動加上 JWT Token
api.interceptors.request.use(
    (config) => {
        // 判斷是否為管理員api 只要是包含 /Admin 或 /admin 的 API 都視為管理員 API
        // 以及 /Notifications/Send API 使用 管理員的 token
        const isAdminAPI = config.url.includes('/Admin') ||
            config.url.includes('/admin') ||
            config.url.includes('/Notifications/Send')
        let token = null
        if (isAdminAPI) {
            // 取得管理員的 token
            token = localStorage.getItem('adminToken')
        } else {
            // 取得一般使用者的 token
            token = localStorage.getItem('token')
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 回應攔截器：統一處理 401 錯誤
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url = error.config?.url
            const isLoginPage = window.location.pathname === '/login'
            const isAuthAPI = isAuthRelatedURL(url)
        }

        return Promise.reject(error)
    }
)

export default api
