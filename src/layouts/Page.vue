<script lang="ts" setup>
import PageNavbar from '../components/Page/Navbar.vue'
import TopNavbar from '../components/Page/TopNavbar.vue'
</script>

<template>
  <div class="page-layout">
    <header class="page-layout__nav">
      <div class="w-[200px]"><img src="../assets/images/logo.png" alt="DataSharp" /></div>
      <div class="flex justify-between w-full">
        <PageNavbar />
        <TopNavbar />
      </div>
    </header>
    <div class="page-layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eff6ff;
}

.page-layout__nav {
  display: flex;
  min-height: 6vh;
  border-bottom: 1px solid #f97316;
  background: #111827;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 40;
}

.page-layout__content {
  flex: 1;
  min-height: 0;
  color: #435368;
}
</style>
