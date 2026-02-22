<script lang="ts" setup>
import { useRouter } from 'vue-router'
import type { WarehouseBrandDto } from '/@/types/brand/WarehouseBrand'
import type { BrandDto } from '/@/types/brand/Brand'
import { ref, onMounted, watch } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

const props = defineProps({
  warehouse: {
    type: Object as () => WarehouseBrandDto,
    required: true
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const toast = useToast()
const cookies = new Cookies()

const currentWarehouse = ref<WarehouseBrandDto>({ ...props.warehouse })

const brands = ref<BrandDto[]>([])
const loadingBrands = ref(false)

const storeId = ref<string | null>(null)

onMounted(async () => {
  storeId.value = cookies.get('dsStore') ?? null

  if (!props.updated && storeId.value) {
    ;(currentWarehouse.value as any).storeId = storeId.value
  }

  await loadBrands()
})

const loadBrands = async () => {
  try {
    loadingBrands.value = true
    if (!storeId.value) {
      toast.error('Brak storeId (cookie dsStore)')
      return
    }

    const result = await Api.brands.filterList(storeId.value, '', 1, 999)
    brands.value = result?.items ?? []
  } catch (e) {
    toast.error('Nie udało się pobrać marek')
  } finally {
    loadingBrands.value = false
  }
}

watch(
  () => props.warehouse,
  (val) => {
    currentWarehouse.value = { ...val }
  },
  { deep: true }
)

const handleSave = async () => {
  try {
    if (!storeId.value) {
      toast.error('Brak storeId (cookie dsStore)')
      return
    }

    if (!currentWarehouse.value.brandId) {
      toast.error('Wybierz markę')
      return
    }

    // dopnij storeId przy create/update jeśli DTO ma takie pole
    ;(currentWarehouse.value as any).storeId = storeId.value
    console.log(currentWarehouse.value)
    const payload = { body: JSON.stringify(currentWarehouse.value) }

    if (!props.updated) {
      await Api.brands.createWarehouseBrand(payload)
      toast.success('Dodano magazyn', { timeout: 2000 })
    } else {
      await Api.brands.updateWarehouseBrand(payload)
      toast.success('Edytowano magazyn', { timeout: 2000 })
    }

    router.go(-1)
  } catch {
    toast.error('Wystąpił błąd', { timeout: 2000 })
  }
}
</script>

<template>
  <ContentContainer class="overflow-auto h-[95vh]">
    <FormKit type="form" @submit="handleSave" :actions="false">
      <FormSection title="Magazyn marki">
        <!-- ✅ WYBÓR MARKI -->
        <div class="flex w-full">
          <FormKit
            type="select"
            label="Marka"
            v-model="currentWarehouse.brandId"
            validation="required"
            :disabled="loadingBrands"
            :options="[
              { label: loadingBrands ? 'Ładowanie...' : 'Wybierz markę', value: null },
              ...brands.map((b) => ({ label: b.name, value: b.id }))
            ]"
          />
        </div>

        <div class="flex w-full">
          <FormKit
            type="text"
            v-model="currentWarehouse.warehouseName"
            label="Nazwa magazynu"
            validation="required"
          />
          <FormKit
            type="text"
            v-model="currentWarehouse.name"
            label="Nazwa wewnętrzna"
            validation="required"
          />
        </div>

        <div class="flex w-full">
          <FormKit type="text" v-model="currentWarehouse.street" label="Ulica" validation="required" />
          <FormKit type="text" v-model="currentWarehouse.number" label="Numer" validation="required" />
        </div>

        <div class="flex w-full">
          <FormKit type="text" v-model="currentWarehouse.postCode" label="Kod pocztowy" validation="required" />
          <FormKit type="text" v-model="currentWarehouse.city" label="Miasto" validation="required" />
        </div>

        <div class="flex w-full">
          <FormKit type="text" v-model="currentWarehouse.personContact" label="Osoba kontaktowa" />
          <FormKit type="text" v-model="currentWarehouse.phone" label="Telefon" />
          <FormKit type="text" v-model="currentWarehouse.email" label="Email" />
        </div>

        <FormKit type="checkbox" v-model="currentWarehouse.isPublished" label="Widoczny" />
      </FormSection>

      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
