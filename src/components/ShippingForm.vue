<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import api from '@/services/jjapi.js'
import { useCheckoutStore } from '@/stores/checkout'
import { useAuthStore } from '@/stores/auth'
import AddressForm from './AddressForm.vue'
import Swal from 'sweetalert2'

const checkout = useCheckoutStore()
const authStore = useAuthStore()

// 狀態管理
const addressList = ref([])
const selectedAddressId = ref('')
const isLoading = ref(false)
const showAddressModal = ref(false)
const isSubmitting = ref(false)

const shippingOptions = ref([])
const selectedShippingId = ref('')
const recipientName = ref('')
const recipientPhone = ref('')
const recipientAddress = ref('')  
const storeName = ref('')
const sameAsMember = ref(false)

// 錯誤處理
const errors = ref({
  addressId: false
})

// 計算屬性: 選中的地址
const selectedAddress = computed(() => {
  return addressList.value.find(a => a.addressId === selectedAddressId.value)
})

// 格式化地址選項顯示
function formatAddressOption(address) {
  const type = address.addressType === 1 ? '超商取貨' : '宅配' 
  const defaultText = address.isDefault ? ' (預設)' : ''
  if(address.addressType === 1) {
    return `${address.recipientName} - ${type}${defaultText} - ${address.storeName || '未知的分店名稱'}`
  } else {
    return `${address.recipientName} - ${type}${defaultText} - ${address.city}${address.district}${address.addressDetail}`
  }
}

// 載入地址列表
const loadAddresses = async () => {
  isLoading.value = true
  try {
    const res = await api.get('/address')
    if (res.data && res.data.success) {
      addressList.value = res.data.data
      
      // 預設選擇預設地址
      const defaultAddr = addressList.value.find(a => a.isDefault)
      if (defaultAddr) {
        selectedAddressId.value = defaultAddr.addressId
      } else if (addressList.value.length > 0) {
        // 如果沒有預設地址，選擇第一個
        selectedAddressId.value = addressList.value[0].addressId
      }
    }
  } catch (error) {
    console.error('載入地址失敗:', error)
  } finally {
    isLoading.value = false
  }
}

// 當選擇地址時，同步到 checkout store
watch(selectedAddressId, (id) => {
  errors.value.addressId = false
  
  const addr = addressList.value.find(a => a.addressId === id)
  if (addr) {
    checkout.recipientName = addr.recipientName
    checkout.recipientPhone = addr.phoneNumber
    checkout.shippingAddressId = addr.addressId
    checkout.addressType = addr.addressType

    // 同步個人資料 (從地址資料擷取) 
    checkout.name = addr.recipientName
    checkout.phone = addr.phoneNumber
    // Email 直接套用使用者的email
    checkout.email = authStore.user?.email || ''
    
    // 組合完整地址
    // 超商取貨 addr.addressType === 1
    if (addr.addressType === 1) {
      checkout.recipientAddress = addr.addressDetail 
      checkout.storeName = addr.storeName || '未知的分店名稱' // 超商名稱
    } else {
      // 宅配 addr.addressType != 1
      checkout.recipientAddress = (addr.city || '') + (addr.district || '') + (addr.addressDetail || '') // 宅配地址(城市+區域+詳細地址)
      checkout.storeName = '' // 超商名稱為空 
    }
  }
})

// 顯示新增地址的 Modal
const showAddAddressModal = () => {
  showAddressModal.value = true
}

// 關閉新增地址的 Modal
const closeAddressModal = () => {
  showAddressModal.value = false
}

// 處理新增地址提交
const handleAddressSubmit = async (formData) => {
  isSubmitting.value = true
  try{
    const res = await api.post('/address',formData)
    if(res.data && res.data.success){
      Swal.fire({
        icon:'success',
        title:'新增成功',
        text:'地址新增成功',
        confirmButtonText:'確定'
      })

      // 重新載入地址列表
      await loadAddresses()
      closeAddressModal()
    }
  }catch(error){
    console.error('新增地址失敗:',error)
    Swal.fire({
      icon:'error',
      title:'新增失敗',
      text:error.response?.data?.message || '新增地址失敗，請稍後再試',
      confirmButtonText:'確定'
    })
  }finally{
    isSubmitting.value = false
  }
}

// 驗證方法
function validateShippingInfo() {
  let isValid = true
  
  // 重置錯誤
  errors.value.addressId = false
  
  if (!selectedAddressId.value) {
    errors.value.addressId = true
    isValid = false
  }

  // 確保個人資料已同步
  if(selectedAddress.value)
  {
    checkout.name = selectedAddress.value.recipientName
    checkout.phone = selectedAddress.value.phoneNumber
    checkout.email = authStore.user?.email || ''
  }
  
  return isValid
}

