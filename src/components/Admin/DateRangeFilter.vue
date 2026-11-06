<script setup>
import { ref, onMounted } from 'vue'; // 引入 onMounted
import DatePicker from 'vue-datepicker-next';
import 'vue-datepicker-next/index.css';
import 'vue-datepicker-next/locale/zh-tw';//繁體中文


// 定義此元件會發出的事件
const emit = defineEmits(['date-updated']);

// 內部狀態，用於綁定 date-picker 的值
const dateRange = ref();

// 點擊快速按鈕時觸發
const selectPeriod = (period) => {
  const end = new Date();
  let start = new Date();

  if (period === 'today') {
    // start is already today
  } else if (period === 'this_month') {
    start.setDate(1);
  } else if (period === 'this_year') {
    start = new Date(end.getFullYear(), 0, 1);
  }

  // 更新 date-picker 的顯示值
  dateRange.value = [start, end];
  // 直接觸發更新
  confirmDateRange();
};

// 點擊「確認」按鈕或快速按鈕時觸發
const confirmDateRange = () => {
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    // 發出 date-updated 事件，並將選定的日期作為參數傳遞出去
    emit('date-updated', {
      startDate: dateRange.value[0],
      endDate: dateRange.value[1],
    });
  }
};

onMounted(() => {
  // 當元件被掛載到畫面上時，自動選擇「本年」
  selectPeriod('this_year');
});


</script>

<template>
  <div class="filter-controls">
    <div class="btn-group" role="group">
      <button type="button" class="btn btn-outline-secondary" @click="selectPeriod('today')">本日</button>
      <button type="button" class="btn btn-outline-secondary" @click="selectPeriod('this_month')">本月</button>
      <button type="button" class="btn btn-outline-secondary" @click="selectPeriod('this_year')">本年</button>
    </div>

    <div class="date-picker-group">
      <date-picker
        v-model:value="dateRange"
        type="date"
        range
        placeholder="選擇日期範圍"
        format="YYYY-MM-DD"
      ></date-picker>
      <button type="button" class="btn btn-primary ms-2" @click="confirmDateRange">確認</button>
    </div>
  </div>
</template>



<style scoped>
.filter-controls {
  display: flex;
  justify-content: space-between; /* 讓左右兩邊的元素分開 */
  align-items: center;
  width: 100%;
  margin-bottom: 1.5rem;
}

.date-picker-group {
  display: flex;
  align-items: center;
}
</style>