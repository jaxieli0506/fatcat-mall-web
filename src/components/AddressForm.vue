<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { twCities, getDistrictsByCity, getAllCityNames } from '@/data/twCities'

const showMapModal = ref(false)
const mapLoading = ref(false)
const authStore = useAuthStore()

const props = defineProps({
    address: { type: Object, default: null },
    isSubmitting: { type: Boolean, default: false }
})



const emit = defineEmits(['submit', 'cancel'])

const form = reactive({
    recipientName: '',
    phoneNumber: '',
    addressType: '',
    storeType: null,
    storeId: '',
    storeName: '',
    storeBranch: '',
    city: '',
    district: '',
    addressDetail: '',
    isDefault: false
})

const errors = reactive({
    recipientName: '',
    phoneNumber: '',
    addressType: '',
    storeType: '',
    storeId: '',
    storeName: '',
    storeBranch: '',
    city: '',
    district: '',
    addressDetail: ''
})

const isEdit = computed(() => props.address !== null)

// 計算屬性：判斷是否為超商地址 --------------------------------------------------------------------------------------------
const isStoreAddress = computed(() => form.addressType === '1')
// 計算屬性：判斷是否為一般宅配地址
const isHomeAddress = computed(() => form.addressType === '0')

// 獲取城市列表
const cityOptions = computed(()=> getAllCityNames())

// 獲取區域列表（根據選擇的城市）
const districtOptions = computed(()=> {
    if(!form.city) return []
    return getDistrictsByCity(form.city)
})

// 監聽城市變化, 清空區域選擇
watch(()=> form.city,(newCity,oldCity)=>{
    if(newCity !== oldCity){
        form.district = ''
    }
})

// 7-11 電子地圖
const openMapModal = () => {
  showMapModal.value = true
  mapLoading.value = true
  
  console.log('開始載入 7-11 電子地圖...')
  
  // 建立表單並提交到 7-11 電子地圖
  const mapForm = document.createElement('form') // 改名避免衝突
  mapForm.id = 'mapForm'
  mapForm.method = 'POST'
  mapForm.action = 'https://emap.presco.com.tw/c2cemap.ashx'
  mapForm.target = 'cvsmap'
  
  // 7-11 電子地圖參數
  const params = {
    'URL': `${window.location.origin}/api/AddressEcpay/map-callback`, // 回調 URL
    'PostMode': '1',
    'MerchantID': 'TEST123' // 測試用，可填任意值
  }
  
  // 加入表單欄位
  Object.keys(params).forEach(key => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = params[key]
    mapForm.appendChild(input)
  })
  
  // 提交表單
  document.body.appendChild(mapForm)
  mapForm.submit()
  document.body.removeChild(mapForm)
  
  // 監聽來自 iframe 的訊息
  const messageHandler = (event) => {
    if (event.data && event.data.type === 'store_selected') {
      const storeInfo = event.data.storeInfo
      console.log('收到門市選擇:', storeInfo)
      
      // 更新表單資料 - 使用正確的 form 變數
      form.storeId = storeInfo.storeId
      form.storeName = storeInfo.storeName
      form.addressDetail = storeInfo.storeAddress
      form.storeType = 0 // 7-Eleven 的 StoreType 是 0
      form.storeBranch = '' // 7-11 沒有分店名，設為空字串
      
      // 解析地址 - 使用台灣地區資料進行智能解析
      const addr = storeInfo.storeAddress
      
      // 遍歷所有城市，找到匹配的
      for (const cityData of twCities) {
        if (addr.includes(cityData.name)) {
          form.city = cityData.name
          
          // 移除城市名稱後，嘗試匹配區域
          const addressWithoutCity = addr.replace(cityData.name, '')
          
          // 找到匹配的區域
          const matchedDistrict = cityData.districts.find(district => 
            addressWithoutCity.includes(district.name)
          )
          
          if (matchedDistrict) {
            // 對於超商地址，區域欄位顯示門市名稱
            form.district = form.storeName
          } else {
            // 如果找不到完全匹配，區域欄位顯示門市名稱
            form.district = form.storeName
          }
          break
        }
      }

      showMapModal.value = false
      mapLoading.value = false
      window.removeEventListener('message', messageHandler)
    }
  }
  
  window.addEventListener('message', messageHandler)
  
  // 關閉載入狀態
  mapLoading.value = false
}

