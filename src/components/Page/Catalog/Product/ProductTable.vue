<script lang="ts" setup>
import { Api } from '/@/services/api'
import { computed, onMounted, ref, watch } from 'vue'
import Cookies from 'universal-cookie'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Filter, ArrowDown, Plus, Upload, Download, Refresh } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  filtersChanged,
  parseDateQuery,
  parseQueryBoolean,
  parseQueryNumber,
  parseQueryPage,
  parseQueryString,
  setDateQuery,
  setQueryBoolean,
  setQueryNumber,
  setQueryString
} from '/@/utils/urlTableFilters'

use([PieChart, BarChart, GridComponent, CanvasRenderer])

type ProductFilters = {
  storeId: string | number | null
  name: string | null
  identificationCode: string | null
  brandId: string | null
  categoryId: string | null
  isPublished: boolean | null
  isVisibleIndividually: boolean | null
  hasOptions: boolean | null
  minPrice: number | null
  maxPrice: number | null
  minStock: number | null
  maxStock: number | null
  createdFrom: string | null
  pageNumber: number
  pageSize: number
}

const cookies = new Cookies()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const brands = ref<Array<{ value: string | null; label: string }>>([])
const categories = ref<Array<{ value: string | null; label: string }>>([])
const props = defineProps<{
  exportLoading?: boolean
}>()
const emit = defineEmits(['open-import', 'open-export'])
const filtersOpen = ref(false)
const loading = ref(false)
const isSyncingFromRoute = ref(false)

const createDefaultFilters = (): ProductFilters => ({
  storeId: cookies.get('dsStore'),
  name: null,
  identificationCode: null,
  brandId: null,
  categoryId: null,
  isPublished: null,
  isVisibleIndividually: null,
  hasOptions: null,
  minPrice: null,
  maxPrice: null,
  minStock: null,
  maxStock: null,
  createdFrom: null,
  pageNumber: 1,
  pageSize: 24
})

const buildFiltersFromQuery = (): ProductFilters => {
  const defaults = createDefaultFilters()
  return {
    ...defaults,
    name: parseQueryString(route.query, 'name', null),
    identificationCode: parseQueryString(route.query, 'identificationCode', null),
    brandId: parseQueryString(route.query, 'brandId', null),
    categoryId: parseQueryString(route.query, 'categoryId', null),
    isPublished: parseQueryBoolean(route.query, 'isPublished', null),
    isVisibleIndividually: parseQueryBoolean(route.query, 'isVisibleIndividually', null),
    hasOptions: parseQueryBoolean(route.query, 'hasOptions', null),
    minPrice: parseQueryNumber(route.query, 'minPrice', null),
    maxPrice: parseQueryNumber(route.query, 'maxPrice', null),
    minStock: parseQueryNumber(route.query, 'minStock', null),
    maxStock: parseQueryNumber(route.query, 'maxStock', null),
    createdFrom: parseDateQuery(route.query, 'createdFrom'),
    pageNumber: parseQueryPage(route.query, 1),
    pageSize: parseQueryNumber(route.query, 'pageSize', 24) || 24
  }
}

const buildQueryFromFilters = (filters: ProductFilters) => {
  const query: Record<string, string> = {}
  setQueryString(query, 'name', filters.name)
  setQueryString(query, 'identificationCode', filters.identificationCode)
  setQueryString(query, 'brandId', filters.brandId)
  setQueryString(query, 'categoryId', filters.categoryId)
  setQueryBoolean(query, 'isPublished', filters.isPublished)
  setQueryBoolean(query, 'isVisibleIndividually', filters.isVisibleIndividually)
  setQueryBoolean(query, 'hasOptions', filters.hasOptions)
  setQueryNumber(query, 'minPrice', filters.minPrice)
  setQueryNumber(query, 'maxPrice', filters.maxPrice)
  setQueryNumber(query, 'minStock', filters.minStock)
  setQueryNumber(query, 'maxStock', filters.maxStock)
  setDateQuery(query, 'createdFrom', filters.createdFrom)
  setQueryNumber(query, 'page', filters.pageNumber)
  setQueryNumber(query, 'pageSize', filters.pageSize)
  return query
}

