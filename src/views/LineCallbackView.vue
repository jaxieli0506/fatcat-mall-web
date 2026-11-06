<template>
  <div class="line-callback-container">
    <div class="text-center">
      <div v-if="isProcessing" class="processing">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">處理中...</span>
        </div>
        <p class="mt-3">正在處理 LINE 登入...</p>
        <small class="text-muted">{{ debugMessage }}</small>
      </div>
      
      <div v-else-if="error" class="error">
        <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;"></i>
        <h4 class="text-danger mt-3">登入失敗</h4>
        <p>{{ error }}</p>
        <div class="mt-3 text-start" style="max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 5px;">
          <small class="text-muted">偵錯資訊：</small>
          <pre style="font-size: 12px; margin: 0;">{{ debugInfo }}</pre>
        </div>
        <button class="btn btn-primary mt-3" @click="closeWindow">關閉視窗</button>
      </div>
      
      <div v-else class="success">
        <i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i>
        <h4 class="text-success mt-3">登入成功</h4>
        <p>正在關閉視窗...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { exLoginService } from '../services/exLoginService'

const isProcessing = ref(true)
const error = ref(null)
const debugMessage = ref('初始化中...')
const debugInfo = ref('')

onMounted(async () => {
  console.log('🔍 LINE Callback 頁面載入')
  
  try {
    debugMessage.value = '解析 URL 參數...'
    
    // 從 URL 取得參數
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const errorParam = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')

    console.log('🔍 URL 參數:', {
      code: code ? `${code.substring(0, 10)}...` : null,
      state: state ? `${state.substring(0, 10)}...` : null,
      error: errorParam,
      errorDescription
    })

    debugInfo.value = `URL 參數:\ncode: ${code ? 'present' : 'missing'}\nstate: ${state ? 'present' : 'missing'}\nerror: ${errorParam || 'none'}`

    // 檢查是否有錯誤
    if (errorParam) {
      console.error('❌ LINE 授權錯誤:', errorParam, errorDescription)
      throw new Error(errorDescription || 'LINE 登入失敗')
    }

    // 檢查必要參數
    if (!code || !state) {
      console.error('❌ 缺少必要參數:', { code: !!code, state: !!state })
      throw new Error('缺少必要的授權參數')
    }

    debugMessage.value = '驗證狀態參數...'
    
    // 驗證 state 參數
    const savedState = sessionStorage.getItem('lineLoginState')
    console.log('🔍 State 驗證:', {
      received: state.substring(0, 10) + '...',
      saved: savedState ? savedState.substring(0, 10) + '...' : null,
      match: state === savedState
    })

    if (state !== savedState) {
      console.error('❌ State 參數不匹配')
      throw new Error('安全驗證失敗：狀態參數不匹配')
    }

    debugMessage.value = '交換 access token...'

    // 交換授權碼為 access token
    console.log('🔄 開始交換 token...')
    const tokenData = await exLoginService.exchangeLineCodeForToken(code, state)
    
    console.log('✅ Token 交換成功:', {
      hasAccessToken: !!tokenData.accessToken,
      userID: tokenData.userID,
      name: tokenData.name
    })

    debugMessage.value = '發送成功訊息給父視窗...'
    
    // 向父視窗發送成功訊息
    if (window.opener) {
      console.log('📤 發送成功訊息給父視窗')
      window.opener.postMessage({
        type: 'LINE_LOGIN_SUCCESS',
        accessToken: tokenData.accessToken,
        userID: tokenData.userID,
        email: tokenData.email || '',
        name: tokenData.name || ''
      }, window.location.origin)
    } else {
      console.warn('⚠️ 無法找到父視窗')
    }

    isProcessing.value = false
    
    // 延遲關閉視窗
    console.log('⏱️ 準備關閉視窗...')
    setTimeout(() => {
      window.close()
    }, 1500)

  } catch (err) {
    console.error('❌ LINE 登入回調處理錯誤:', err)
    
    error.value = err.message || 'LINE 登入處理時發生錯誤'
    isProcessing.value = false

    // 添加錯誤詳細資訊到偵錯資訊中
    debugInfo.value += `\n\n錯誤詳情:\n${err.stack || err.message}`

    // 向父視窗發送錯誤訊息
    if (window.opener) {
      console.log('📤 發送錯誤訊息給父視窗')
      window.opener.postMessage({
        type: 'LINE_LOGIN_ERROR',
        message: error.value
      }, window.location.origin)
    }
  }
})

const closeWindow = () => {
  if (window.opener) {
    window.opener.postMessage({
      type: 'LINE_LOGIN_ERROR',
      message: error.value
    }, window.location.origin)
  }
  window.close()
}
</script>

<style scoped>
.line-callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 20px;
}

.processing,
.error,
.success {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 