<template>
  <div class="dash">
    <!-- Header -->
    <div class="dash-header">
      <div>
        <div class="dash-title">Dashboard</div>
        <div class="dash-subtitle">Szybki podgląd sprzedaży i trendów</div>
      </div>

      <div class="dash-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="→"
          start-placeholder="Od"
          end-placeholder="Do"
          value-format="YYYY-MM-DD"
          class="date"
        />
        <el-button type="primary" :loading="loading" @click="loadDashboard">Odśwież</el-button>
      </div>
    </div>

    <el-skeleton :loading="loading" animated>
      <template #template>
        <div class="grid-kpi">
          <div v-for="i in 4" :key="i" class="skel skel-kpi"></div>
        </div>
        <div class="grid-main">
          <div class="skel skel-panel"></div>
          <div class="skel skel-panel"></div>
        </div>
        <div class="grid-bottom">
          <div class="skel skel-panel"></div>
          <div class="skel skel-panel"></div>
        </div>
      </template>

      <template #default>
        <!-- KPI -->
        <div class="grid-kpi">
          <el-card shadow="never" class="kpi">
            <div class="kpi-label">Przychód (z transportem)</div>
            <div class="kpi-value">{{ money(kpi.revenueWithShipping) }}</div>

            <div class="kpi-foot">
              <span class="muted">zamówień</span>
              <div class="right">
                <span class="pill">{{ kpi.ordersCount }}</span>
                <span class="pill delta" :class="deltaClass(delta.revenueWithShippingPct)">
                  {{ deltaBadge(delta.revenueWithShippingPct) }}
                </span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="kpi">
            <div class="kpi-label">Przychód (bez transportu)</div>
            <div class="kpi-value">{{ money(kpi.revenueWithoutShipping) }}</div>

            <div class="kpi-foot">
              <span class="muted">AOV</span>
              <div class="right">
                <span class="pill">{{ money(kpi.aov) }}</span>
                <span class="pill delta" :class="deltaClass(delta.averageOrderValuePct)">
                  {{ deltaBadge(delta.averageOrderValuePct) }}
                </span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="kpi">
            <div class="kpi-label">Zysk</div>
            <div class="kpi-value">{{ money(kpi.profit) }}</div>

            <div class="kpi-foot">
              <span class="muted">marża</span>
              <div class="right">
                <span class="pill">{{ percent(kpi.marginPct) }}</span>
                <span class="pill delta" :class="deltaClass(delta.profitPct)">
                  {{ deltaBadge(delta.profitPct) }}
                </span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="kpi">
            <div class="kpi-label">Wysłane / niewysłane</div>
            <div class="kpi-value">{{ kpi.shippedCount }} / {{ kpi.notShippedCount }}</div>

            <div class="kpi-foot">
              <span class="muted">opłacone</span>
              <div class="right">
                <span class="pill">{{ kpi.paidCount }}</span>
                <span class="pill delta" :class="deltaClass(delta.ordersCountPct)">
                  {{ deltaBadge(delta.ordersCountPct) }}
                </span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Charts -->
        <div class="grid-main">
          <el-card shadow="never" class="panel">
            <div class="panel-head">
              <div>
                <div class="panel-title">Trend zamówień</div>
                <div class="panel-subtitle">Bieżący okres vs poprzedni (taki sam zakres)</div>
              </div>
              <el-tag type="info" effect="plain">{{ rangeLabel }}</el-tag>
            </div>
            <v-chart class="chart" :option="ordersTrendOption" autoresize />
          </el-card>

          <el-card shadow="never" class="panel">
            <div class="panel-head">
              <div>
                <div class="panel-title">Przychód</div>
                <div class="panel-subtitle">Z transportem (porównanie do poprzedniego)</div>
              </div>
            </div>
            <v-chart class="chart" :option="revenueOption" autoresize />
          </el-card>
        </div>

        <div class="grid-bottom">
          <el-card shadow="never" class="panel">
            <div class="panel-head">
              <div>
                <div class="panel-title">Rozkład płatności</div>
                <div class="panel-subtitle">PaymentProvider (bieżący okres)</div>
              </div>
            </div>
            <v-chart class="chart donut" :option="paymentDonutOption" autoresize />
          </el-card>

          <el-card shadow="never" class="panel">
            <div class="panel-head">
              <div>
                <div class="panel-title">Top produkty</div>
                <div class="panel-subtitle">Najczęściej sprzedawane (bieżący okres)</div>
              </div>
            </div>

            <el-table :data="topProducts" stripe style="width:100%">
              <el-table-column prop="name" label="Produkt" min-width="220" />
              <el-table-column prop="qty" label="Ilość" width="90" sortable />
              <el-table-column prop="profit" label="Zysk" width="140" sortable>
                <template #default="{ row }">{{ money(row.profit) }}</template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import VChart from "vue-echarts";
