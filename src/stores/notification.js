import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/jjapi'

export const useNotificationStore = defineStore('notification', () => {
    // 管理員通知狀態
    const notifications = ref([])
    const loading = ref(false)
    const error = ref(null)

    // 用戶通知狀態
    const userNotifications = ref([])
    const userLoading = ref(false)
    const userError = ref(null)

    // 計算屬性：管理員未讀通知數量
    const unreadCount = computed(() => {
        return notifications.value.filter(n => !n.isRead).length
    })

    // 計算屬性：用戶未讀通知數量
    const userUnreadCount = computed(() => {
        return userNotifications.value.filter(n => !n.isRead).length
    })

    // 取得管理員通知列表
    const fetchAdminNotifications = async (adminId) => {
        if (!adminId) {
            notifications.value = []
            return
        }

        loading.value = true
        error.value = null

        try {
            const res = await api.get(`/Notifications/Admin/${adminId}`)
            notifications.value = res.data
        } catch (e) {
            error.value = '取得通知失敗'
            notifications.value = []
        } finally {
            loading.value = false
        }
    }

    // 取得用戶通知列表
    const fetchUserNotifications = async (userId) => {
        if (!userId) {
            userNotifications.value = []
            return
        }

        userLoading.value = true
        userError.value = null

        try {
            const res = await api.get(`/Notifications/User/${userId}`)
            userNotifications.value = res.data
        } catch (e) {
            userError.value = '取得通知失敗'
            userNotifications.value = []
        } finally {
            userLoading.value = false
        }
    }

    // 標記單一通知為已讀
    const markAsRead = async (notification) => {
        try {
            await api.post('/Notifications/Read', {
                receiverId: notification.receiverId
            })
            notification.isRead = true
            notification.readTime = new Date().toISOString()
        } catch (e) {
            error.value = '標為已讀失敗'
            throw e
        }
    }

    // 標記用戶通知為已讀
    const markUserAsRead = async (notification) => {
        try {
            await api.post('/Notifications/Read', {
                receiverId: notification.receiverId
            })
            notification.isRead = true
            notification.readTime = new Date().toISOString()
        } catch (e) {
            userError.value = '標為已讀失敗'
            throw e
        }
    }

    // 全部標為已讀
    const markAllAsRead = async () => {
        const unread = notifications.value.filter(n => !n.isRead)
        for (const n of unread) {
            await markAsRead(n)
        }
    }

    // 全部用戶通知標為已讀
    const markAllUserAsRead = async () => {
        const unread = userNotifications.value.filter(n => !n.isRead)
        for (const n of unread) {
            await markUserAsRead(n)
        }
    }

    // 清除錯誤
    const clearError = () => {
        error.value = null
        userError.value = null
    }

    // 清除通知列表
    const clearNotifications = () => {
        notifications.value = []
    }

    // 清除用戶通知列表
    const clearUserNotifications = () => {
        userNotifications.value = []
    }

    // 全域刷新用戶通知（管理員操作後觸發）
    const refreshUserNotifications = async () => {
        // 檢查是否有前台使用者登入
        const user = localStorage.getItem('user')
        if (!user) return
        
        try {
            const userData = JSON.parse(user)
            const userId = userData.userId
            if (userId) {
                await fetchUserNotifications(userId)
                console.log('用戶通知已刷新，當前未讀數量:', userUnreadCount.value)
            }
        } catch (e) {
            console.warn('刷新用戶通知失敗:', e.message)
        }
    }

    return {
        // 管理員通知狀態
        notifications,
        loading,
        error,
        // 用戶通知狀態
        userNotifications,
        userLoading,
        userError,
        // 計算屬性
        unreadCount,
        userUnreadCount,
        // 方法
        fetchAdminNotifications,
        fetchUserNotifications,
        markAsRead,
        markUserAsRead,
        markAllAsRead,
        markAllUserAsRead,
        clearError,
        clearNotifications,
        clearUserNotifications,
        refreshUserNotifications
    }
})