<template>
  <div class="p-3">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex justify-between items-center">
        <div class="flex">
          <span class="flex hover:bg-sky-100 p-1">
            <a @click="loadData" class="rounded-md p-1 text-xs font-semibold">
              Odśwież dane Allegro
            </a>
          </span>
        </div>

        <div class="text-xs font-semibold text-[#435368]">
          Ustawienia sprzedaży Allegro
        </div>
      </div>
    </div>

    <div v-loading="loading" class="bg-white border border-[#d6dfe9] p-4">
      <div class="grid grid-cols-1 gap-4">
        <FormSection title="Cenniki dostawy">
          <el-table :data="deliveryPriceLists" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!deliveryPriceLists.length"
            description="Brak cenników dostawy"
          />
        </FormSection>

        <FormSection title="Polityki zwrotów">
          <el-table :data="returnPolicies" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!returnPolicies.length"
            description="Brak polityk zwrotów"
          />
        </FormSection>

        <FormSection title="Rękojmie">
          <el-table :data="impliedWarranties" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!impliedWarranties.length"
            description="Brak rękojmi"
          />
        </FormSection>

        <FormSection title="Gwarancje">
          <el-table :data="warranties" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!warranties.length"
            description="Brak gwarancji"
          />
        </FormSection>

        <FormSection title="Surowe dane">
          <el-collapse>
            <el-collapse-item title="Pokaż JSON" name="json">
              <pre class="json-preview">{{ JSON.stringify(rawData, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </FormSection>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const loading = ref(false)

const deliveryPriceLists = ref<any[]>([])
const returnPolicies = ref<any[]>([])
const impliedWarranties = ref<any[]>([])
const warranties = ref<any[]>([])

const rawData = reactive<any>({
  deliveryPriceLists: [],
  returnPolicies: [],
  impliedWarranties: [],
  warranties: []
})

const normalizeList = (result: any) => {
  const data = result?.data || result
  return data?.items || data || []
}

const loadData = async () => {
  loading.value = true

  try {
    const [delivery, returns, implied, warranty] = await Promise.all([
      Api.allegro.getDeliveryPriceLists(),
      Api.allegro.getReturnPolicies(),
      Api.allegro.getImpliedWarranties(),
      Api.allegro.getWarranties()
    ])

    deliveryPriceLists.value = normalizeList(delivery)
    returnPolicies.value = normalizeList(returns)
    impliedWarranties.value = normalizeList(implied)
    warranties.value = normalizeList(warranty)

    rawData.deliveryPriceLists = delivery
    rawData.returnPolicies = returns
    rawData.impliedWarranties = implied
    rawData.warranties = warranty

    toast.success('Pobrano ustawienia Allegro')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać ustawień Allegro')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.json-preview {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  font-size: 11px;
  max-height: 500px;
  overflow: auto;
}
</style>