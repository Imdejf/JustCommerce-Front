<script lang="ts" setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div>
    <span class="my-3 block font-medium text-lg">{{ title }}</span>
    <div class="formsection flex flex-wrap gap-10">
      <slot />
    </div>
  </div>
</template>

<style>
.formsection .formkit-outer {
  width: 30%;
}
</style>