const closeMapModal = () => {
  showMapModal.value = false
  mapLoading.value = false
  const mapDiv = document.getElementById('map_container')
  if (mapDiv) mapDiv.innerHTML = ''
}

// 自動帶入使用者資料的checkbox --------------------------------------------------------------------------------------------
const autoFillUserInfo = ref(false)

// 自動帶入使用者資料的函數
const fillUserInfo = () => {
    if(authStore.user){
        form.recipientName = authStore.user.name || ''
        form.phoneNumber = authStore.user.phone || ''
    }
}
// 監聽"是否勾選同會員資料填入"的變化
watch(autoFillUserInfo,(newValue)=>{
    if(newValue){
        fillUserInfo()
    }else{
        form.recipientName = ''
        form.phoneNumber = ''
    }
})

// 監聽地址資料變化，用於編輯模式
watch(() => props.address, (newAddress) => {
    if (newAddress) {
        form.recipientName = newAddress.recipientName || ''
        form.phoneNumber = newAddress.phoneNumber || ''
        form.addressType = newAddress.addressType?.toString() || ''
        form.storeType = newAddress.storeType || null
        form.storeName = newAddress.storeName || ''
        form.storeBranch = newAddress.storeBranch || ''
        form.city = newAddress.city || ''
        // 如果是超商地址，區域欄位顯示門市名稱
        if (newAddress.addressType === 1) {
            form.district = newAddress.storeName || ''
        } else {
            form.district = newAddress.district || ''
        }
        form.addressDetail = newAddress.addressDetail || ''
        form.isDefault = newAddress.isDefault || false
    }
}, { immediate: true })

const validateForm = () => {
    let isValid = true
    Object.keys(errors).forEach(key => { errors[key] = '' })
    if (!form.recipientName.trim()) { errors.recipientName = '收件人姓名為必填欄位'; isValid = false }
    else if (form.recipientName.length > 50) { errors.recipientName = '收件人姓名不能超過50個字元'; isValid = false }
    if (!form.phoneNumber.trim()) { errors.phoneNumber = '電話號碼為必填欄位'; isValid = false }
    else if (!/^[0-9+\-\s()]+$/.test(form.phoneNumber)) { errors.phoneNumber = '請輸入有效的電話號碼'; isValid = false }
    if (!form.addressType) { errors.addressType = '請選擇地址類型'; isValid = false }
    if (isStoreAddress.value && !form.storeName.trim()) { errors.storeName = '請先選擇門市'; isValid = false }
    if (!form.city.trim()) { errors.city = '城市為必填欄位'; isValid = false }
    // 只有一般宅配地址才需要驗證區域欄位
    if (isHomeAddress.value && !form.district.trim()) { errors.district = '區域為必填欄位'; isValid = false }
    if (!form.addressDetail.trim()) { errors.addressDetail = '詳細地址為必填欄位'; isValid = false }
    return isValid
}

// 先準備好提交資料
const handleSubmit = () => {
    if (!validateForm()) return

    // 準備提交資料
    const submitData = {
        recipientName: form.recipientName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        addressType: parseInt(form.addressType),
        city: form.city.trim(),
        district: form.district.trim(),
        addressDetail: form.addressDetail.trim(),
        isDefault: form.isDefault
    }
    // 如果是超商地址，加入超商相關欄位
    if (isStoreAddress.value) {
       // 確保 storeType 有值，如果沒有則設為 0 (7-11)
        submitData.storeType = form.storeType !== null ? parseInt(form.storeType) : 0
        submitData.storeName = form.storeName.trim()
        // 如果 storeBranch 為空, 設為空字串
        submitData.storeBranch = form.storeBranch? form.storeBranch.trim() : ''
        // 對於超商地址，將門市名稱也設定到 district 欄位
        submitData.district = form.storeName.trim()
    }
    console.log('提交資料:', submitData) // 測試
    emit('submit', submitData)
}
</script>

