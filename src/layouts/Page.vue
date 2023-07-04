<script lang="ts" setup>
import PageNavbar from '../components/Page/Navbar.vue'
import TopNavbar from '../components/Page/TopNavbar.vue'
</script>

<template>
  <div class="flex h-screen w-screen">
    <div class="block max-w-[200px] h-full bg-gray-900 text-white text-center">
      <slot name="header">
        <PageNavbar></PageNavbar>
      </slot>
    </div>
    <div class="block w-full bg-blue-50 overflow-auto">
      <div class="flex h-16 w-full border-b border-1 border-orange-500 bg-sky-50">
        <TopNavbar />
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>
