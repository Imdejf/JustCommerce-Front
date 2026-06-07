<script lang="ts" setup>
import PageNavbar from '../components/Page/Navbar.vue'
import TopNavbar from '../components/Page/TopNavbar.vue'
</script>

<template>
  <div class="page-layout">
    <header class="page-layout__nav">
      <div class="page-layout__logo">
        <img src="../assets/images/logo.png" alt="DataSharp" />
        <span class="page-layout__logo-glow" aria-hidden="true" />
      </div>
      <div class="page-layout__bar">
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
  align-items: center;
  gap: 8px;
  min-height: 58px;
  padding: 0 12px 0 16px;
  background: linear-gradient(180deg, #0c1222 0%, #111827 55%, #0f172a 100%);
  border-bottom: 1px solid rgba(249, 115, 22, 0.35);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 60px rgba(99, 102, 241, 0.08);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 40;
  overflow: visible;
}

.page-layout__nav::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(249, 115, 22, 0.2) 15%,
    rgba(249, 115, 22, 0.9) 50%,
    rgba(129, 140, 248, 0.6) 85%,
    transparent 100%
  );
  box-shadow: 0 0 20px rgba(249, 115, 22, 0.4);
  pointer-events: none;
}

.page-layout__logo {
  position: relative;
  flex-shrink: 0;
  width: 168px;
  display: flex;
  align-items: center;
}

.page-layout__logo img {
  width: 100%;
  height: auto;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.25));
}

.page-layout__logo-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 140%;
  background: radial-gradient(ellipse at center, rgba(249, 115, 22, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.page-layout__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  gap: 12px;
}

.page-layout__content {
  flex: 1;
  min-height: 0;
  color: #435368;
}
</style>