<template>
    <div class="address-form-container">
        <form @submit.prevent="handleSubmit" class="address-form">
            <!-- 自動帶入使用者資料 -->
             <div class="form-group">
                <div class="form-check">
                    <input 
                      type="checkbox" 
                      id="autoFillUserInfo" 
                      v-model="autoFillUserInfo" 
                      class="form-check-input" />
                      <label for="autoFillUserInfo" class="form-check-label">
                        <i class="bi bi-person-check me-1"></i>
                        同會員資料填入
                      </label>
                </div>
             </div>

            <!-- 收件人姓名 -->
            <div class="form-group">
                <label for="recipientName" class="form-label">收件人姓名 *</label>
                <input 
                    id="recipientName" 
                    v-model="form.recipientName" 
                    type="text" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.recipientName }" 
                    placeholder="請輸入收件人姓名" 
                    required />
                <div v-if="errors.recipientName" class="invalid-feedback">{{ errors.recipientName }}</div>
            </div>
            <!-- 電話號碼 -->
            <div class="form-group">
                <label for="phoneNumber" class="form-label">電話號碼 *</label>
                <input 
                    id="phoneNumber" 
                    v-model="form.phoneNumber" 
                    type="tel" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.phoneNumber }" 
                    placeholder="請輸入電話號碼" 
                    required />
                <div v-if="errors.phoneNumber" class="invalid-feedback">{{ errors.phoneNumber }}</div>
            </div>
            <!-- 地址類型 -->
            <div class="form-group">
                <label for="addressType" class="form-label">地址類型 *</label>
                <select id="addressType" v-model="form.addressType" class="form-select" :class="{ 'is-invalid': errors.addressType }" required>
                    <option value="">請選擇地址類型</option>
                    <option value="0">一般宅配地址</option>
                    <option value="1">超商取貨地址</option>
                </select>
                <div v-if="errors.addressType" class="invalid-feedback">{{ errors.addressType }}</div>
            </div>
            <!-- 超商相關欄位 -->
            <div v-if="isStoreAddress" class="store-fields">
                <button @click.prevent="openMapModal" class="btn btn-outline-primary">選擇 7-11 門市</button>
                <div v-if="showMapModal" class="modal-backdrop">
                    <div class="modal-content" style="width: 90vw; height: 90vh;">
                        <button class="btn btn-danger" @click="closeMapModal" style="float:right;">關閉</button>
                        <div v-if="mapLoading" class="loading-container">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">載入中...</span>
                            </div>
                            <p class="mt-2">正在載入地圖...</p>
                        </div>
                        <iframe name="cvsmap" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                </div>
                <div v-if="form.storeName" class="form-group">
                    <label class="form-label">已選擇的門市</label>
                    <div class="alert alert-success">
                        <strong>{{ form.storeName }}</strong><br>
                        <small class="text-muted">門市編號：{{ form.storeId }}</small><br>
                        {{ form.addressDetail }}
                    </div>
                </div>
            </div>
            <!-- 城市 -->
            <div class="form-group">
                <label for="city" class="form-label">城市 *</label>
                 <select 
                    v-if="isHomeAddress" 
                    id="city" 
                    v-model="form.city" 
                    class="form-select" 
                    :class="{ 'is-invalid': errors.city }" 
                    required>
                    <option value="">請選擇城市</option>
                    <option v-for="cityName in cityOptions" :key="cityName" :value="cityName">
                        {{ cityName }}
                    </option>
                </select>
                <input 
                    v-else
                    id="city" 
                    v-model="form.city" 
                    type="text" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.city }" 
                    :placeholder="isStoreAddress ? '請先選擇門市' : '請輸入城市'" 
                    :readonly="isStoreAddress"
                    :disabled="isStoreAddress"
                    required 
                />
                <div v-if="errors.city" class="invalid-feedback">{{ errors.city }}</div>
            </div>
            <!-- 區域 -->
            <div class="form-group">
                <label for="district" class="form-label">{{ isStoreAddress ? '分店名稱' : '區域 *' }}</label>
                <select 
                    v-if="isHomeAddress" 
                    id="district" 
                    v-model="form.district" 
                    class="form-select" 
                    :class="{ 'is-invalid': errors.district }" 
                    :disabled="!form.city"
                    required
                >
                    <option value="">{{ form.city ? '請選擇區域' : '請先選擇城市' }}</option>
                    <option v-for="district in districtOptions" :key="district.zip" :value="district.name">
                        {{ district.name }}
                    </option>
                </select>
                <input 
                    v-else
                    id="district" 
                    v-model="form.district" 
                    type="text" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.district }" 
                    :placeholder="isStoreAddress ? form.storeName || '請先選擇門市' : '請輸入區域'" 
                    :readonly="isStoreAddress"
                    :disabled="isStoreAddress"
                    required 
                />
                <div v-if="errors.district" class="invalid-feedback">{{ errors.district }}</div>
            </div>
            <!-- 詳細地址 -->
            <div class="form-group">
                <label for="addressDetail" class="form-label">詳細地址 *</label>
                <textarea 
                    id="addressDetail" 
                    v-model="form.addressDetail" 
                    class="form-control" 
                    :class="{ 'is-invalid': errors.addressDetail }" 
                    :placeholder="isStoreAddress ? '請先選擇門市' : '請輸入詳細地址'" 
                    :readonly="isStoreAddress"
                    :disabled="isStoreAddress"
                    rows="3" 
                    required
                ></textarea>
                <div v-if="errors.addressDetail" class="invalid-feedback">{{ errors.addressDetail }}</div>
            </div>
            <!-- 預設地址 -->
            <div class="form-group">
                <div class="form-check">
                    <input id="isDefault" v-model="form.isDefault" type="checkbox" class="form-check-input" />
                    <label for="isDefault" class="form-check-label">設為預設地址</label>
                </div>
            </div>
            <!-- 按鈕區域 -->
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" @click="$emit('cancel')" :disabled="isSubmitting">取消</button>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                    <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isSubmitting ? '處理中...' : (isEdit ? '更新地址' : '新增地址') }}
                </button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.address-form-container { 
    max-width: 600px; 
    margin: 0 auto; 
}
.address-form { 
    background: white; 
    padding: 2rem; 
    border-radius: 12px; 
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); 
}
.form-group { 
    margin-bottom: 1.5rem; 
}
.form-label { 
    font-weight: 600; 
    color: #686868; 
    margin-bottom: 0.5rem; 
    display: block; 
}
.form-control, .form-select { 
    border: 1px solid #d3a2da; 
    border-radius: 8px; 
    padding: 0.75rem; 
    font-size: 0.9rem; 
    transition: all 0.3s ease; 
}
.form-control:focus, .form-select:focus { 
    border-color: #92559c; 
    box-shadow: 0 0 0 0.2rem rgba(146, 85, 156, 0.25); 
    outline: none; 
}
.form-control.is-invalid, .form-select.is-invalid, .btn.is-invalid { 
    border-color: #dc3545; 
}
.invalid-feedback { display: block; 
    color: #dc3545; 
    font-size: 0.85rem;
     margin-top: 0.25rem;
 }
