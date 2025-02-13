<script lang="ts" setup>
import PageNavbar from '../components/Page/Navbar.vue'
import TopNavbar from '../components/Page/TopNavbar.vue'
</script>

<template>
  <div class="flex min-h-screen">
    <div class="flex border-b border-1 border-orange-500 h-full">
    </div>
    <div class="w-full bg-blue-50 ">
      <div class="flex min-h-[6vh] border-b border-1 border-orange-500 bg-gray-900">
        <div class="w-[200px]"><img src="../assets/images/logo.png" /></div>
        <div class="flex justify-between w-full ">
          <PageNavbar/>
          <TopNavbar />
        </div>
      </div>
      <div class="text-[#435368] h-[80%]">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
