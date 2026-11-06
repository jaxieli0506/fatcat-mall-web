import api from './jjapi'

class AddressService {
    // 取得用戶所有地址
    async getUserAddresses() {
        try {
            const response = await api.get('/address')
            return response.data
        } catch (error) {
            console.error('取得地址列表失敗:', error)
            throw error
        }
    }

    // 取得單一地址
    async getAddress(addressId) {
        try {
            const response = await api.get(`/address/${addressId}`)
            return response.data
        } catch (error) {
            console.error('取得地址失敗:', error)
            throw error
        }
    }

    // 新增地址
    async createAddress(addressData) {
        try {
            console.log('發送地址資料:', addressData)
            const response = await api.post('/address', addressData)
            console.log('API 回應:', response.data)
            return response.data
        } catch (error) {
            console.error('新增地址失敗:', error)
            // 如果是400錯誤, 則顯示詳細的錯誤訊息
            if (error.response && error.response.status === 400) {
                console.error('400 錯誤詳情:', error.response.data)
            }
            throw error
        }
    }

    // 更新地址
    async updateAddress(addressId, addressData) {
        try {
            const response = await api.put(`/address/${addressId}`, addressData)
            return response.data
        } catch (error) {
            console.error('更新地址失敗:', error)
            throw error
        }
    }

    // 刪除地址
    async deleteAddress(addressId) {
        try {
            const response = await api.delete(`/address/${addressId}`)
            return response.data
        } catch (error) {
            console.error('刪除地址失敗:', error)
            throw error
        }
    }

    // 設定預設地址
    async setDefaultAddress(addressId) {
        try {
            const response = await api.post(`/address/${addressId}/default`)
            return response.data
        } catch (error) {
            console.error('設定預設地址失敗:', error)
            throw error
        }
    }
}

export default new AddressService() 