.store-fields { background: #f8f9fa;
     padding: 1rem;
     border-radius: 8px;
     margin-bottom: 1rem;
     border-left: 4px solid #92559c;
 }
.form-check { margin-top: 1rem;
 }
.form-check-input:checked { background-color: #92559c;
     border-color: #92559c;
 }
.form-actions { display: flex;
     gap: 1rem;
     justify-content: flex-end;
     margin-top: 2rem;
     padding-top: 1rem;
     border-top: 1px solid #eee;
 }
.btn { padding: 0.75rem 1.5rem;
     border-radius: 8px;
     font-weight: 500;
     transition: all 0.3s ease;
 }
.btn-primary { background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
     border: none;
     color: white;
 }
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #d3a2da 0%, #ffa600 100%);
     transform: translateY(-2px);
 }
.btn-outline-primary { border: 2px solid #92559c;
     color: #92559c;
     background: white;
 }
.btn-outline-primary:hover:not(:disabled) { background: #92559c;
     color: white;
 }
.btn-secondary { background: #6c757d;
     border: none;
     color: white;
 }
.btn-secondary:hover:not(:disabled) { background: #5a6268;
 }
.btn:disabled { opacity: 0.6;
     cursor: not-allowed;
 }
.form-text { font-size: 0.85rem;
     color: #6c757d;
     margin-top: 0.25rem;
 }
.alert { border-radius: 8px;
     padding: 1rem; 
 }
.alert-success { background-color: #d4edda;
     border-color: #c3e6cb;
     color: #155724;
 }