const filter = ref<ProductFilters>(buildFiltersFromQuery())
const products = ref<any>({ items: [], totalCount: 0 })

const items = computed(() => products.value?.items ?? [])

const kpi = computed(() => {
  const rows = items.value
  return {
    total: products.value?.totalCount ?? 0,
    pageCount: rows.length,
    published: rows.filter((p: any) => p.isPublished).length,
    unpublished: rows.filter((p: any) => !p.isPublished).length,
    lowStock: rows.filter((p: any) => (p.stockQuantity ?? 0) <= 3).length,
    lowMargin: rows.filter((p: any) => (p.priceMarkup ?? 0) < 10 && (p.priceMarkup ?? 0) > 0).length,
    allegro: rows.filter((p: any) => p.hasAllegroMapping).length,
    withOptions: rows.filter((p: any) => p.hasOptions).length
  }
})

const marginDonutOption = computed(() => ({
  series: [{
    type: 'pie',
    radius: ['58%', '88%'],
    silent: true,
    label: { show: false },
    data: [
      { value: kpi.value.lowMargin || 0.1, itemStyle: { color: '#ef4444' } },
      { value: Math.max(kpi.value.pageCount - kpi.value.lowMargin, 0.1), itemStyle: { color: 'rgba(255,255,255,0.15)' } }
    ]
  }]
}))

const stockBarOption = computed(() => ({
  grid: { left: 0, right: 0, top: 4, bottom: 0 },
  xAxis: { type: 'category', show: false, data: ['', '', ''] },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'bar',
    barWidth: '50%',
    data: [
      { value: kpi.value.lowStock, itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] } },
      { value: kpi.value.published, itemStyle: { color: '#34d399', borderRadius: [4, 4, 0, 0] } },
      { value: kpi.value.allegro, itemStyle: { color: '#818cf8', borderRadius: [4, 4, 0, 0] } }
    ]
  }]
}))

const activeFiltersCount = computed(() => {
  let count = 0
  if (filter.value.name) count++
  if (filter.value.identificationCode) count++
  if (filter.value.brandId) count++
  if (filter.value.categoryId) count++
  if (filter.value.isPublished !== null) count++
  if (filter.value.isVisibleIndividually !== null) count++
  if (filter.value.hasOptions !== null) count++
  if (filter.value.minPrice !== null) count++
  if (filter.value.maxPrice !== null) count++
  if (filter.value.minStock !== null) count++
  if (filter.value.maxStock !== null) count++
  if (filter.value.createdFrom) count++
  return count
})

const money = (v?: number | null) =>
  v == null ? '—' : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v)

const marginTone = (m?: number | null) => {
  const val = m ?? 0
  if (val >= 25) return 'good'
  if (val >= 10) return 'ok'
  if (val > 0) return 'low'
  return 'none'
}

const stockTone = (stock?: number | null) => {
  if (stock == null) return 'unknown'
  if (stock <= 0) return 'out'
  if (stock <= 3) return 'low'
  return 'ok'
}

const syncFiltersToUrl = (filters: ProductFilters) => {
  router.replace({ query: buildQueryFromFilters(filters) })
}

