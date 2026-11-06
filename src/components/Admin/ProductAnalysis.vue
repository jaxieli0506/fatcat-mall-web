<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { Bar, Doughnut, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
// 引入日期篩選元件
import DateRangeFilter from '@/components/admin/DateRangeFilter.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

// --- 為產品分析定義一個紫色系調色盤 ---
const purplePalette = [
  '#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0',
  '#AB47BC', '#BA68C8', '#CE93D8', '#E1BEE7'
];

const loading = ref(true);
const chartData = ref(null);

// 負責接收日期並呼叫 API 的函式
const fetchData = async (startDate, endDate) => {
  loading.value = true;
  try {
    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    const response = await axios.get('/api/analysis/product', { params });
    chartData.value = response.data;
  } catch (error) {
    console.error("無法獲取產品分析數據:", error);
    chartData.value = null;
  } finally {
    loading.value = false;
  }
};

// 處理由 DateRangeFilter 元件發出的事件
const handleDateUpdate = ({ startDate, endDate }) => {
  fetchData(startDate, endDate);
};

// --- Computed Properties for Charts ---
const categorySalesData = computed(() => ({
  labels: chartData.value?.categorySales.map(c => c.name) || [],
  datasets: [{
    data: chartData.value?.categorySales.map(c => c.totalQuantity) || [],
    backgroundColor: purplePalette,
    borderColor: '#ffffff',
    borderWidth: 2,
  }]
}));

const tagSalesData = computed(() => ({
  labels: chartData.value?.tagSales.map(t => t.name) || [],
  datasets: [{
    data: chartData.value?.tagSales.map(t => t.totalQuantity) || [],
    backgroundColor: purplePalette.slice().reverse(),
    borderColor: '#ffffff',
    borderWidth: 2,
  }]
}));

const sortSalesData = computed(() => ({
  labels: chartData.value?.sortSales.map(s => s.name) || [],
  datasets: [{
    data: chartData.value?.sortSales.map(s => s.totalQuantity) || [],
    backgroundColor: purplePalette.slice(2, 10), // 錯開顏色
    borderColor: '#ffffff',
    borderWidth: 2,
  }]
}));

const productSalesData = computed(() => ({
  labels: chartData.value?.productSales.map(p => p.name).reverse() || [],
  datasets: [{
    label: '銷售數量',
    data: chartData.value?.productSales.map(p => p.totalQuantity).reverse() || [],
    backgroundColor: 'rgba(126, 87, 194, 0.7)',
    borderColor: '#5E35B1',
    borderWidth: 1,
    borderRadius: 5
  }]
}));

// --- Chart Options ---
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { size: 14 } } } }
};
const doughnutChartOptions = { ...commonOptions, plugins: { legend: { position: 'right', ...commonOptions.plugins.legend } } };
const pieChartOptions = { ...commonOptions, plugins: { legend: { position: 'right', ...commonOptions.plugins.legend } } };
const horizontalBarChartOptions = {
    ...commonOptions,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
};

</script>

<template>
  <div>
    <DateRangeFilter @date-updated="handleDateUpdate" />

    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-if="!loading && chartData" class="all-charts-container">
      <div class="row">
        <div class="col-lg-4 col-md-6">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-star me-1"></i>類別銷售排行</div>
            <div class="card-body" style="height: 350px;">
              <Doughnut v-if="chartData?.categorySales?.length > 0" :data="categorySalesData" :options="doughnutChartOptions" />
              <div v-else class="no-data-message">此區間無銷售數據</div>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-md-6">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-tags me-1"></i>標籤銷售排行</div>
            <div class="card-body" style="height: 350px;">
              <Pie v-if="chartData?.tagSales?.length > 0" :data="tagSalesData" :options="pieChartOptions" />
              <div v-else class="no-data-message">此區間無銷售數據</div>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-md-12">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-sort-amount-down me-1"></i>商品分類銷售排行</div>
            <div class="card-body" style="height: 350px;">
              <Pie v-if="chartData?.sortSales?.length > 0" :data="sortSalesData" :options="pieChartOptions" />
              <div v-else class="no-data-message">此區間無銷售數據</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card mb-4">
        <div class="card-header"><i class="fas fa-trophy me-1"></i>產品銷售排行 (Top 10)</div>
        <div class="card-body" style="height: 400px;">
          <Bar v-if="chartData?.productSales?.length > 0" :data="productSalesData" :options="horizontalBarChartOptions" />
          <div v-else class="no-data-message">此區間無銷售數據</div>
        </div>
      </div>
    </div>
    
    <div v-if="!loading && !chartData" class="text-center p-5">
        <h4>無法載入數據</h4>
        <p class="text-muted">請稍後再試或檢查您的網路連線。</p>
    </div>
  </div>
</template>

<style scoped>
.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  font-size: 1.2rem;
}
</style>