import { defineStore } from 'pinia'
import addressService from '@/services/addressService'

export const useAddressStore = defineStore('address', {
    state: () => ({
        addresses: [],
        isLoading: false,
        error: null
    }),

    getters: {
        // 取得預設地址
        defaultAddress: (state) => {
            return state.addresses.find(addr => addr.isDefault) || null
        },

        // 取得非預設地址
        nonDefaultAddresses: (state) => {
            return state.addresses.filter(addr => !addr.isDefault)
        },

        // 地址數量
        addressCount: (state) => {
            return state.addresses.length
        }
    },

    actions: {
        // 載入用戶地址列表
        async fetchAddresses() {
            this.isLoading = true
            this.error = null

            try {
                const response = await addressService.getUserAddresses()
                if (response.success) {
                    this.addresses = response.data
                } else {
                    throw new Error(response.message || '載入地址失敗')
                }
            } catch (error) {
                this.error = error.message
                console.error('載入地址失敗:', error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // 新增地址
        async addAddress(addressData) {
            this.isLoading = true
            this.error = null

            try {
                console.log('Store 接收到的地址資料:', addressData)
                const response = await addressService.createAddress(addressData)
                console.log('store 收到的回應:', response)

                if (response.success) {
                    // 重新載入地址列表
                    await this.fetchAddresses()
                    return { success: true, message: response.message }
                } else {
                    throw new Error(response.message || '新增地址失敗')
                }
            } catch (error) {
                this.error = error.message
                console.error('新增地址失敗:', error)

                // 如果是400錯誤, 則顯示詳細的錯誤訊息
                if (error.response && error.response.status === 400) {
                    console.error('400 錯誤詳情:', error.response.data)
                    this.error = error.response.data.message || error.message
                }
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // 更新地址
        async updateAddress(addressId, addressData) {
            this.isLoading = true
            this.error = null

            try {
                const response = await addressService.updateAddress(addressId, addressData)
                if (response.success) {
                    // 重新載入地址列表
                    await this.fetchAddresses()
                    return { success: true, message: response.message }
                } else {
                    throw new Error(response.message || '更新地址失敗')
                }
            } catch (error) {
                this.error = error.message
                console.error('更新地址失敗:', error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // 刪除地址
        async deleteAddress(addressId) {
            this.isLoading = true
            this.error = null

            try {
                const response = await addressService.deleteAddress(addressId)
                if (response.success) {
                    // 重新載入地址列表
                    await this.fetchAddresses()
                    return { success: true, message: response.message }
                } else {
                    throw new Error(response.message || '刪除地址失敗')
                }
            } catch (error) {
                this.error = error.message
                console.error('刪除地址失敗:', error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // 設定預設地址
        async setDefaultAddress(addressId) {
            this.isLoading = true
            this.error = null

            try {
                const response = await addressService.setDefaultAddress(addressId)
                if (response.success) {
                    // 重新載入地址列表
                    await this.fetchAddresses()
                    return { success: true, message: response.message }
                } else {
                    throw new Error(response.message || '設定預設地址失敗')
                }
            } catch (error) {
                this.error = error.message
                console.error('設定預設地址失敗:', error)
                throw error
            } finally {
                this.isLoading = false
            }
        },

        // 清除錯誤
        clearError() {
            this.error = null
        },

        // 重置狀態
        reset() {
            this.addresses = []
            this.isLoading = false
            this.error = null
        }
    }
}) 