.modal-backdrop { position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: rgba(0,0,0,0.5);
     z-index: 9999;
     display: flex;
     align-items: center; 
     justify-content: center;
 }
.modal-content { background: #fff;
     border-radius: 8px;
     padding: 1rem;
     position: relative;
 }
.loading-container {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     height: 100%;
     color: #6c757d;
 }
@media (max-width: 768px) {
    .address-form { padding: 1.5rem;
     }
    .form-actions { flex-direction: column;
     }
    .btn { width: 100%;
     }
}

.address-form-container { 
    max-width: 600px; 
    margin: 0 auto; 
}
.address-form { 
    background: white; 
    padding: 2rem; 
    border-radius: 12px; 
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); 
}
.form-group { 
    margin-bottom: 1.5rem; 
}
.form-label { 
    font-weight: 600; 
    color: #686868; 
    margin-bottom: 0.5rem; 
    display: block; 
}
.form-control, .form-select { 
    border: 1px solid #d3a2da; 
    border-radius: 8px; 
    padding: 0.75rem; 
    font-size: 0.9rem; 
    transition: all 0.3s ease; 
}
.form-control:focus, .form-select:focus { 
    border-color: #92559c; 
    box-shadow: 0 0 0 0.2rem rgba(146, 85, 156, 0.25); 
    outline: none; 
}
.form-control.is-invalid, .form-select.is-invalid, .btn.is-invalid { 
    border-color: #dc3545; 
}
.form-control:disabled, .form-control[readonly] {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
    opacity: 0.8;
}
.form-control:disabled:focus, .form-control[readonly]:focus {
    border-color: #d3a2da;
    box-shadow: none;
}
.invalid-feedback { display: block; 
    color: #dc3545; 
    font-size: 0.85rem;
     margin-top: 0.25rem;
 }
.store-fields { background: #f8f9fa;
     padding: 1rem;
     border-radius: 8px;
     margin-bottom: 1rem;
     border-left: 4px solid #92559c;
 }
.form-check { margin-top: 1rem;
 }
.form-check-input:checked { background-color: #92559c;
     border-color: #92559c;
 }
.form-actions { display: flex;
     gap: 1rem;
     justify-content: flex-end;
     margin-top: 2rem;
     padding-top: 1rem;
     border-top: 1px solid #eee;
 }
.btn { padding: 0.75rem 1.5rem;
     border-radius: 8px;
     font-weight: 500;
     transition: all 0.3s ease;
 }
.btn-primary { background: linear-gradient(135deg, #92559c 0%, #d3a2da 100%);
     border: none;
     color: white;
 }
.btn-primary:hover:not(:disabled) { background: linear-gradient(135deg, #d3a2da 0%, #ffa600 100%);
     transform: translateY(-2px);
 }
.btn-outline-primary { border: 2px solid #92559c;
     color: #92559c;
     background: white;
 }
.btn-outline-primary:hover:not(:disabled) { background: #92559c;
     color: white;
 }
.btn-secondary { background: #6c757d;
     border: none;
     color: white;
 }
.btn-secondary:hover:not(:disabled) { background: #5a6268;
 }
.btn:disabled { opacity: 0.6;
     cursor: not-allowed;
 }
.form-text { font-size: 0.85rem;
     color: #6c757d;
     margin-top: 0.25rem;
 }
.alert { border-radius: 8px;
     padding: 1rem; 
 }
.alert-success { background-color: #d4edda;
     border-color: #c3e6cb;
     color: #155724;
 }
.modal-backdrop { position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: rgba(0,0,0,0.5);
     z-index: 9999;
     display: flex;
     align-items: center; 
     justify-content: center;
 }
.modal-content { background: #fff;
     border-radius: 8px;
     padding: 1rem;
     position: relative;
 }
.loading-container {
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
     height: 100%;
     color: #6c757d;
 }
@media (max-width: 768px) {
    .address-form { padding: 1.5rem;
     }
    .form-actions { flex-direction: column;
     }
    .btn { width: 100%;
     }
}
.form-check {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #28a745;
}

.form-check-input:checked {
    background-color: #28a745;
    border-color: #28a745;
}

.form-check-label {
    font-weight: 500;
    color: #495057;
    cursor: pointer;
}

.form-check-label i {
    color: #28a745;
}

</style>