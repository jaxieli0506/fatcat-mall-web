<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { Bar, Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';
import DateRangeFilter from '@/components/admin/DateRangeFilter.vue';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

// --- 1. 定義一個漂亮的藍色系調色盤 (完整版) ---
const bluePalette = {
  darkest: '#0d47a1',    // 最深藍
  dark: '#1976d2',       // 深藍
  medium: '#2196f3',     // 主藍色 (Material Design Blue)
  light: '#64b5f6',      // 淺藍
  lightest: '#bbdefb',   // 最淺藍
  medium_bg: 'rgba(33, 150, 243, 0.6)',
  dark_hover: 'rgba(25, 118, 210, 0.9)'
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
    const response = await axios.get('/api/analysis/member', { params });
    chartData.value = response.data;
  } catch (error) {
    console.error("無法獲取會員分析數據:", error);
    chartData.value = null; 
  } finally {
    loading.value = false;
  }
};

const handleDateUpdate = ({ startDate, endDate }) => {
  fetchData(startDate, endDate);
};

// --- Computed Properties (完整版) ---
const loyaltyDistributionData = computed(() => ({
  labels: chartData.value?.loyaltyDistribution.labels || [],
  datasets: [{
    data: chartData.value?.loyaltyDistribution.values || [],
    backgroundColor: [bluePalette.darkest, bluePalette.dark, bluePalette.medium, bluePalette.light],
    borderColor: '#ffffff',
    borderWidth: 2,
  }]
}));

const topSpendersData = computed(() => ({
    labels: chartData.value?.topSpenders.map(u => u.userName).reverse() || [],
    datasets: [{
        label: '實收金額 (NT$)',
        data: chartData.value?.topSpenders.map(u => u.totalAmount).reverse() || [],
        backgroundColor: bluePalette.dark,
        borderColor: bluePalette.darkest,
        borderWidth: 1,
        hoverBackgroundColor: bluePalette.darkest
    }]
}));

const genderDistributionData = computed(() => ({
    labels: chartData.value?.genderDistribution.map(g => g.key) || [],
    datasets: [{
        data: chartData.value?.genderDistribution.map(g => g.count) || [],
        backgroundColor: [
            bluePalette.medium,
            '#e91e63',      
            '#9e9e9e'       
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
    }]
}));

const ageDistributionData = computed(() => ({
    labels: chartData.value?.ageDistribution.map(a => a.key) || [],
    datasets: [{
        label: '會員人數',
        data: chartData.value?.ageDistribution.map(a => a.count) || [],
        backgroundColor: bluePalette.light,
        borderColor: bluePalette.medium,
        borderWidth: 1,
        borderRadius: 5,
    }]
}));

// --- Chart Options (完整版) ---
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: { font: { size: 14 } }
        }
    }
};
const barChartOptions = { 
    ...commonOptions,
    scales: { x: { ticks: { color: '#333' } }, y: { beginAtZero: true, ticks: { color: '#333' } } }
};
const doughnutChartOptions = { 
    ...commonOptions,
    plugins: { legend: { position: 'right', ...commonOptions.plugins.legend } }
};
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
        <div class="col-lg-3 col-md-6">
            <div class="card mb-4">
                <div class="card-header"><i class="fas fa-user-plus me-1"></i> 區間新註冊會員數</div>
                <div class="card-body d-flex justify-content-center align-items-center" style="min-height: 180px;">
                    <div class="text-center">
                        <h2 class="display-6 display-lg-5 fw-semibold kpi-number">
                           {{ chartData.newMemberCount }}
                        </h2>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-3 col-md-6">
            <div class="card mb-4">
                <div class="card-header"><i class="fas fa-venus-mars me-1"></i> 區間活躍會員性別</div>
                <div class="card-body d-flex justify-content-center align-items-center" style="min-height: 180px;">
                    <Doughnut v-if="chartData?.genderDistribution?.length > 0 && chartData.genderDistribution.some(g => g.count > 0)" :data="genderDistributionData" :options="doughnutChartOptions" />
                    <div v-else class="no-data-message">無活躍會員</div>
                </div>
            </div>
        </div>

        <div class="col-lg-6">
          <div class="card mb-4">
            <div class="card-header"><i class="fas fa-shopping-basket me-1"></i> 區間會員忠誠度</div>
            <div class="card-body d-flex justify-content-center align-items-center" style="min-height: 180px;">
              <Doughnut v-if="chartData?.loyaltyDistribution?.values?.length > 0 && chartData.loyaltyDistribution.values.some(v => v > 0)" :data="loyaltyDistributionData" :options="doughnutChartOptions" />
              <div v-else class="no-data-message">此區間無訂單數據</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
         <div class="col-lg-12">
            <div class="card mb-4">
                <div class="card-header"><i class="fas fa-birthday-cake me-1"></i> 區間活躍會員年齡分布</div>
                <div class="card-body" style="height: 250px;">
                    <Bar v-if="chartData?.ageDistribution?.length > 0 && chartData.ageDistribution.some(a => a.count > 0)" :data="ageDistributionData" :options="barChartOptions" />
                    <div v-else class="no-data-message">此區間無活躍會員</div>
                </div>
            </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><i class="fas fa-crown me-1"></i> 區間高消費會員排行榜 (Top 10)</div>
        <div class="card-body" style="height: 400px;">
          <Bar v-if="chartData?.topSpenders?.length > 0" :data="topSpendersData" :options="horizontalBarChartOptions" />
          <div v-else class="no-data-message">此區間無消費紀錄</div>
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
.kpi-number {
  color: #1976d2; /* 主題藍色 */
}
</style>
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