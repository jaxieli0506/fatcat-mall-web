import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useStreamStore = defineStore('stream', () => {
  // --- State ---
  const isLive = ref(false);
  const streamInfo = ref(null);
  const currentStreamTitle = ref('');

  // --- Actions ---

  /**
   * @description 檢查當前是否有直播，更新 isLive 和標題
   */
  const checkCurrentStream = async () => {
    try {
      const response = await axios.get('/api/streaming/current');
      if (response.data) {
        isLive.value = true;
        currentStreamTitle.value = response.data.title;
        // 將公開資訊也存入 streamInfo，這樣 ChatRoom 才能拿到 ARN
        streamInfo.value = { ...(streamInfo.value || {}), ...response.data };
      } else {
        isLive.value = false;
        currentStreamTitle.value = '';
        streamInfo.value = null;
      }
    } catch (error) {
      console.error('檢查直播狀態失敗:', error);
      isLive.value = false;
    }
  };

  /**
   * @description 開始直播，負責拿 OBS 金鑰並更新狀態
   * @param {string} title - 直播標題
   */
  const startStream = async (title) => {
    // 1. 呼叫 start API，拿到 OBS 金鑰
    const response = await axios.post('/api/streaming/start', { title });
    
    // 2. 將金鑰和標題存起來
    streamInfo.value = {
      ...response.data, // ingestEndpoint 和 streamKey
      title: title
    };
    
    // 3. 更新直播狀態
    isLive.value = true;
    currentStreamTitle.value = title;
    
    // 4. 立刻再呼叫一次 checkCurrentStream，把 chatRoomArn 等公開資訊也合併進來
    await checkCurrentStream();
  };

  /**
   * @description 結束直播，清理所有狀態
   */
  const endStream = async () => {
    await axios.post('/api/streaming/end');
    isLive.value = false;
    streamInfo.value = null;
    currentStreamTitle.value = '';
  };
  
  /**
   * @description 
   */
  const initialize = () => {
      // 應用程式啟動時，自動檢查一次直播狀態
      checkCurrentStream();
  }; 

  // 【★ 核心修正 ★】
  // 將 initialize 函式加回到 return 物件中
  return {
    isLive,
    streamInfo,
    currentStreamTitle,
    checkCurrentStream,
    startStream,
    endStream,
    initialize, 
  };
});