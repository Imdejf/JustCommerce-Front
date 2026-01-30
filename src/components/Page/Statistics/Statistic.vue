<template>
  <div class="stats-page">
    <!-- Header -->
    <div class="page-header">
      <div class="title-wrap">
        <div class="title">Statystyki zamówień</div>
        <div class="subtitle">Podsumowanie sprzedaży, przychodu i produktów w wybranym okresie</div>
      </div>

      <div class="header-actions">
        <el-button type="primary" @click="fetchRaport" :loading="loading" class="btn-primary">
          Generuj
        </el-button>
        <el-button @click="resetFilters">Wyczyść</el-button>
      </div>
    </div>

    <!-- Filters (sticky) -->
    <el-card class="filters-card" shadow="never">
      <div class="filters">
<div class="filters-left">
  <div class="field">
    <div class="label">Zakres dat</div>
    <el-date-picker
      v-model="dateRange"
      type="daterange"
      range-separator="→"
      start-placeholder="Od"
      end-placeholder="Do"
      value-format="YYYY-MM-DD"
      class="control"
    />
  </div>

  <div class="field">
    <div class="label">Sklep</div>
    <el-select v-model="filters.storeId" placeholder="Wszystkie" clearable class="control" filterable>
      <el-option :value="null" label="Wszystkie" />
      <el-option
        v-for="s in stores"
        :key="s.value ?? 'all'"
        :value="s.value"
        :label="s.label"
      />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Opłacone</div>
    <el-select v-model="filters.isPaid" placeholder="Wszystkie" clearable class="control">
      <el-option :value="null" label="Wszystkie" />
      <el-option :value="true" label="Tak" />
      <el-option :value="false" label="Nie" />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Wysłane</div>
    <el-select v-model="filters.isShipped" placeholder="Wszystkie" clearable class="control">
      <el-option :value="null" label="Wszystkie" />
      <el-option :value="true" label="Tak" />
      <el-option :value="false" label="Nie" />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Dostawa</div>
    <el-select v-model="filters.deliveryMethod" placeholder="Wszystkie" clearable class="control">
      <el-option :value="null" label="Wszystkie" />
      <el-option
        v-for="o in deliveryMethodOptions"
        :key="String(o.value)"
        :value="o.value"
        :label="o.label"
      />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Płatność</div>
    <el-select v-model="filters.paymentProvider" placeholder="Wszystkie" clearable class="control">
      <el-option :value="null" label="Wszystkie" />
      <el-option
        v-for="o in paymentProviderOptions"
        :key="String(o.value)"
        :value="o.value"
        :label="o.label"
      />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Źródło</div>
    <el-select v-model="filters.orderSourceType" placeholder="Wszystkie" clearable class="control">
      <el-option :value="null" label="Wszystkie" />
      <el-option
        v-for="o in orderSourceOptions"
        :key="String(o.value)"
        :value="o.value"
        :label="o.label"
      />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Producent</div>
    <el-select v-model="filters.brandId" placeholder="Wszyscy" clearable filterable class="control">
      <el-option
        v-for="b in brands"
        :key="b.value ?? 'all'"
        :value="b.value"
        :label="b.label"
      />
    </el-select>
  </div>

  <div class="field">
    <div class="label">Produkt</div>
    <el-select v-model="filters.productId" placeholder="Wszystkie" clearable filterable class="control">
      <el-option :value="null" label="Wszystkie" />
      <el-option
        v-for="p in products"
        :key="p.value ?? 'all'"
        :value="p.value"
        :label="p.label"
      />
    </el-select>
  </div>
