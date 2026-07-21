<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  fields: Array<{ key: string; label: string; required?: boolean }>
}>()

const emit = defineEmits<{
  close: []
  confirm: [fields: string[]]
}>()

const selected = ref<string[]>([])

const allKeys = computed(() => props.fields.map((f) => f.key))

const selectAll = () => {
  selected.value = [...allKeys.value]
}

const selectNone = () => {
  selected.value = props.fields.filter((f) => f.required).map((f) => f.key)
}

const selectPrices = () => {
  const priceKeys = new Set([
    'Id',
    'SKU',
    'Kod identyfikacji',
    'Cena',
    'Cena Producenta',
    'Stara cena',
    'Cena promocyjna',
    'Pobranie',
    'GMC'
  ])
  selected.value = props.fields.filter((f) => priceKeys.has(f.key) || f.required).map((f) => f.key)
}

const selectImages = () => {
  const imageKeys = new Set(['Id', 'SKU', 'Nazwa', 'URL miniatury', 'URL galerii'])
  selected.value = props.fields.filter((f) => imageKeys.has(f.key) || f.required).map((f) => f.key)
}

const confirm = () => {
  const required = props.fields.filter((f) => f.required).map((f) => f.key)
  emit('confirm', Array.from(new Set([...required, ...selected.value])))
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) selected.value = [...allKeys.value]
  }
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="Eksport produktów do Excela"
    width="560px"
    :close-on-click-modal="false"
    @close="emit('close')"
  >
    <p class="text-sm text-gray-600 mb-3">
      Wybierz pola do eksportu. Kolumna <b>Id</b> jest zawsze wymagana (potrzebna przy imporcie).
      Eksport uwzględnia aktywne filtry z listy produktów.
    </p>

    <div class="flex flex-wrap gap-2 mb-4">
      <el-button size="small" @click="selectAll">Wszystkie</el-button>
      <el-button size="small" @click="selectNone">Tylko Id</el-button>
      <el-button size="small" @click="selectPrices">Ceny / kody</el-button>
      <el-button size="small" @click="selectImages">Zdjęcia</el-button>
    </div>

    <el-checkbox-group v-model="selected" class="!flex !flex-col gap-1 max-h-[360px] overflow-auto">
      <el-checkbox
        v-for="field in fields"
        :key="field.key"
        :label="field.key"
        :disabled="!!field.required"
      >
        {{ field.label }}
      </el-checkbox>
    </el-checkbox-group>

    <template #footer>
      <el-button @click="emit('close')">Anuluj</el-button>
      <el-button type="primary" @click="confirm">Eksportuj</el-button>
    </template>
  </el-dialog>
</template>