// 初始化
onMounted(() => {
  loadAddresses()
})

defineExpose({ validateShippingInfo })
</script>

<template>
  <ul class="list-group">
    <li class="list-group-item">
      <h3>選擇送貨方式、地址及收件人</h3>
    </li>

    <!-- 載入狀態 -->
    <li class="list-group-item" v-if="isLoading">
      <div class="text-center">
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span class="visually-hidden">載入中...</span>
        </div>
        載入地址中...
      </div>
    </li>

    <!-- 地址列表 -->
    <template v-else>
      <!-- 沒有地址時顯示提示 -->
      <li class="list-group-item" v-if="addressList.length === 0">
        <div class="text-center text-muted">
          <i class="bi bi-geo-alt" style="font-size: 2rem;"></i>
          <p class="mt-2 mb-0">尚未新增任何地址</p>
          <button class="btn btn-outline-primary btn-sm mt-2" @click="showAddAddressModal">
            <i class="bi bi-plus-lg me-1"></i>
            新增地址
          </button>
        </div>
      </li>

      <!-- 下拉式選單 -->
      <li class="list-group-item" v-else>
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <label for="addressSelect" class="form-label mb-0">選擇收件地址 <span class="gray">(收件人-運送方式-地址/門市)</span></label>
            <button class="btn btn-outline-primary btn-sm" @click="showAddAddressModal">
              <i class="bi bi-plus-lg me-1"></i>
              新增其他地址
            </button>
          </div>
          <select 
            class="form-select" 
            id="addressSelect" 
            v-model="selectedAddressId"
            :class="{'is-invalid': errors.addressId}"
          >
            <option value="" disabled>請選擇地址</option>
            <option
              v-for="address in addressList"
              :key="address.addressId"
              :value="address.addressId" 
            >
              {{ formatAddressOption(address) }}
            </option>
          </select>
          <div class="invalid-feedback" v-if="errors.addressId">
            請選擇地址及收件人
          </div>
        </div>

        <!-- 顯示選中的地址詳細資訊 -->
        <div v-if="selectedAddress" class="selected-address-info">
          <div class="card">
            <div class="card-body">
              <div class="address-header mb-2">
                <span v-if="selectedAddress.isDefault" class="badge bg-success me-2">預設</span>
                <span class="address-type-badge">
                  {{ selectedAddress.addressType === 1 ? '超商取貨' : '宅配' }}
                </span>
              </div>
              <div class="recipient-info mb-2">
                <strong>{{ selectedAddress.recipientName }}</strong>
                <span class="text-muted ms-2">{{ selectedAddress.phoneNumber }}</span>
              </div>
              <div class="address-detail">
                <span v-if="selectedAddress.addressType === 1">
                  {{ selectedAddress.storeName || '未知的分店名稱' }}
                  <br>
                  {{ selectedAddress.addressDetail }}
                </span>
                <span v-else>
                  {{ selectedAddress.city }}{{ selectedAddress.district }}{{ selectedAddress.addressDetail }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </li>
    </template>

    <!-- 錯誤訊息 -->
    <li class="list-group-item" v-if="errors.addressId">
      <span class="text-danger">請選擇送貨地址及收件人</span>
    </li>
  </ul>
   <!-- 新增地址 Modal -->
  <div v-if="showAddressModal" class="modal-backdrop" @click="closeAddressModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h5 class="modal-title">
          <i class="bi bi-plus-lg me-2"></i>
          新增地址
        </h5>
        <button 
          type="button" 
          class="btn-close"
          @click="closeAddressModal"
        ></button>
      </div>
      <div class="modal-body">
        <AddressForm
          :address="null"
          :is-submitting="isSubmitting"
          @submit="handleAddressSubmit"
          @cancel="closeAddressModal"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected-address-info {
  margin-top: 1rem;
}

.address-header {
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

.recipient-info {
  margin-bottom: 0.25rem;
}

.address-detail {
  color: #6c757d;
  font-size: 0.9rem;
}

.form-select:focus {
  border-color: #92559c;
  box-shadow: 0 0 0 0.25rem rgba(146, 85, 156, 0.25);
}

.form-select.is-invalid {
  border-color: #dc3545;
}

.form-select.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}
.gray {
  color: #6c757d;
  font-size: 0.875rem;
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
  .modal-content {
    max-width: 95vw;
    margin: 0.5rem;
  }
}
</style>