const buildPredicateObject = () => {
  const predicate: Record<string, unknown> = {}
  if (filter.value.name) predicate.Name = filter.value.name
  if (filter.value.identificationCode) predicate.IdentificationCode = filter.value.identificationCode
  if (filter.value.brandId) predicate.BrandId = filter.value.brandId
  if (filter.value.categoryId) predicate.CategoryId = filter.value.categoryId
  if (filter.value.isPublished !== null) predicate.IsPublished = filter.value.isPublished
  if (filter.value.isVisibleIndividually !== null) predicate.IsVisibleIndividually = filter.value.isVisibleIndividually
  if (filter.value.hasOptions !== null) predicate.HasOptions = filter.value.hasOptions
  if (filter.value.minPrice !== null) predicate.MinPrice = filter.value.minPrice
  if (filter.value.maxPrice !== null) predicate.MaxPrice = filter.value.maxPrice
  if (filter.value.minStock !== null) predicate.MinStock = filter.value.minStock
  if (filter.value.maxStock !== null) predicate.MaxStock = filter.value.maxStock
  if (filter.value.createdFrom) {
    predicate.CreatedOn = { after: new Date(filter.value.createdFrom).toISOString() }
  }
  return predicate
}

const fetchTableData = async () => {
  loading.value = true
  try {
    const payload = {
      body: JSON.stringify({
        StoreId: filter.value.storeId,
        PageNumber: filter.value.pageNumber,
        PageSize: filter.value.pageSize,
        SmartTableParam: { Search: { PredicateObject: buildPredicateObject() } }
      })
    }
    const result = await Api.products.smartTable(payload)
    const data = result.data ?? { items: [], totalCount: 0 }
    data.items = (data.items ?? []).map((item: any) => ({
      ...item,
      displayOrder: item.displayOrder && item.displayOrder > 0 ? item.displayOrder : null
    }))
    products.value = data
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać produktów')
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => {
  filter.value.pageNumber = 1
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const clearFilters = async () => {
  filter.value = { ...createDefaultFilters(), pageNumber: 1, pageSize: filter.value.pageSize }
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const handlePageChange = async (page: number) => {
  filter.value.pageNumber = page
  syncFiltersToUrl(filter.value)
  await fetchTableData()
}

const openProduct = (id: string) => {
  router.push({ path: `/catalog/product/detail/${id}`, query: route.query })
}

const handleAdd = () => router.push('/catalog/product/add')

const exportProductToExcel = () => emit('open-export')

const quickEditSaving = ref<Record<string, boolean>>({})

const saveQuickEdit = async (product: any) => {
  const id = String(product.id)
  if (quickEditSaving.value[id]) return
  quickEditSaving.value = { ...quickEditSaving.value, [id]: true }
  try {
    const displayOrderRaw = product.displayOrder
    const displayOrder =
      displayOrderRaw === null || displayOrderRaw === undefined || displayOrderRaw === ''
        ? null
        : Number(displayOrderRaw)

    await Api.products.updateQuickEdit({
      body: JSON.stringify({
        productId: product.id,
        gmc: !!product.gmc,
        displayOrder: Number.isFinite(displayOrder as number) ? displayOrder : null
      })
    })
    toast.success('Zapisano')
  } catch {
    toast.error('Nie udało się zapisać')
  } finally {
    quickEditSaving.value = { ...quickEditSaving.value, [id]: false }
  }
}

const allBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Wszyscy' },
      ...result.items.map((item: any) => ({ value: item.id, label: item.name }))
    ]
  } catch (e) {
    console.error(e)
  }
}

const allCategories = async () => {
  try {
    const result = await Api.categories.listByStoreId()
    categories.value = [
      { value: null, label: 'Wszystkie' },
      ...result.items.map((item: any) => ({ value: item.id, label: item.name }))
    ]
  } catch (e) {
    console.error(e)
  }
}

const listQuery = computed(() => JSON.stringify(route.query))

watch(listQuery, async () => {
  if (isSyncingFromRoute.value) return
  const parsed = buildFiltersFromQuery()
  if (!filtersChanged(filter.value, parsed)) return
  isSyncingFromRoute.value = true
  filter.value = parsed
  await fetchTableData()
  isSyncingFromRoute.value = false
})

onMounted(async () => {
  if (activeFiltersCount.value > 0) filtersOpen.value = true
  await Promise.all([allBrands(), allCategories(), fetchTableData()])
})

defineExpose({
  refresh: fetchTableData,
  getExportFilters: () => ({ ...buildPredicateObject() })
})
</script>

<template>
  <div class="catalog-page">
    <header class="catalog-page__header">
      <div>
        <p class="catalog-page__eyebrow">Katalog sklepu</p>
        <h1 class="catalog-page__title">Produkty</h1>
        <p class="catalog-page__subtitle">Zarządzaj asortymentem, cenami i publikacją</p>
      </div>
      <div class="catalog-page__actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">Dodaj produkt</el-button>
        <el-button :icon="Download" :loading="props.exportLoading" @click="exportProductToExcel">Eksport</el-button>
        <el-button :icon="Upload" @click="emit('open-import')">Import</el-button>
        <el-button :icon="Refresh" :loading="loading" @click="fetchTableData">Odśwież</el-button>
      </div>
    </header>

    <div class="catalog-kpi">
      <div class="cosmic-card cosmic-card--total">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">W katalogu</span><span class="cosmic-card__glyph">◎</span></div>
          <div class="cosmic-card__value">{{ kpi.total }}</div>
          <div class="cosmic-card__foot">{{ kpi.pageCount }} na tej stronie · {{ kpi.withOptions }} z wariantami</div>
        </div>
      </div>
      <div class="cosmic-card cosmic-card--published">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Publikacja</span><span class="cosmic-card__glyph">◈</span></div>
          <div class="cosmic-card__value">{{ kpi.published }}<span class="cosmic-card__value-sub">/{{ kpi.pageCount }}</span></div>
          <div class="cosmic-card__foot">{{ kpi.unpublished }} nieopublikowanych na stronie</div>
          <v-chart class="cosmic-card__chart" :option="stockBarOption" autoresize />
        </div>
      </div>
      <div class="cosmic-card cosmic-card--margin">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Niski narzut</span><span class="cosmic-card__glyph">✦</span></div>
          <div class="cosmic-card__value">{{ kpi.lowMargin }}</div>
          <div class="cosmic-card__foot">produktów &lt;10% na stronie</div>
          <v-chart class="cosmic-card__chart cosmic-card__chart--donut" :option="marginDonutOption" autoresize />
        </div>
      </div>
      <div class="cosmic-card cosmic-card--stock">
        <div class="cosmic-card__stars" />
        <div class="cosmic-card__content">
          <div class="cosmic-card__head"><span class="cosmic-card__label">Stan / Allegro</span><span class="cosmic-card__glyph">❖</span></div>
          <div class="cosmic-card__value">{{ kpi.lowStock }}</div>
          <div class="cosmic-card__foot">niski stan · {{ kpi.allegro }} z mapowaniem Allegro</div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="filters-card">
      <div class="filters-card__head" @click="filtersOpen = !filtersOpen">
        <div class="filters-card__title">
          <el-icon><Filter /></el-icon>
          <span>Filtry produktów</span>
          <el-tag v-if="activeFiltersCount" size="small" type="warning" effect="dark" round>{{ activeFiltersCount }}</el-tag>
        </div>
        <el-icon class="filters-card__chevron" :class="{ 'filters-card__chevron--open': filtersOpen }"><ArrowDown /></el-icon>
      </div>
      <el-collapse-transition>
        <div v-show="filtersOpen" class="filters-card__body">
          <el-row :gutter="12">
            <el-col :xs="24" :sm="12" :md="6">
              <label class="filter-label">Nazwa</label>
              <el-input v-model="filter.name" placeholder="Nazwa..." clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="4">
              <label class="filter-label">Kod producenta</label>
              <el-input v-model="filter.identificationCode" clearable @keyup.enter="applyFilters" />
            </el-col>
            <el-col :xs="24" :sm="12" :md="4">
              <label class="filter-label">Producent</label>
              <el-select v-model="filter.brandId" clearable placeholder="Wszyscy" class="!w-full" filterable>
                <el-option v-for="b in brands" :key="String(b.value)" :label="b.label" :value="b.value" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="12" :md="4">
              <label class="filter-label">Kategoria</label>
              <el-select v-model="filter.categoryId" clearable placeholder="Wszystkie" class="!w-full" filterable>
                <el-option v-for="c in categories" :key="String(c.value)" :label="c.label" :value="c.value" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="8" :md="3">
              <label class="filter-label">Publikacja</label>
              <el-select v-model="filter.isPublished" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Opublikowane" :value="true" /><el-option label="Nieopublikowane" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="8" :md="3">
              <label class="filter-label">Główne</label>
              <el-select v-model="filter.isVisibleIndividually" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Główne" :value="true" /><el-option label="Warianty" :value="false" />
              </el-select>
            </el-col>
          </el-row>
          <el-row :gutter="12" class="mt-3">
            <el-col :xs="12" :sm="6" :md="3">
              <label class="filter-label">Warianty</label>
              <el-select v-model="filter.hasOptions" clearable placeholder="Wszystkie" class="!w-full">
                <el-option label="Z wariantami" :value="true" /><el-option label="Bez" :value="false" />
              </el-select>
            </el-col>
            <el-col :xs="12" :sm="6" :md="3">
              <label class="filter-label">Cena od</label>
              <el-input-number v-model="filter.minPrice" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="6" :md="3">
              <label class="filter-label">Cena do</label>
              <el-input-number v-model="filter.maxPrice" :controls="false" :precision="2" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="6" :md="3">
              <label class="filter-label">Stan od</label>
              <el-input-number v-model="filter.minStock" :controls="false" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="6" :md="3">
              <label class="filter-label">Stan do</label>
              <el-input-number v-model="filter.maxStock" :controls="false" class="!w-full" />
            </el-col>
            <el-col :xs="12" :sm="6" :md="3">
              <label class="filter-label">Utworzono od</label>
              <el-date-picker v-model="filter.createdFrom" type="date" format="YYYY-MM-DD" value-format="YYYY-MM-DD" class="!w-full" clearable />
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" class="flex items-end gap-2">
              <el-button type="primary" @click="applyFilters">Filtruj</el-button>
              <el-button @click="clearFilters">Wyczyść</el-button>
            </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
    </el-card>

    <el-card shadow="never" class="list-card">
      <div class="list-scroll-wrap">
        <el-skeleton :loading="loading" animated :count="6">
          <template #template>
            <div class="product-grid">
              <div v-for="i in 6" :key="i" class="product-skel" />
            </div>
          </template>
          <template #default>
            <div v-if="!items.length" class="catalog-empty">
              <div class="catalog-empty__icon">🏷️</div>
              <h3>Brak produktów</h3>
              <p>Nie znaleziono produktów dla wybranych filtrów.</p>
              <el-button @click="clearFilters">Wyczyść filtry</el-button>
            </div>
            <div v-else class="product-grid">
              <article
                v-for="product in items"
                :key="product.id"
                class="product-card"
                :class="{
                  'product-card--unpublished': !product.isPublished,
                  'product-card--low-margin': marginTone(product.priceMarkup) === 'low',
                  'product-card--low-stock': stockTone(product.stockQuantity) === 'low' || stockTone(product.stockQuantity) === 'out'
                }"
                @click="openProduct(product.id)"
              >
                <div class="product-card__img-wrap">
                  <img v-if="product.filePath" :src="product.filePath" :alt="product.name" class="product-card__img" />
                  <div v-else class="product-card__img-placeholder">📦</div>
                  <span v-if="!product.isPublished" class="product-card__badge product-card__badge--draft">Szkic</span>
                  <span v-if="product.hasAllegroMapping" class="product-card__badge product-card__badge--allegro">A</span>
                  <span v-if="product.hasOptions" class="product-card__badge product-card__badge--variants">Warianty</span>
                </div>

                <div class="product-card__body">
                  <h3 class="product-card__name" :title="product.name">{{ product.name }}</h3>
                  <p class="product-card__code">{{ product.identificationCode || '—' }}</p>
                  <p v-if="product.brandName" class="product-card__brand">{{ product.brandName }}</p>

                  <div class="product-card__prices">
                    <div>
                      <span class="product-card__price-label">Cena</span>
                      <strong class="product-card__price">{{ money(product.price) }}</strong>
                    </div>
                    <div>
                      <span class="product-card__price-label">Producent</span>
                      <strong>{{ money(product.producentPrice) }}</strong>
                    </div>
                    <div>
                      <span class="product-card__price-label">Narzut</span>
                      <strong class="margin-chip" :class="`margin-chip--${marginTone(product.priceMarkup)}`">
                        {{ product.priceMarkup ?? 0 }}%
                      </strong>
                    </div>
                  </div>

                  <div class="product-card__quick" @click.stop>
                    <div class="product-card__quick-row">
                      <span class="product-card__quick-label">Kolejność</span>
                      <el-input-number
                        v-model="product.displayOrder"
                        :min="1"
                        :controls="false"
                        placeholder="—"
                        class="product-card__order-input"
                        @change="saveQuickEdit(product)"
                      />
                    </div>
                    <div class="product-card__quick-row">
                      <span class="product-card__quick-label">GMC</span>
                      <el-switch
                        v-model="product.gmc"
                        :loading="!!quickEditSaving[product.id]"
                        @change="saveQuickEdit(product)"
                      />
                    </div>
                  </div>

                  <div class="product-card__foot">
                    <span class="stock-chip" :class="`stock-chip--${stockTone(product.stockQuantity)}`">
                      Stan: {{ product.stockQuantity ?? '—' }}
                    </span>
                    <span class="product-card__slug">{{ product.slug }}</span>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </el-skeleton>
      </div>

      <div v-if="products?.totalCount" class="list-footer">
        <el-pagination
          background
          layout="prev, pager, next, total, sizes"
          :current-page="filter.pageNumber"
          :page-size="filter.pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="products.totalCount"
          @current-change="handlePageChange"
          @size-change="(s: number) => { filter.pageSize = s; filter.pageNumber = 1; syncFiltersToUrl(filter); fetchTableData() }"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.catalog-page { padding: 18px 20px 28px; min-height: 100%; background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%); }
