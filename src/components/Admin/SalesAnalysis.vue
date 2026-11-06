<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { Bar, Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import DateRangeFilter from '@/components/admin/DateRangeFilter.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const pinkPalette = { //顏色
  dark: '#C71585',
  medium: 'rgba(219, 112, 147, 1)',
  medium_bg: 'rgba(219, 112, 147, 0.7)',
  light_bg: 'rgba(255, 182, 193, 0.6)',
  line_fill: 'rgba(219, 112, 147, 0.25)',
};

const loading = ref(true);
const chartData = ref(null);

const fetchData = async (startDate, endDate) => {
  loading.value = true;
  try {
    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    const response = await axios.get('/api/analysis/sales', { params });
    chartData.value = response.data;
  } catch (error) {
    console.error("無法獲取銷售分析數據:", error);
    chartData.value = null;
  } finally {
    loading.value = false;
  }
};

const handleDateUpdate = ({ startDate, endDate }) => {
  fetchData(startDate, endDate);
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '$0';
  return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(value);
};

// --- Computed Properties for Charts ---
const smartChartTitle = computed(() => {
    if (!chartData.value) return "銷售趨勢";
    if (chartData.value.salesTrendInterval === 'Hourly') return '當日每小時銷售趨勢';
    if (chartData.value.salesTrendInterval === 'Daily') return '區間每日銷售趨勢';
    if (chartData.value.salesTrendInterval === 'Monthly') return '本年度每月銷售趨勢';
    return "銷售趨勢";
});

const salesTrendData = computed(() => ({
  labels: chartData.value?.salesTrend.map(d => d.label) || [],
  datasets: [{
    label: '銷售額',
    data: chartData.value?.salesTrend.map(d => d.value) || [],
    backgroundColor: pinkPalette.line_fill,
    borderColor: pinkPalette.dark,
    borderWidth: 2,
    fill: true,
    tension: 0.4,
  }]
}));

const orderCountData = computed(() => ({
  labels: chartData.value?.orderCountTrend.map(d => d.label) || [],
  datasets: [{
    label: '訂單量',
    data: chartData.value?.orderCountTrend.map(d => d.value) || [],
    backgroundColor: pinkPalette.light_bg,
    borderColor: pinkPalette.medium,
    borderWidth: 1,
    borderRadius: 5
  }]
}));

// --- Chart Options ---
const commonYAxisOptions = { y: { ticks: { callback: value => formatCurrency(value) }, beginAtZero: true } };
const lineChartOptions = { responsive: true, maintainAspectRatio: false, scales: commonYAxisOptions };
const barChartOptions = { responsive: true, maintainAspectRatio: false, scales: commonYAxisOptions, plugins: { legend: { display: false } } };
</script>

<template>
  <div>
    <DateRangeFilter @date-updated="handleDateUpdate" />

    <div v-if="loading" class="text-center p-5">
      <div class="spinner-border text-danger" role="status"></div>
    </div>

    <div v-if="!loading && chartData" class="all-charts-container">
      
      <div class="row">
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-calendar-alt me-1"></i> 本月目前銷售總額 (固定)</div>
            <div class="card-body text-center py-4">
              <h2 class="display-6 display-lg-5 fw-semibold kpi-number">{{ formatCurrency(chartData.thisMonthTotalRevenue) }}</h2>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-search-dollar me-1"></i> 區間銷售總額 (動態)</div>
            <div class="card-body text-center py-4">
              <h2 class="display-6 display-lg-5 fw-semibold kpi-number">{{ formatCurrency(chartData.selectedRangeTotalRevenue) }}</h2>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span><i class="fas fa-chart-line me-1"></i> {{ smartChartTitle }}</span>
              <button class="btn btn-sm btn-outline-secondary disabled"><i class="fas fa-download me-1"></i> 匯出CSV</button>
            </div>
            <div class="card-body" style="height: 320px;">
                <Line v-if="chartData.salesTrend.length > 0" :data="salesTrendData" :options="lineChartOptions" />
                <div v-else class="no-data-message">此區間無銷售數據</div>
            </div>
          </div>
        </div>
      </div>

       <div class="row">
        <div class="col-12">
            <div class="card mb-4">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span><i class="fas fa-file-invoice me-1"></i> {{ smartChartTitle.replace('銷售趨勢', '訂單量').replace('銷售額', '訂單量') }}</span>
                     <button class="btn btn-sm btn-outline-secondary disabled"><i class="fas fa-download me-1"></i> 匯出CSV</button>
                </div>
                <div class="card-body" style="height: 320px;">
                    <Bar v-if="chartData?.orderCountTrend?.length > 0" :data="orderCountData" :options="barChartOptions" />
                    <div v-else class="no-data-message">此區間無訂單數據</div>
                </div>
            </div>
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
.no-data-message { display: flex; justify-content: center; align-items: center; height: 100%; color: #888; font-size: 1.2rem; }
.kpi-number { color: #C71585; }
/* 讓匯出按鈕暫時無法點擊 */
.btn.disabled { pointer-events: none; opacity: 0.65; }
</style>