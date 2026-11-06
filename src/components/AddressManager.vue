<script setup>
import { ref, onMounted } from 'vue'
import { useAddressStore } from '@/stores/address'
import AddressForm from './AddressForm.vue'
import Swal from 'sweetalert2'

const addressStore = useAddressStore()

// 狀態管理
const showModal = ref(false)
const editingAddress = ref(null)
const isSubmitting = ref(false)

// 載入地址資料
onMounted(async () => {
    try {
        await addressStore.fetchAddresses()
    } catch (error) {
        console.error('載入地址失敗:', error)
        Swal.fire({
            icon: 'error',
            title: '載入失敗',
            text: '載入地址資料時發生錯誤，請稍後再試',
            confirmButtonText: '確定'
        })
    }
})

// 顯示新增表單
const showAddForm = () => {
    editingAddress.value = null
    showModal.value = true
}

// 編輯地址
const editAddress = (address) => {
    editingAddress.value = address
    showModal.value = true
}

// 關閉 Modal
const closeModal = () => {
    showModal.value = false
    editingAddress.value = null
}

// 處理表單提交
const handleFormSubmit = async (formData) => {
    isSubmitting.value = true
    
    try {
        let result
        
        if (editingAddress.value) {
            // 更新地址
            result = await addressStore.updateAddress(editingAddress.value.addressId, formData)
        } else {
            // 新增地址
            result = await addressStore.addAddress(formData)
        }
        
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '成功',
                text: result.message,
                confirmButtonText: '確定'
            })
            closeModal()
        }
    } catch (error) {
        console.error('地址操作失敗:', error)
        Swal.fire({
            icon: 'error',
            title: '操作失敗',
            text: error.message || '操作失敗，請稍後再試',
            confirmButtonText: '確定'
        })
    } finally {
        isSubmitting.value = false
    }
}

// 刪除地址
const deleteAddress = async (addressId) => {
    const result = await Swal.fire({
        title: '確定要刪除這個地址嗎？',
        text: '刪除後將無法復原',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消',
        confirmButtonColor: '#dc3545'
    })

    if (result.isConfirmed) {
        try {
            const deleteResult = await addressStore.deleteAddress(addressId)
            if (deleteResult.success) {
                Swal.fire({
                    icon: 'success',
                    title: '刪除成功',
                    text: deleteResult.message,
                    confirmButtonText: '確定'
                })
            }
        } catch (error) {
            console.error('刪除地址失敗:', error)
            Swal.fire({
                icon: 'error',
                title: '刪除失敗',
                text: error.message || '刪除失敗，請稍後再試',
                confirmButtonText: '確定'
            })
        }
    }
}

// 設定預設地址
const setDefaultAddress = async (addressId) => {
    try {
        const result = await addressStore.setDefaultAddress(addressId)
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '設定成功',
                text: result.message,
                confirmButtonText: '確定'
            })
        }
    } catch (error) {
        console.error('設定預設地址失敗:', error)
        Swal.fire({
            icon: 'error',
            title: '設定失敗',
            text: error.message || '設定失敗，請稍後再試',
            confirmButtonText: '確定'
        })
    }
}
</script>

