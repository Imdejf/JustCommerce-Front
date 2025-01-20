<script lang="ts" setup>
import PageNavbar from '../components/Page/Navbar.vue'
import TopNavbar from '../components/Page/TopNavbar.vue'
</script>

<template>
  <div class="flex">
    <div class="flex border-b border-1 border-orange-500 ">
    </div>
    <div class="block w-full bg-blue-50">
      <div class="flex h-15 border-b border-1 border-orange-500 bg-gray-900">
        <div class="w-[200px]"><img src="../assets/images/logo.png" /></div>
        <div class="flex justify-between w-full ">
          <PageNavbar/>
          <TopNavbar />
        </div>
      </div>
      <div class="text-[#435368]">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