</div>


        <div class="filters-right">
          <el-tag type="info" effect="plain">
            {{ dateRange?.[0] ?? '—' }} → {{ dateRange?.[1] ?? '—' }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- Content -->
    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="kpis">
          <div v-for="i in 4" :key="i" class="kpi-skeleton"></div>
        </div>
        <div class="charts modern-grid">
          <div class="chart-skeleton" v-for="i in 3" :key="i"></div>
        </div>
      </template>

      <template #default>
        <!-- Empty state -->
        <el-empty
          v-if="!raport"
          description="Ustaw filtry i kliknij „Generuj”, aby zobaczyć dane."
          class="empty"
        />

        <template v-else>
          <!-- KPI -->
          <div class="kpis">
            <el-card shadow="never" class="kpi kpi-a">
              <div class="kpi-row">
                <div class="kpi-meta">
                  <div class="kpi-title">Przychód bez transportu</div>
                  <div class="kpi-value">{{ money(raport.revenueWithoutShipping) }}</div>
                </div>
                <div class="kpi-icon">₿</div>
              </div>
            </el-card>

            <el-card shadow="never" class="kpi kpi-b">
              <div class="kpi-row">
                <div class="kpi-meta">
                  <div class="kpi-title">Przychód z transportem</div>
                  <div class="kpi-value">{{ money(raport.revenueWithShipping) }}</div>
                </div>
                <div class="kpi-icon">🚚</div>
              </div>
            </el-card>

            <el-card shadow="never" class="kpi kpi-c">
              <div class="kpi-row">
                <div class="kpi-meta">
                  <div class="kpi-title">Zysk</div>
                  <div class="kpi-value">{{ money(raport.profit) }}</div>
                </div>
                <div class="kpi-icon">📈</div>
              </div>
            </el-card>

            <el-card shadow="never" class="kpi kpi-d">
              <div class="kpi-row">
                <div class="kpi-meta">
                  <div class="kpi-title">Średnia wartość zamówienia</div>
                  <div class="kpi-value">{{ money(raport.averageOrderValue) }}</div>
                </div>
                <div class="kpi-icon">🧾</div>
              </div>
            </el-card>
          </div>

          <!-- Charts -->
          <div class="modern-grid">
            <el-card shadow="never" class="panel">
              <div class="panel-head">
                <div class="panel-title">Liczba zamówień</div>
                <div class="panel-subtitle">Dzień lub miesiąc w zależności od zakresu</div>
              </div>
              <v-chart class="chart" :option="ordersCountOption" autoresize />
            </el-card>

            <el-card shadow="never" class="panel">
              <div class="panel-head">
                <div class="panel-title">Przychód</div>
                <div class="panel-subtitle">Z transportem vs bez transportu</div>
              </div>
              <v-chart class="chart" :option="revenueOption" autoresize />
            </el-card>

            <el-card shadow="never" class="panel panel-wide">
              <div class="panel-head">
                <div class="panel-title">Top produkty</div>
                <div class="panel-subtitle">Najczęściej sprzedawane (ilość)</div>
              </div>
              <v-chart class="chart" :option="topProductsOption" autoresize />
            </el-card>
          </div>

          <!-- Table -->
          <el-card shadow="never" class="panel mt-3">
            <div class="panel-head">
              <div class="panel-title">Produkty</div>
              <div class="panel-subtitle">Szczegóły sprzedaży w wybranym okresie</div>
            </div>

            <el-table
              :data="productsTable"
              stripe
              style="width: 100%"
              :default-sort="{ prop: 'profit', order: 'descending' }"
            >
              <el-table-column prop="name" label="Produkt" min-width="260" />
              <el-table-column prop="sku" label="SKU" width="140" />
              <el-table-column prop="brandName" label="Marka" width="180" />
              <el-table-column prop="quantity" label="Ilość" width="90" sortable />
              <el-table-column prop="revenueGross" label="Przychód brutto" width="160" sortable>
                <template #default="{ row }">{{ money(row.revenueGross) }}</template>
              </el-table-column>
              <el-table-column prop="cost" label="Koszt" width="140" sortable>
                <template #default="{ row }">{{ money(row.cost) }}</template>
              </el-table-column>
              <el-table-column prop="profit" label="Zysk" width="140" sortable>
                <template #default="{ row }">{{ money(row.profit) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </template>
      </template>
    </el-skeleton>
  </div>
</template>


<script setup lang="ts">
import { computed, ref } from "vue";
import VChart from "vue-echarts";
import { Api } from '/@/services/api'
import * as echarts from "echarts/core";
import { useToast } from 'vue-toastification'
import { BarChart, LineChart } from "echarts/charts";
import { onMounted } from "vue";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type OrderRaportPeriodType = "Day" | "Month" | 0 | 1;

type OrderRaportPeriodDTO = {
  period: string;
  periodType: OrderRaportPeriodType;
  ordersCount: number;
  revenueWithShipping: number;
  revenueWithoutShipping: number;
};

type OrderRaportProductDTO = {
  productId?: string | null;
  brandId?: string | null;
  name: string;
  sku?: string | null;
  brandName?: string | null;
  quantity: number;
  revenueGross: number;
  revenueNet: number;
  cost: number;
  profit: number;
};

type OrderRaportDTO = {
  revenueWithoutShipping: number;
  revenueWithShipping: number;
  profit: number;
  averageOrderValue: number;
  ordersByPeriod: OrderRaportPeriodDTO[];
  products: OrderRaportProductDTO[];
};

const loading = ref(false);
const raport = ref<OrderRaportDTO | null>(null);

const dateRange = ref<[string, string] | null>(null);
const toast = useToast()

const brands = ref<{ value: string | null; label: string }[]>([
  { value: null, label: 'Wszyscy' }
])



const filters = ref({
  storeId: null as string | null,

  isPaid: null as boolean | null,
  isShipped: null as boolean | null,

  deliveryMethod: null as number | null,
  paymentProvider: null as number | null,
  orderSourceType: null as number | null,

  productId: null as string | null,
  brandId: null as string | null,
})

const stores = ref<{ value: string | null; label: string }[]>([
  { value: null, label: "Wszystkie" },
]);

const products = ref<{ value: string | null; label: string }[]>([
  { value: null, label: "Wszystkie" },
]);

// Opcje enumów – PODMIEŃ labelki i wartości wg Twoich enumów
const deliveryMethodOptions = [
  { value: 0, label: "Kurier" },
  { value: 1, label: "Odbiór osobisty" },
];

const paymentProviderOptions = [
  { value: 0, label: "Przelew" },
  { value: 1, label: "Pobranie" },
  { value: 2, label: "Termin" },
];

const orderSourceOptions = [
  { value: 0, label: "Cart" },
  { value: 1, label: "Inne" },
];

// (opcjonalnie) jeśli masz endpointy na sklepy/produkty – podepniesz tu
const allStores = async () => {
  try {
    // const result = await Api.stores.list() // <- podmień na swój endpoint
    // stores.value = [{ value: null, label: "Wszystkie" }, ...result.items.map(x => ({value:x.id,label:x.name}))]

    stores.value = [{ value: null, label: "Wszystkie" }]; // placeholder
  } catch (e) {
    console.error("Błąd podczas pobierania sklepów:", e);
  }
};

const allProducts = async () => {
  try {
    // const result = await Api.products.listByStoreId(...) // <- podmień
    // products.value = [{ value: null, label: "Wszystkie" }, ...result.items.map(x => ({value:x.id,label:x.name}))]

    products.value = [{ value: null, label: "Wszystkie" }]; // placeholder
  } catch (e) {
    console.error("Błąd podczas pobierania produktów:", e);
  }
};


const allBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Wszyscy' },
      ...result.items.map((item: any) => ({
        value: item.id,
        label: item.name
      }))
    ]
  } catch (error) {
    console.error('Błąd podczas pobierania producentów:', error)
  }
}


