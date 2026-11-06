<script setup>
import { ref } from 'vue';
import MemberAnalysis from '@/components/admin/MemberAnalysis.vue';
import SalesAnalysis from '@/components/admin/SalesAnalysis.vue';
import ProductAnalysis from '@/components/admin/ProductAnalysis.vue'; 

const activeTab = ref('product'); // 預設顯示銷售報表
</script>

<template>
  <div class="analysis-container">
    <h1 class="mt-2 page-title">分析報表</h1>
    <ol class="breadcrumb"><h4 class="breadcrumb-item active">分析您的商業數據與顧客行為</h4></ol>

    <ul class="nav nav-pills mb-4">
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'product' }" 
          @click.prevent="activeTab = 'product'" 
          href="#">
          <i class="fas fa-tag me-1"></i> 產品分析
        </a>
      </li>
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'sales' }" 
          @click.prevent="activeTab = 'sales'" 
          href="#">
          <i class="fas fa-chart-line me-1"></i> 銷售報表
        </a>
      </li>
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'member' }" 
          @click.prevent="activeTab = 'member'" 
          href="#">
          <i class="fas fa-users me-1"></i> 會員分析
        </a>
      </li>      
    </ul>

    <div class="tab-content">
      <div v-if="activeTab === 'sales'">
        <SalesAnalysis />
      </div>

      <div v-if="activeTab === 'member'">
        <MemberAnalysis />
      </div>

      <div v-if="activeTab === 'product'">
        <ProductAnalysis />
      </div>
    </div>
  </div>
</template>



<style scoped>
.analysis-container {
  padding: 1rem;
}

/* 讓整個導覽列的連結有手型游標 */
.nav-link {
  cursor: pointer;
}
/* 按鈕基本樣式 */
.nav-pills .nav-link {
  color: #4a5568; /* 文字顏色使用較深的灰色 */
  background-color: #f7fafc; /* 背景色為非常淺的灰色 */
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem; /* 圓角稍大一些 */
  margin: 0 5px; /* 增加按鈕間的間距 */
  font-weight: 600; /* 字體半粗體 */
  transition: all 0.2s ease-in-out; /* 讓所有變化都有流暢的過渡動畫 */
}

/* 滑鼠懸停在「非啟用」按鈕上的效果 */
.nav-pills .nav-link:not(.active):hover {
  transform: translateY(-2px); /* 向上微移，產生立體感 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 加上陰影 */
  background-color: #ffffff;
}

/* 「啟用」狀態的按鈕樣式 */
.nav-pills .nav-link.active {
  background-color: #2d3748; /* 背景改為非常深的炭灰色 */
  color: white; /* 文字變為白色 */
  box-shadow: 0 6px 15px rgba(45, 55, 72, 0.3);
  transform: translateY(-2px);
}
</style>