<template>
    <div class="address-manager">
        <!-- 標題和新增按鈕 -->
        <div class="address-header">
            <h5 class="address-title">
                <i class="bi bi-geo-alt-fill me-2"></i>
                地址管理(AddressManager)
            </h5>
            <button 
                class="btn btn-primary btn-sm"
                @click="showAddForm"
                :disabled="addressStore.isLoading"
            >
                <i class="bi bi-plus-lg me-1"></i>
                新增地址(AddressForm)
            </button>
        </div>

        <!-- 載入狀態 -->
        <div v-if="addressStore.isLoading" class="loading-container">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">載入中...</span>
            </div>
            <p class="mt-2 text-muted">載入地址資料中...</p>
        </div>

        <!-- 地址列表 -->
        <div v-else-if="addressStore.addresses.length > 0" class="address-list">
            <!-- 預設地址 -->
            <div v-if="addressStore.defaultAddress" class="address-item default-address">
                <div class="address-content">
                    <div class="address-header-info">
                        <span class="badge bg-success me-2">預設</span>
                        <span class="address-type-badge">{{ addressStore.defaultAddress.addressTypeText }}</span>
                    </div>
                    <h6 class="recipient-name">{{ addressStore.defaultAddress.recipientName }}</h6>
                    <p class="phone-number">{{ addressStore.defaultAddress.phoneNumber }}</p>
                    <p class="full-address">{{ addressStore.defaultAddress.fullAddress }}</p>
                </div>
                <div class="address-actions">
                    <button 
                        class="btn btn-outline-primary btn-sm"
                        @click="editAddress(addressStore.defaultAddress)"
                        title="編輯地址"
                    >
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                        class="btn btn-outline-danger btn-sm"
                        @click="deleteAddress(addressStore.defaultAddress.addressId)"
                        title="刪除地址"
                    >
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>

            <!-- 其他地址 -->
            <div 
                v-for="address in addressStore.nonDefaultAddresses" 
                :key="address.addressId"
                class="address-item"
            >
                <div class="address-content">
                    <div class="address-header-info">
                        <span class="address-type-badge">{{ address.addressTypeText }}</span>
                    </div>
                    <h6 class="recipient-name">{{ address.recipientName }}</h6>
                    <p class="phone-number">{{ address.phoneNumber }}</p>
                    <p class="full-address">{{ address.fullAddress }}</p>
                </div>
                <div class="address-actions">
                    <button 
                        class="btn btn-outline-success btn-sm"
                        @click="setDefaultAddress(address.addressId)"
                        title="設為預設地址"
                    >
                        <i class="bi bi-star"></i>
                    </button>
                    <button 
                        class="btn btn-outline-primary btn-sm"
                        @click="editAddress(address)"
                        title="編輯地址"
                    >
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button 
                        class="btn btn-outline-danger btn-sm"
                        @click="deleteAddress(address.addressId)"
                        title="刪除地址"
                    >
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="empty-state">
            <i class="bi bi-geo-alt text-muted" style="font-size: 3rem;"></i>
            <h6 class="mt-3 text-muted">尚未新增任何地址</h6>
            <p class="text-muted">點擊上方「新增地址」按鈕來新增您的第一個地址</p>
        </div>

        <!-- 地址表單 Modal 新增/編輯地址共用的表單 -->
        <div 
            v-if="showModal" 
            class="modal-backdrop"
            @click="closeModal"
        >
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ editingAddress ? '編輯地址' : '新增地址' }}
                    </h5>
                    <button 
                        type="button" 
                        class="btn-close"
                        @click="closeModal"
                    ></button>
                </div>
                <div class="modal-body">
                    <AddressForm
                        :address="editingAddress"
                        :is-submitting="isSubmitting"
                        @submit="handleFormSubmit"
                        @cancel="closeModal"
                    />
                </div>
            </div>
        </div> 
    </div> 
</template>
<style scoped>
.address-manager {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.address-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.address-title {
    color: #686868;
    font-weight: 600;
    margin: 0;
}

.loading-container {
    text-align: center;
    padding: 2rem;
}

.address-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.address-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    border: 1px solid #eee;
    border-radius: 8px;
    background: #fafafa;
    transition: all 0.3s ease;
}

.address-item:hover {
    background: #f0f0f0;
    border-color: #d3a2da;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(146, 85, 156, 0.1);
}

.default-address {
    border: 2px solid #28a745;
    background: #f8fff9;
}

.address-content {
    flex: 1;
}

.address-header-info {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

.address-type-badge {
    background: #92559c;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.recipient-name {
    font-weight: 600;
    color: #686868;
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
}

.phone-number {
    color: #6c757d;
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
}

.full-address {
    color: #686868;
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
}

.address-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: 1rem;
}

.address-actions .btn {
    padding: 0.375rem 0.5rem;
    font-size: 0.8rem;
}

.empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #6c757d;
}

/* Modal 樣式 */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
    padding: 1rem;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 0 1.5rem;
    border-bottom: none;
}

.modal-title {
    color: #686868;
    font-weight: 600;
    margin: 0;
}

.btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    width: auto;
    height: auto;
}

.btn-close:hover {
    color: #dc3545;
}

.modal-body {
    padding: 1.5rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
    .address-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }
    
    .address-item {
        flex-direction: column;
        gap: 1rem;
    }
    
    .address-actions {
        margin-left: 0;
        justify-content: flex-end;
    }
    
    .modal-content {
        max-width: 95vw;
        margin: 0.5rem;
    }
}
</style> 