function resetFilters() {
  dateRange.value = null;

  filters.value.storeId = null;
  filters.value.isPaid = null;
  filters.value.isShipped = null;

  filters.value.deliveryMethod = null;
  filters.value.paymentProvider = null;
  filters.value.orderSourceType = null;

  filters.value.productId = null;
  filters.value.brandId = null;

  raport.value = null;
}

function money(v?: number | null) {
  const value = Number(v ?? 0);
  return value.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}

function formatPeriodLabel(iso: string) {
  const d = new Date(iso);
  // dzień/miesiąc zależy od tego co backend zwraca jako Period (dzień lub 1 dzień miesiąca)
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return dd === "01" ? `${yyyy}-${mm}` : `${yyyy}-${mm}-${dd}`;
}

const periods = computed(() => raport.value?.ordersByPeriod ?? []);

const ordersCountOption = computed(() => {
  const x = periods.value.map(p => formatPeriodLabel(p.period));
  const y = periods.value.map(p => p.ordersCount);

  return {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    dataZoom: [{ type: "inside" }, { type: "slider" }],
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: y, name: "Zamówienia" }],
  };
});

const revenueOption = computed(() => {
  const x = periods.value.map(p => formatPeriodLabel(p.period));
  const withShipping = periods.value.map(p => p.revenueWithShipping);
  const withoutShipping = periods.value.map(p => p.revenueWithoutShipping);

  return {
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    dataZoom: [{ type: "inside" }, { type: "slider" }],
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [
      { type: "line", data: withShipping, name: "Z transportem" },
      { type: "line", data: withoutShipping, name: "Bez transportu" },
    ],
  };
});

