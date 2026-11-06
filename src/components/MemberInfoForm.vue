<template>
  <ul class="list-group">
    <li class="list-group-item">
      <h3>個人資料</h3>
    </li>
    <li class="list-group-item">姓名:
      <div>
        <input type="text" class="form-control" v-model="name" readonly  />
      </div>
    </li>
    <li class="list-group-item">電話:
      <div>
        <input type="text" class="form-control" v-model="phone" readonly  />
      </div>
    </li>
    <li class="list-group-item">Email:
      <div>
        <input type="email" class="form-control" v-model="email" readonly />
      </div>  
    </li>
  </ul>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useCheckoutStore } from '@/stores/checkout'

const checkout = useCheckoutStore()
import { onMounted} from 'vue'
import { useAuthStore } from '@/stores/auth' //代入個人資訊

const authStore = useAuthStore()  //初始化
const name = ref('')
const phone = ref('')
const email = ref('')

// 即時同步到 store
watch(name, val => checkout.name = val)
watch(phone, val => checkout.phone = val)
watch(email, val => checkout.email = val)

// 組件掛載時初始化用戶資料
onMounted(() =>{
  if(authStore.user){
    name.value = authStore.user.name || ''
    phone.value = authStore.user.phone || ''
    email.value = authStore.user.email || ''
  }
})


</script>
 