import * as echarts from "echarts/core";
import { Api } from "/@/services/api";
import Cookies from "universal-cookie";

import { BarChart, LineChart, PieChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

/** ===== Cookies / StoreId ===== */
const cookies = new Cookies();
const storeId = ref<string | null>(cookies.get("dsStore") ?? null);

/** ===== Types (nowy DTO z porównaniem) ===== */
type OrderDashboardPeriodDTO = {
  period: string;
  ordersCount: number;
  revenueWithShipping: number;
  revenueWithoutShipping: number;
  profit: number;
};

type OrderDashboardBreakdownDTO = {
  key: number;
  name: string;
  count: number;
  revenue: number;
};

type OrderDashboardTopProductDTO = {
  productId?: string | null;
  brandId?: string | null;
  name: string;
  sku?: string | null;
  brandName?: string | null;
  quantity: number;
  revenueGross: number;
  profit: number;
};

type OrderDashboardKpiDTO = {
  ordersCount: number;
  paidCount: number;
  shippedCount: number;
  revenueWithShipping: number;
  revenueWithoutShipping: number;
  profit: number;
  averageOrderValue: number;
};

type OrderDashboardDeltaDTO = {
  ordersCount: number;
  paidCount: number;
  shippedCount: number;
  revenueWithShipping: number;
  revenueWithoutShipping: number;
  profit: number;
  averageOrderValue: number;

  ordersCountPct: number;
  revenueWithShippingPct: number;
  profitPct: number;

  // UWAGA: tego w backendzie nie było wprost, ale przydaje się w UI
  // jeśli nie dodasz w backendzie, policzymy na froncie:
  averageOrderValuePct?: number;
};

type OrderDashboardDTO = {
  ordersCount: number;
  paidCount: number;
  shippedCount: number;

  revenueWithShipping: number;
  revenueWithoutShipping: number;
  profit: number;
  averageOrderValue: number;

  periodType: number | string;
  trend: OrderDashboardPeriodDTO[];
  trendPrevious: OrderDashboardPeriodDTO[];

  previous: OrderDashboardKpiDTO;
  delta: OrderDashboardDeltaDTO;

  paymentBreakdown: OrderDashboardBreakdownDTO[];
  topProducts: OrderDashboardTopProductDTO[];
};

/** ===== State ===== */
const loading = ref(false);
const dateRange = ref<[string, string] | null>(null);

type KPI = {
  revenueWithShipping: number;
  revenueWithoutShipping: number;
  profit: number;
  marginPct: number;
  aov: number;
  ordersCount: number;
  shippedCount: number;
  notShippedCount: number;
  paidCount: number;
};

const kpi = ref<KPI>({
  revenueWithShipping: 0,
  revenueWithoutShipping: 0,
  profit: 0,
  marginPct: 0,
  aov: 0,
  ordersCount: 0,
  shippedCount: 0,
  notShippedCount: 0,
  paidCount: 0,
});

const delta = ref<OrderDashboardDeltaDTO>({
  ordersCount: 0,
  paidCount: 0,
  shippedCount: 0,
  revenueWithShipping: 0,
  revenueWithoutShipping: 0,
  profit: 0,
  averageOrderValue: 0,
  ordersCountPct: 0,
  revenueWithShippingPct: 0,
  profitPct: 0,
  averageOrderValuePct: 0,
});

const periodsCurrent = ref<{ label: string; ordersCount: number; revWith: number }[]>([]);
const periodsPrev = ref<{ label: string; ordersCount: number; revWith: number }[]>([]);
const paymentBreakdown = ref<{ name: string; value: number }[]>([]);
const topProducts = ref<{ name: string; qty: number; profit: number }[]>([]);

/** ===== Helpers ===== */
function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const rangeLabel = computed(() => `${dateRange.value?.[0] ?? "—"} → ${dateRange.value?.[1] ?? "—"}`);

function money(v: number) {
  return Number(v ?? 0).toLocaleString("pl-PL", { style: "currency", currency: "PLN" });
}
function percent(v: number) {
  return `${Number(v ?? 0).toFixed(1)}%`;
}

function periodLabel(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return dd === "01" ? `${yyyy}-${mm}` : `${yyyy}-${mm}-${dd}`;
}

function isGuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)
  );
}