const productsTable = computed(() => raport.value?.products ?? []);

const topProductsOption = computed(() => {
  const top = [...(raport.value?.products ?? [])]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    tooltip: { trigger: "axis" },
    grid: { left: 40, right: 20, top: 30, bottom: 80 },
    xAxis: {
      type: "category",
      data: top.map(x => x.name),
      axisLabel: { rotate: 35 },
    },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: top.map(x => x.quantity), name: "Ilość" }],
  };
});

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function fetchRaport() {
  loading.value = true;
  try {
    const defaultTo = new Date();
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultTo.getDate() - 30);

    const from = dateRange.value?.[0] ?? toYmd(defaultFrom);
    const to = dateRange.value?.[1] ?? toYmd(defaultTo);

    const query = {
      from,
      to,
      storeId: filters.value.storeId,
      isPaid: filters.value.isPaid,
      isShipped: filters.value.isShipped,
      deliveryMethod: filters.value.deliveryMethod,
      paymentProvider: filters.value.paymentProvider,
      orderSourceType: filters.value.orderSourceType,
      productId: filters.value.productId,
      brandId: filters.value.brandId,
    };

    const data = await Api.orders.getOrderRaport(query);
    raport.value = data as OrderRaportDTO;
  } catch (e: any) {
    console.error(e);
    toast.error("Nie udało się pobrać raportu zamówień.");
    raport.value = null;
  } finally {
    loading.value = false;
  }
}


onMounted(() => {
  allBrands();
  allStores();
  allProducts();
});
</script>

<style scoped>
.stats-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px;
}

.filters-left {
  max-width: 100%;
}

.control {
  min-width: 200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
  padding: 6px 2px;
}

.title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.subtitle {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.7;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-primary {
  border-radius: 12px;
}

/* Filters */
.filters-card {
  position: sticky;
  top: 0;
  z-index: 5;
  backdrop-filter: blur(8px);
}

.filters {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filters-left {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.filters-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.field .label {
  font-size: 12px;
  opacity: 0.75;
  margin-bottom: 6px;
}

.control {
  min-width: 210px;
}

/* KPI */
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(210px, 1fr));
  gap: 12px;
}

.kpi {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.kpi-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.kpi-title {
  font-size: 12px;
  opacity: 0.75;
}

.kpi-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 18px;
  background: rgba(0,0,0,0.04);
}

/* delikatne tła (bez kolorów “na sztywno”) */
.kpi-a { background: var(--el-fill-color-lighter); }
.kpi-b { background: var(--el-fill-color-light); }
.kpi-c { background: var(--el-fill-color-lighter); }
.kpi-d { background: var(--el-fill-color-light); }

/* Panels */
.modern-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.panel {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.panel-wide {
  grid-column: 1 / -1;
}

.panel-head {
  margin-bottom: 8px;
}

.panel-title {
  font-weight: 800;
  letter-spacing: -0.02em;
}

.panel-subtitle {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.7;
}

.chart {
  width: 100%;
  height: 320px;
}

.mt-3 { margin-top: 12px; }

/* Skeleton */
.kpi-skeleton {
  height: 92px;
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.chart-skeleton {
  height: 360px;
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.empty {
  margin-top: 12px;
}

/* Responsive */
@media (max-width: 1100px) {
  .kpis { grid-template-columns: repeat(2, minmax(210px, 1fr)); }
  .modern-grid { grid-template-columns: 1fr; }
  .panel-wide { grid-column: auto; }
  .control { min-width: 180px; }
}

@media (max-width: 600px) {
  .kpis { grid-template-columns: 1fr; }
  .header-actions { width: 100%; justify-content: flex-end; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .control { width: 100%; min-width: 0; }
}
</style>
