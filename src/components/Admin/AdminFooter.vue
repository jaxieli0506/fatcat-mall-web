<script setup>

</script>


<template>
  <footer class="admin-footer">
    <span>版權所有 © 2025 肥貓客製化泡麵</span>
    <div class="links">
      <a href="#">客服專線：02-1234-5678</a>
      <span>|</span>
      <a href="#">Email：support@yourwebsite.com</a>
      <span>|</span>
      <span>服務時間：週一至週五 09:00-18:00</span>
    </div>
  </footer>
</template>

<style scoped>
.admin-footer {
  height: 50px;
  background-color: #e7e2e7;
  border-top: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  font-size: 0.85rem;
  color: #6c757d;
  flex-shrink: 0;
}
.links { display: flex; gap: 0.5rem; }
.links a { color: #6c757d; text-decoration: none; }
.links a:hover { text-decoration: underline; }
</style>