function pct(cur: number, prev: number) {
  if (!prev) return cur ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

function deltaClass(v: number) {
  if (v > 0.0001) return "up";
  if (v < -0.0001) return "down";
  return "flat";
}

function deltaBadge(v: number) {
  const sign = v > 0.0001 ? "↑" : v < -0.0001 ? "↓" : "•";
  return `${sign} ${percent(Math.abs(v))}`;
}

/** ===== Backend call ===== */
async function loadDashboard() {
  loading.value = true;
  try {
    storeId.value = cookies.get("dsStore") ?? null;

    // default 30 dni
    if (!dateRange.value) {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30);
      dateRange.value = [toYmd(from), toYmd(to)];
    }

    const from = dateRange.value[0];
    const to = dateRange.value[1];

    const query: any = {
      from,
      to,
      takeRecent: 10,
      takeTopProducts: 10,
    };

    if (storeId.value && isGuid(storeId.value)) query.storeId = storeId.value;

    // ✅ pobranie
    const data = (await Api.orders.getOrderDashboard(query)) as OrderDashboardDTO;

    // KPI current
    const revWith = Number(data.revenueWithShipping ?? 0);
    const revWithout = Number(data.revenueWithoutShipping ?? 0);
    const prof = Number(data.profit ?? 0);

    const ordersCount = Number(data.ordersCount ?? 0);
    const shippedCount = Number(data.shippedCount ?? 0);

    kpi.value = {
      revenueWithShipping: revWith,
      revenueWithoutShipping: revWithout,
      profit: prof,
      marginPct: revWithout > 0 ? (prof / revWithout) * 100 : 0,
      aov: Number(data.averageOrderValue ?? 0),
      ordersCount,
      shippedCount,
      notShippedCount: Math.max(ordersCount - shippedCount, 0),
      paidCount: Number(data.paidCount ?? 0),
    };

    // Delta (z backu) + dociągamy AOV% jeśli backend nie zwraca
    const d = data.delta ?? ({} as OrderDashboardDeltaDTO);
    const prevAov = Number(data.previous?.averageOrderValue ?? 0);
    const curAov = Number(data.averageOrderValue ?? 0);

    delta.value = {
      ...d,
      averageOrderValuePct: typeof d.averageOrderValuePct === "number" ? d.averageOrderValuePct : pct(curAov, prevAov),
    };

    // Trend current / previous -> pod wykresy (porównanie)
    periodsCurrent.value = (data.trend ?? []).map((t) => ({
      label: periodLabel(t.period),
      ordersCount: Number(t.ordersCount ?? 0),
      revWith: Number(t.revenueWithShipping ?? 0),
    }));

    periodsPrev.value = (data.trendPrevious ?? []).map((t) => ({
      label: periodLabel(t.period),
      ordersCount: Number(t.ordersCount ?? 0),
      revWith: Number(t.revenueWithShipping ?? 0),
    }));

    // Donut (current)
    paymentBreakdown.value = (data.paymentBreakdown ?? []).map((x) => ({
      name: x.name,
      value: Number(x.count ?? 0),
    }));

    // Top products (current)
    topProducts.value = (data.topProducts ?? []).map((p) => ({
      name: p.name,
      qty: Number(p.quantity ?? 0),
      profit: Number(p.profit ?? 0),
    }));
  } catch (err) {
    console.error("OrderDashboard error:", err);

    kpi.value = {
      revenueWithShipping: 0,
      revenueWithoutShipping: 0,
      profit: 0,
      marginPct: 0,
      aov: 0,
      ordersCount: 0,
      shippedCount: 0,
      notShippedCount: 0,
      paidCount: 0,
    };
    delta.value = {
      ordersCount: 0,
      paidCount: 0,
      shippedCount: 0,
      revenueWithShipping: 0,
      revenueWithoutShipping: 0,
      profit: 0,
      averageOrderValue: 0,
      ordersCountPct: 0,
      revenueWithShippingPct: 0,
      profitPct: 0,
      averageOrderValuePct: 0,
    };
    periodsCurrent.value = [];
    periodsPrev.value = [];
    paymentBreakdown.value = [];
    topProducts.value = [];
  } finally {
    loading.value = false;
  }
}

