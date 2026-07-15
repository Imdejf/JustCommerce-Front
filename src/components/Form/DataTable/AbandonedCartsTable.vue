<template>
  <div class="p-4 h-full">
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-slate-200 flex flex-col gap-3">
        <div class="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
          <div>
            <div class="text-lg font-semibold text-slate-900">Porzucone koszyki</div>
            <div class="text-xs text-slate-500">
              Aktywne koszyki z produktami, bez aktualizacji od co najmniej {{ abandonedAfterHours }} godz.
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-500">Próg porzucenia:</span>
            <el-select v-model="abandonedAfterHours" size="small" class="!w-[120px]" @change="refreshNow">
              <el-option :value="1" label="1 godz." />
              <el-option :value="3" label="3 godz." />
              <el-option :value="6" label="6 godz." />
              <el-option :value="24" label="24 godz." />
            </el-select>
            <el-button size="small" @click="refreshNow" :loading="loading">Odśwież</el-button>
          </div>
        </div>

        <el-input
          v-model="search"
          clearable
          class="lg:!w-[360px]"
          placeholder="Szukaj: email / username / customerId"
          @keyup.enter="applySearch"
          @clear="applySearch"
        />
      </div>

      <div class="px-4 py-3">
        <el-table :data="rows" v-loading="loading" row-key="cartId" height="70vh">
          <el-table-column label="Klient" min-width="220">
            <template #default="{ row }">
              <div class="font-semibold text-slate-900">{{ row.customerUsername ?? '—' }}</div>
              <div class="text-xs text-slate-500">{{ row.customerEmail ?? '—' }}</div>
              <div class="text-[11px] text-slate-400 font-mono">{{ row.customerId }}</div>
            </template>
          </el-table-column>

          <el-table-column label="Koszyk" width="180">
            <template #default="{ row }">
              <div class="text-sm font-bold text-slate-900">{{ formatMoney(row.itemsValue) }}</div>
              <div class="text-xs text-slate-500">{{ row.totalQuantity }} szt. • {{ row.itemsCount }} poz.</div>
              <div class="text-[11px] text-orange-700 font-semibold" v-if="row.isAbandoned">PORZUCONY</div>
            </template>
          </el-table-column>

          <el-table-column label="Zawartość" min-width="320">
            <template #default="{ row }">
              <div v-for="item in row.items" :key="item.id" class="text-xs text-slate-700 py-0.5">
                <span class="font-semibold">{{ item.quantity }}×</span>
                {{ item.productName ?? 'Produkt' }}
                <span class="text-slate-500">({{ formatMoney(item.lineTotal) }})</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Daty" width="210">
            <template #default="{ row }">
              <div class="text-xs text-slate-700">Utw: {{ formatDate(row.createdOn) }}</div>
              <div class="text-xs text-slate-900 font-semibold">Upd: {{ formatDate(row.latestUpdatedOn) }}</div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pt-3 flex items-center justify-between">
          <div class="text-xs text-slate-500">
            Łącznie <b>{{ totalCount }}</b> porzuconych koszyków
          </div>
          <el-pagination
            background
            layout="prev, pager, next"
            :current-page="pageNumber"
            :page-size="pageSize"
            :total="totalCount"
            @current-change="onPage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import { useToast } from 'vue-toastification'
import { Api } from '/@/services/api'

const toast = useToast()
const cookies = new Cookies()
const storeId = cookies.get('dsStore')

const loading = ref(false)
const search = ref('')
const rows = ref<any[]>([])
const pageNumber = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const abandonedAfterHours = ref(1)

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('pl-PL')
}

const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value ?? 0))

const buildFilter = () => ({
  StoreId: storeId,
  PageNumber: pageNumber.value,
  PageSize: pageSize.value,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        AbandonedOnly: true,
        AbandonedAfterHours: abandonedAfterHours.value,
        SearchTerm: search.value.trim() || null,
        IsActive: true,
        HasItems: true
      }
    }
  }
})

const fetchCarts = async () => {
  loading.value = true
  try {
    const res = await Api.tracking.getAllShoppingCart({
      body: JSON.stringify(buildFilter())
    })
    const data = res?.data ?? res
    rows.value = data?.items ?? []
    totalCount.value = data?.totalCount ?? rows.value.length
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać porzuconych koszyków')
  } finally {
    loading.value = false
  }
}

const refreshNow = async () => {
  await fetchCarts()
}

const applySearch = async () => {
  pageNumber.value = 1
  await refreshNow()
}

const onPage = async (p: number) => {
  pageNumber.value = p
  await refreshNow()
}

onMounted(refreshNow)
</script>
