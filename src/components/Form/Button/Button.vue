<script lang="ts" setup>
import { computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  className: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'Submit '
  }
})

const classNames = computed(() => {
  switch (props.variant) {
    case 'edit':
      return 'button--edit'

    case 'submit':
      return 'button--submit'

    case 'remove':
      return 'button--remove'

    default:
      return 'button--disabled'
  }
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>
<template>
  {{ props.className }}
  <button
    :class="`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded self-center ${classNames.toString()}`"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<style>
.button--remove {
  background: red;
}

.button--edit {
  background: #f97316;
}
</style>
