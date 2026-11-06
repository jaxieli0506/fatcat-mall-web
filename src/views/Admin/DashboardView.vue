<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { Bar, Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale,Filler } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale,Filler);

const loading = ref(true);
const dashboardData = ref(null);

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/dashboard/data');
    dashboardData.value = response.data;
  } catch (error) {
    console.error("無法獲取儀表板數據:", error);
  } finally {
    loading.value = false;
  }
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0';
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(value);
};

// --- 圖表顏色更新 ---
const yearRevenueData = computed(() => ({
  labels: dashboardData.value?.yearRevenueTrend.map(d => d.label) || [],
  datasets: [{
    label: '營業額',
    data: dashboardData.value?.yearRevenueTrend.map(d => d.value) || [],
    backgroundColor: 'rgba(199, 158, 255, 0.25)', 
    borderColor: '#C79EFF',
    fill: 'start',
    tension: 0.4,
  }]
}));

const topSpendersData = computed(() => ({
  labels: dashboardData.value?.topSpenders.map(s => s.userName).reverse() || [],
  datasets: [{
    label: '消費總額',
    data: dashboardData.value?.topSpenders.map(s => s.totalAmount).reverse() || [],
    backgroundColor: 'rgba(255, 182, 193, 0.7)', // 可愛粉
    borderColor: '#FFB6C1',
    borderWidth: 1,
    borderRadius: 5,
  }]
}));

// --- Chart Options (維持不變) ---
const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: { y: { ticks: { callback: value => formatCurrency(value) }, beginAtZero: true } }
};
const barChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { ticks: { callback: value => formatCurrency(value) }, beginAtZero: true } }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="container-fluid px-4 py-3">
    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    
    <div v-if="!loading && dashboardData">
      
      <div class="dashboard-header">
        <div class="logo-container">
            <img src="@/assets/images/FatCatCat.png" class="logo-cat">
            <img src="@/assets/images/FatCatLogo.png" class="logo-text">
        </div>
        <ol class="breadcrumb mb-0">
          <h4 class="breadcrumb-item active">本月目前銷售總額：{{ formatCurrency(dashboardData.currentMonthSalesTotal) }}</h4>
        </ol>
      </div>

      <div class="row">
        <div class="col-xl-3 col-md-6">
          <div class="card card-purple text-white mb-4">
            <div class="card-body">
              <div>今日銷售總額</div>
              <div class="fs-4 fw-bold">{{ formatCurrency(dashboardData.todaySalesTotal) }}</div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="card card-pink text-white mb-4">
            <div class="card-body">
              <div>今日訂單總量</div>
              <div class="fs-4 fw-bold">{{ dashboardData.todayOrderCount }} 筆</div>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="card card-yellow text-dark mb-4">
            <div class="card-body">
              <div>本月最熱銷商品</div>
              <div class="fs-5 fw-bold">{{ dashboardData.monthlyBestSellingProduct.name }}</div>
              <small v-if="dashboardData.monthlyBestSellingProduct.name !== '無資料'">銷量：{{ dashboardData.monthlyBestSellingProduct.quantity }} 件</small>
            </div>
          </div>
        </div>
        <div class="col-xl-3 col-md-6">
          <div class="card card-purple-alt text-white mb-4">
            <div class="card-body"  style="color:#666666;">
              <div>本月最熱銷類別</div>
              <div class="fs-5 fw-bold">{{ dashboardData.monthlyBestSellingCategory.name }}</div>
              <small v-if="dashboardData.monthlyBestSellingCategory.name !== '無資料'">銷量：{{ dashboardData.monthlyBestSellingCategory.quantity }} 件</small>
            </div>
          </div>
        </div>
      </div>

      <div class="row" >
        <div class="col-lg-8 mt-2">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-chart-line me-1"></i> 今年營業額趨勢圖</div>
            <div class="card-body" style="height: 350px;">
              <Line :data="yearRevenueData" :options="lineChartOptions" />
            </div>
          </div>
        </div>
        <div class="col-lg-4 mt-2">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-crown me-1"></i> 今年高消費會員 (Top 5)</div>
            <div class="card-body" style="height: 350px;">
              <Bar :data="topSpendersData" :options="barChartOptions" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 頂部 Header 排版 */
.dashboard-header {
    display: flex;
    flex-direction: column; /* 改成垂直排列 */
    align-items: flex-start; /* 讓內容靠左對齊 */
    gap: 1rem; /* 在圖片和標題之間增加一點間距 */
    margin-bottom: 1.5rem;
}
.logo-container {
    display: flex;
    align-items: center;
    gap: 10px; /* 圖片間距 */
}
.logo-cat { height: 60px; }
.logo-text { height: 45px; }

/* KPI 卡片顏色 */
.card-purple { background-color: #B692F0; } 
.card-pink { background-color: #FF8FAB; } 
.card-yellow { background-color: #F9E07F; }
.card-purple-alt { background-color: #D6BBFB; } 

/* 文字 */
.card-yellow.text-dark .card-body  { color: #5B4500 !important; }
.card-body .fs-4, .card-body .fs-5 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.breadcrumb-item.active {
    font-weight: bold;
    color: #6941C6; /* 深紫色標題 */
}
</style>