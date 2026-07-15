<script lang="ts" setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div :class="fullWidth ? 'w-full' : ''">
    <span class="my-3 block font-medium text-lg">{{ title }}</span>
    <div :class="fullWidth ? 'formsection-full w-full space-y-4' : 'formsection flex flex-wrap gap-10'">
      <slot />
    </div>
  </div>
</template>

<style>
.formsection .formkit-outer {
  width: 30%;
}

.formsection-full .formkit-outer {
  width: 100%;
  max-width: none;
}
</style>
