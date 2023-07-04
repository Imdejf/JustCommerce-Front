<script lang="ts" setup>
import { useRouter } from 'vue-router'
import type { ProductAttributeDTO } from '/@/types/ProductAttribute/ProductAttribute.ts'
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
  attributeGroup: {
    type: Object as ObjectConstructor,
    default: () => ({} as ProductAttributeDTO)
  }
})

const removeModal = ref(false)

const handleEdit = () => {
  router.push(`/catalog/product-attribute/edit/${props.id}`)
}

const handleRemove = async () => {
  try {
    await Api.attributeGroups.remove(props.id)
    toast.success('Usunięto kategorie?', {
      timeout: 2000
    })
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
        text="Czy chcesz usunąć kategorie?"
      />
      <Button @click="handleEdit" variant="edit"> Edytuj </Button>
    </div>
  </div>
</template>
