//////////////////////// 管理員登入 //////////////////////////////
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/jjapi'

export const useAdminAuthStore = defineStore('adminAuth', () => {
    // 狀態
    const admin = ref(null)
    const token = ref(null)
    const isLoading = ref(false)
    const error = ref(null)

    // 是否已登入（計算屬性）
    const isAuthenticated = computed(() => {
        return !!token.value && !!admin.value
    })

    // 初始化認證狀態 - 從 localStorage 讀取認證資訊
    const initializeAuth = () => {
        const savedToken = localStorage.getItem('adminToken')
        const savedAdmin = localStorage.getItem('adminUser')

        if (savedToken && savedAdmin) {
            token.value = savedToken
            admin.value = JSON.parse(savedAdmin)
        }
    }

    // 管理員登入
    const login = async (loginData) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await api.post('/admin/login', loginData)

            if (response.data) {
                const adminData = response.data

                // 儲存到狀態
                token.value = adminData.token
                admin.value = {
                    adminId: adminData.admin.adminId,
                    name: adminData.admin.name,
                    email: loginData.email,
                    role: adminData.admin.role
                }

                // 儲存到 localStorage
                localStorage.setItem('adminToken', adminData.token)
                localStorage.setItem('adminUser', JSON.stringify(admin.value))

                return { success: true, message: '登入成功' }
            } else {
                throw new Error('登入失敗')
            }
        } catch (err) {
            error.value = err.response?.data || err.message || '登入失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 管理員登出
    const logout = async () => {
        try {
            isLoading.value = true

            // 清除狀態
            admin.value = null
            token.value = null
            error.value = null

            // 清除 localStorage
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')

            return { success: true, message: '登出成功' }
        } catch (err) {
            // 即使後端失敗，也要清除本地狀態
            admin.value = null
            token.value = null
            error.value = null
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')

            return { success: true, message: '登出成功' }
        } finally {
            isLoading.value = false
        }
    }

    // 獲取管理員列表
    const fetchAdmins = async (queryParams = {}) => {
        try {
            isLoading.value = true
            error.value = null

            const params = new URLSearchParams({
                searchKeyword: queryParams.searchKeyword || '',
                sortBy: queryParams.sortBy || 'AdminId',
                sortOrder: queryParams.sortOrder || 'asc',
                page: queryParams.page || 1,
                pageSize: queryParams.pageSize || 10
            })

            const response = await api.get(`/Admins?${params}`)

            if (response.data) {
                return {
                    success: true,
                    data: response.data
                }
            } else {
                throw new Error('取得管理員列表失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '取得管理員列表失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 新增管理員
    const createAdmin = async (adminData) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await api.post('/Admins', adminData)

            if (response.data) {
                return {
                    success: true,
                    message: '管理員新增成功',
                    data: response.data
                }
            } else {
                throw new Error('新增管理員失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '新增管理員失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 更新管理員
    const updateAdmin = async (adminId, adminData) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await api.put(`/Admins/${adminId}`, adminData)

            if (response.data) {
                return {
                    success: true,
                    message: response.data.message || '管理員資料更新成功'
                }
            } else {
                throw new Error('更新管理員失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '更新管理員失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 刪除管理員
    const deleteAdmin = async (adminId) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await api.delete(`/Admins/${adminId}`)

            if (response.data) {
                return {
                    success: true,
                    message: response.data.message || '管理員刪除成功'
                }
            } else {
                throw new Error('刪除管理員失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '刪除管理員失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 獲取單一管理員詳細資訊
    const fetchAdmin = async (adminId) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await api.get(`/Admins/${adminId}`)

            if (response.data) {
                return {
                    success: true,
                    data: response.data
                }
            } else {
                throw new Error('取得管理員詳細資訊失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '取得管理員詳細資訊失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 獲取已刪除管理員列表
    const fetchDeletedAdmins = async (queryParams = {}) => {
        try {
            isLoading.value = true
            error.value = null

            const params = new URLSearchParams({
                searchKeyword: queryParams.searchKeyword || '',
                sortBy: queryParams.sortBy || 'AdminId',
                sortOrder: queryParams.sortOrder || 'desc',
                page: queryParams.page || 1,
                pageSize: queryParams.pageSize || 10
            })

            const response = await api.get(`/Admins/deleted?${params}`)

            if (response.data) {
                return {
                    success: true,
                    data: response.data
                }
            } else {
                throw new Error('取得已刪除管理員列表失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '取得已刪除管理員列表失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }

    // 復原已刪除的管理員
    const restoreAdmin = async (adminId) => {
        try {
            isLoading.value = true
            error.value = null

            const response = await api.put(`/Admins/${adminId}/restore`)

            if (response.data) {
                return {
                    success: true,
                    message: response.data.message || '管理員復原成功'
                }
            } else {
                throw new Error('復原管理員失敗')
            }
        } catch (err) {
            error.value = err.response?.data?.message || err.message || '復原管理員失敗'
            return { success: false, message: error.value }
        } finally {
            isLoading.value = false
        }
    }




    // 清除錯誤
    const clearError = () => {
        error.value = null
    }

    // 返回狀態和方法
    return {
        // 狀態
        admin,
        token,
        isLoading,
        error,
        // 計算屬性
        isAuthenticated,
        // 方法
        initializeAuth,
        login,
        logout,
        fetchAdmins,
        createAdmin,
        updateAdmin,
        deleteAdmin,
        fetchAdmin,
        fetchDeletedAdmins,
        restoreAdmin,
        // 清除錯誤
        clearError
    }
})