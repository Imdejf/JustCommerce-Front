<script lang="ts" setup>
import { useRouter } from 'vue-router'
import type { CategoryDTO } from '/@/types/category/Category'
import Button from '../../../Form/Button/Button.vue'
import { ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const props = defineProps({
  id: {
    type: String,
    default: ''
  },
  category: {
    type: Object as ObjectConstructor,
    default: () => ({} as CategoryDTO)
  }
})

const removeModal = ref(false)

const handleEdit = () => {
  router.push(`/catalog/product/edit/${props.id}`)
}

const handleRemove = async () => {
  try {
    await Api.products.removeProduct(props.id)
    toast.success('Usunięto produkt', {
      timeout: 2000
    })
    removeModal.value = false;
    router.push(`/catalog/product`)
  } catch (error) {
    toast.error('Błąd serwerowy', {
      timeout: 2000
    })
  }
}
</script>

<template>
  <div class="flex justify-between text-sm">
    <div class="flex gap-4">
      <Button @click="removeModal = true" variant="remove"> Usuń </Button>
      <ConfirmModal
        v-if="removeModal"
        @confirmed="handleRemove"
        @canceled="removeModal = false"
        text="Czy chcesz usunąć produkt?"
      />
      <Button @click="handleEdit" variant="edit"> Edytuj </Button>
    </div>
  </div>
</template>