.catalog-page__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
.catalog-page__eyebrow { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #6366f1; }
.catalog-page__title { margin: 4px 0 0; font-size: 28px; font-weight: 900; color: #0f172a; }
.catalog-page__subtitle { margin: 6px 0 0; font-size: 13px; color: #64748b; }
.catalog-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

.catalog-kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.cosmic-card { position: relative; overflow: hidden; border-radius: 18px; min-height: 130px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 16px 40px rgba(15,23,42,0.18); }
.cosmic-card--total { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%); }
.cosmic-card--published { background: linear-gradient(135deg, #042f2e 0%, #134e4a 45%, #115e59 100%); }
.cosmic-card--margin { background: linear-gradient(135deg, #7c2d12 0%, #c2410c 55%, #ea580c 100%); }
.cosmic-card--stock { background: linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #4338ca 100%); }
.cosmic-card__stars { position: absolute; inset: 0; opacity: 0.35; background-image: radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.9), transparent), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.7), transparent); pointer-events: none; }
.cosmic-card__content { position: relative; z-index: 1; padding: 14px; height: 100%; display: flex; flex-direction: column; }
.cosmic-card__head { display: flex; justify-content: space-between; }
.cosmic-card__label { font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(226,232,240,0.85); }
.cosmic-card__glyph { color: rgba(255,255,255,0.55); }
.cosmic-card__value { margin-top: 8px; font-size: 26px; font-weight: 900; color: #fff; }
.cosmic-card__value-sub { font-size: 16px; opacity: 0.7; }
.cosmic-card__foot { margin-top: 4px; font-size: 11px; color: rgba(226,232,240,0.75); }
.cosmic-card__chart { height: 40px; margin-top: auto; }
.cosmic-card__chart--donut { height: 48px; }

.filters-card, .list-card { border-radius: 18px; border: 1px solid #e2e8f0; background: rgba(255,255,255,0.94); box-shadow: 0 12px 32px rgba(15,23,42,0.05); margin-bottom: 12px; }
.filters-card__head { display: flex; justify-content: space-between; padding: 12px 16px; cursor: pointer; }
.filters-card__title { display: flex; align-items: center; gap: 8px; font-weight: 800; color: #334155; }
.filters-card__chevron { transition: transform 0.2s; }
.filters-card__chevron--open { transform: rotate(180deg); }
.filters-card__body { padding: 0 16px 16px; }
.filter-label { display: block; margin-bottom: 6px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }

.list-scroll-wrap { padding: 12px; min-height: 200px; }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }

.product-card {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
  display: flex;
  flex-direction: column;
}
.product-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 12px 28px rgba(99,102,241,0.12);
  transform: translateY(-2px);
}
.product-card--unpublished { opacity: 0.92; }
.product-card--low-margin { box-shadow: inset 0 0 0 1px rgba(249,115,22,0.25); }
.product-card--low-stock { box-shadow: inset 0 0 0 1px rgba(239,68,68,0.2); }

.product-card__img-wrap { position: relative; height: 160px; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); display: flex; align-items: center; justify-content: center; }
.product-card__img { max-width: 100%; max-height: 140px; object-fit: contain; }
.product-card__img-placeholder { font-size: 40px; opacity: 0.4; }

.product-card__badge {
  position: absolute;
  top: 8px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
}
.product-card__badge--draft { left: 8px; background: #f1f5f9; color: #64748b; }
.product-card__badge--allegro { right: 8px; background: #fff7ed; color: #c2410c; }
.product-card__badge--variants { right: 8px; top: 32px; background: #eff6ff; color: #1d4ed8; }

.product-card__body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.product-card__name { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.product-card__code { margin: 0; font-size: 11px; color: #64748b; font-family: ui-monospace, monospace; }
.product-card__brand { margin: 0; font-size: 11px; color: #475569; font-weight: 600; }

.product-card__prices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.product-card__quick { display: grid; gap: 8px; margin-top: 10px; padding: 8px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; }
.product-card__quick-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.product-card__quick-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.product-card__order-input { width: 88px; }
.product-card__order-input :deep(.el-input__inner) { text-align: center; }
.product-card__price-label { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
.product-card__price { font-size: 14px; color: #0f172a; }

.margin-chip { font-size: 13px; }
.margin-chip--good { color: #047857; }
.margin-chip--ok { color: #1d4ed8; }
.margin-chip--low { color: #b45309; }
.margin-chip--none { color: #94a3b8; }

.product-card__foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: auto; padding-top: 8px; }
.stock-chip { font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px; }
.stock-chip--ok { background: #ecfdf5; color: #047857; }
.stock-chip--low { background: #fffbeb; color: #b45309; }
.stock-chip--out { background: #fef2f2; color: #b91c1c; }
.stock-chip--unknown { background: #f1f5f9; color: #64748b; }
.product-card__slug { font-size: 10px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; }

.catalog-empty { text-align: center; padding: 48px 20px; color: #64748b; grid-column: 1 / -1; }
.catalog-empty__icon { font-size: 40px; }
.product-skel { height: 280px; border-radius: 16px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.2s infinite; }
.list-footer { display: flex; justify-content: center; padding: 12px 16px 16px; border-top: 1px solid #f1f5f9; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 1200px) { .catalog-kpi { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 760px) { .catalog-kpi { grid-template-columns: 1fr; } .product-grid { grid-template-columns: 1fr; } }
</style>
