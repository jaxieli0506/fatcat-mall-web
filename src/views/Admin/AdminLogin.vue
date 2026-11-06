<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminAuthStore } from '@/stores/adminauth';

const credentials = reactive({
  email: '',
  password: ''
});
const isLoading = ref(false);
const error = ref(null);
const router = useRouter();
const adminAuthStore = useAdminAuthStore();

const handleLogin = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const result = await adminAuthStore.login(credentials);

    if (result.success) {
      router.push('/admin/dashboard');
    } else {
      error.value = result.message;
    }
  } catch (err) {
    error.value = '登入失敗，請檢查您的帳號密碼。';
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="text-center mb-4">肥貓管理者後台</h2>
      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="email" class="form-label">Email</label>
          <input 
            type="email" 
            class="form-control" 
            id="email" 
            v-model="credentials.email" 
            required
            :disabled="isLoading"
          >
        </div>
        <div class="mb-3">
          <label for="password" class="form-label">密碼</label>
          <input 
            type="password" 
            class="form-control" 
            id="password" 
            v-model="credentials.password" 
            required
            :disabled="isLoading"
          >
        </div>
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <button 
          type="submit" 
          class="btn btn-primary w-100" 
          :disabled="isLoading"
        >
          {{ isLoading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-label {
  font-weight: 500;
  color: #333;
}

.form-control {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
}

.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #6c757d;
  border-color: #6c757d;
}

.alert-danger {
  background-color: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>