/** ===== ECharts options (CURRENT vs PREVIOUS) ===== */
const ordersTrendOption = computed(() => {
  // bazujemy na osi current (najczęściej ma tę samą liczbę punktów co previous)
  const x = periodsCurrent.value.map((p) => p.label);

  const yCur = periodsCurrent.value.map((p) => p.ordersCount);

  // dopasowanie previous do tej samej osi: po indeksie (bo to ten sam zakres długości)
  const yPrev = x.map((_, idx) => periodsPrev.value[idx]?.ordersCount ?? 0);

  return {
    tooltip: { trigger: "axis" },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    dataZoom: [{ type: "inside" }, { type: "slider" }],
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [
      { type: "bar", name: "Bieżący", data: yCur },
      { type: "line", name: "Poprzedni", data: yPrev },
    ],
  };
});

const revenueOption = computed(() => {
  const x = periodsCurrent.value.map((p) => p.label);
  const cur = periodsCurrent.value.map((p) => p.revWith);
  const prev = x.map((_, idx) => periodsPrev.value[idx]?.revWith ?? 0);

  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: (val: any) => money(Number(val)),
    },
    legend: { top: 0 },
    grid: { left: 40, right: 20, top: 40, bottom: 40 },
    dataZoom: [{ type: "inside" }, { type: "slider" }],
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [
      { type: "line", name: "Bieżący", data: cur },
      { type: "line", name: "Poprzedni", data: prev },
    ],
  };
});

const paymentDonutOption = computed(() => {
  return {
    tooltip: { trigger: "item" },
    legend: { top: 0 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 10, borderWidth: 2, borderColor: "#fff" },
        label: { show: false },
        emphasis: { label: { show: true, fontWeight: "bold" } },
        labelLine: { show: false },
        data: paymentBreakdown.value,
      },
    ],
  };
});

onMounted(loadDashboard);
</script>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 6px;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-end;
}

.dash-title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.dash-subtitle {
  margin-top: 4px;
  font-size: 13px;
  opacity: 0.7;
}

.dash-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.date { min-width: 260px; }

.grid-kpi {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 12px;
}

.kpi {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.kpi-label {
  font-size: 12px;
  opacity: 0.75;
  font-weight: 700;
}

.kpi-value {
  margin-top: 10px;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.kpi-foot {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.right { display: flex; gap: 8px; align-items: center; }

.muted { opacity: 0.7; font-size: 12px; }

.pill {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
}

.pill.delta {
  font-weight: 800;
}

.pill.delta.up {
  border-color: rgba(0, 160, 90, 0.35);
}
.pill.delta.down {
  border-color: rgba(220, 60, 60, 0.35);
}
.pill.delta.flat {
  opacity: 0.75;
}

.grid-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.grid-bottom {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 12px;
}

.panel {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.panel-title { font-weight: 900; letter-spacing: -0.02em; }
.panel-subtitle { margin-top: 2px; font-size: 12px; opacity: 0.7; }

.chart { width: 100%; height: 320px; }
.donut { height: 320px; }

/* Skeleton */
.skel {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}
.skel-kpi { height: 110px; }
.skel-panel { height: 320px; }

/* Responsive */
@media (max-width: 1200px) {
  .grid-kpi { grid-template-columns: repeat(2, minmax(220px, 1fr)); }
  .grid-main, .grid-bottom { grid-template-columns: 1fr; }
  .date { min-width: 220px; }
}
@media (max-width: 600px) {
  .grid-kpi { grid-template-columns: 1fr; }
  .dash-header { flex-direction: column; align-items: flex-start; }
  .dash-actions { width: 100%; justify-content: flex-end; flex-wrap: wrap; }
  .date { width: 100%; min-width: 0; }
}
</style>
