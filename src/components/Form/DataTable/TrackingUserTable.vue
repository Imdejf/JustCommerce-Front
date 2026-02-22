<template>
  <div class="p-4 h-full">
    <!-- HEADER CARD -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <!-- Top bar -->
      <div class="px-4 py-3 border-b border-slate-200 flex flex-col gap-3">
        <div class="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
          <div class="min-w-0">
            <div class="text-lg font-semibold text-slate-900">Śledzenie użytkowników</div>
            <div class="text-xs text-slate-500">
              Podgląd aktywności (tracking), online presence oraz koszyków w czasie rzeczywistym.
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap justify-end">
            <div class="text-[11px] text-slate-500">
              Auto-refresh:
              <span class="font-semibold text-slate-800">{{ autoRefreshEnabled ? 'ON' : 'OFF' }}</span>
              <span v-if="autoRefreshEnabled" class="ml-2">({{ countdown }}s)</span>
            </div>
            <el-switch v-model="autoRefreshEnabled" size="small" />
            <el-button size="small" @click="refreshNow" :loading="loading">
              Odśwież teraz
            </el-button>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-col lg:flex-row lg:items-center gap-3">
          <!-- Search -->
          <el-input
            v-model="search"
            clearable
            class="lg:!w-[360px]"
            placeholder="Szukaj: email / username / userId"
            @keyup.enter="applySearch"
            @clear="applySearch"
          >
            <template #prefix>
              <span class="text-slate-400">⌕</span>
            </template>
          </el-input>

          <!-- Filter chips -->
          <div class="flex items-center gap-2 flex-wrap">
            <button
              class="chip"
              :class="filterMode === 'all' ? 'chip--active' : ''"
              @click="setMode('all')"
            >
              Wszyscy
              <span class="chip__count">{{ meta.total }}</span>
            </button>

            <button
              class="chip"
              :class="filterMode === 'online' ? 'chip--active' : ''"
              @click="setMode('online')"
            >
              Online
              <span class="chip__count">{{ meta.online }}</span>
            </button>

            <button
              class="chip"
              :class="filterMode === 'cart' ? 'chip--active' : ''"
              @click="setMode('cart')"
            >
              Z koszykiem
              <span class="chip__count">{{ meta.withCart }}</span>
            </button>

            <div class="h-6 w-px bg-slate-200 mx-1"></div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">Ostatnie:</span>
              <el-select
                v-model="activityWindowMinutes"
                size="small"
                class="!w-[160px]"
                @change="refreshNow"
              >
                <el-option :value="0" label="bez limitu" />
                <el-option :value="5" label="5 minut" />
                <el-option :value="15" label="15 minut" />
                <el-option :value="60" label="1 godz." />
                <el-option :value="1440" label="24 godz." />
              </el-select>
            </div>

            <div class="h-6 w-px bg-slate-200 mx-1"></div>

            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">Sort:</span>
              <el-select v-model="sortMode" size="small" class="!w-[190px]" @change="refreshNow">
                <el-option value="lastActivityDesc" label="Ostatnia aktywność ↓" />
                <el-option value="trackingsDesc" label="Najwięcej trackingów ↓" />
                <el-option value="cartsDesc" label="Najwięcej koszyków ↓" />
                <el-option value="createdDesc" label="Najnowsi użytkownicy ↓" />
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="px-4 py-3">
        <el-table
          :data="rows"
          v-loading="loading"
          row-key="userId"
          class="modern-table"
          :border="false"
          @row-click="openDetails"
          height="68vh"
        >
          <!-- User -->
          <el-table-column label="Użytkownik" min-width="240">
            <template #default="{ row }">
              <div class="flex items-center gap-3 min-w-0">
                <div class="avatar">
                  {{ initials(row.username ?? row.email ?? 'U') }}
                </div>

                <div class="min-w-0">
                  <div class="flex items-center gap-2 min-w-0">
                    <div class="font-semibold text-slate-900 truncate">
                      {{ row.username ?? '—' }}
                    </div>

                    <span
                      class="badge"
                      :class="isOnline(row) ? 'badge--online' : 'badge--offline'"
                      title="Online presence"
                    >
                      {{ isOnline(row) ? 'ONLINE' : 'OFFLINE' }}
                    </span>

                    <span v-if="row.hasShoppingCartItems" class="badge badge--cart" title="Ma koszyk">
                      CART
                    </span>
                  </div>

                  <div class="text-xs text-slate-500 truncate">
                    {{ row.email ?? '—' }}
                  </div>

                  <div class="text-[11px] text-slate-400 truncate font-mono">
                    {{ row.userId }}
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Activity -->
          <el-table-column label="Aktywność" width="220">
            <template #default="{ row }">
              <div class="space-y-1">
                <div class="text-xs text-slate-900">
                  <span class="text-slate-500">Ostatnio:</span>
                  <span class="font-semibold">{{ formatDateSmart(row.dateLastActivity ?? row.dateLastLogin ?? row.dateCreated) }}</span>
                </div>
                <div class="text-[11px] text-slate-500">
                  IP:
                  <span class="font-mono">{{ row.lastIpAddress ?? '—' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Metrics -->
          <el-table-column label="Metryki" min-width="250">
            <template #default="{ row }">
              <div class="grid grid-cols-3 gap-2">
                <div class="metric">
                  <div class="metric__label">Ścieżki</div>
                  <div class="metric__value">{{ row.trackings?.length ?? 0 }}</div>
                </div>
                <div class="metric">
                  <div class="metric__label">Koszyki</div>
                  <div class="metric__value">{{ row.carts?.length ?? 0 }}</div>
                </div>
                <div class="metric">
                  <div class="metric__label">Produkty</div>
                  <div class="metric__value">{{ totalCartQty(row) }}</div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- Status -->
          <el-table-column label="Status" width="200">
            <template #default="{ row }">
              <div class="flex flex-col gap-1">
                <span class="status" :class="row.active ? 'status--ok' : 'status--warn'">
                  {{ row.carts?.some(c => c.isActive ?? c.IsActive) ? 'Aktywny' : 'Nieaktywny' }}
                </span>
                <span class="status" :class="row.deleted ? 'status--bad' : 'status--muted'">
                  {{ row.deleted ? 'Usunięty' : 'OK' }}
                </span>
              </div>
            </template>
          </el-table-column>

          <!-- Actions -->
          <el-table-column label="" width="120" align="right" fixed="right">
            <template #default="{ row }">
              <div class="flex justify-end gap-2">
                <el-button size="small" @click.stop="copy(row.userId)">ID</el-button>
                <el-button size="small" type="primary" @click.stop="copy(row.email)">Email</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="pt-3 flex items-center justify-between">
          <div class="text-xs text-slate-500">
            Strona <b>{{ pageNumber }}</b> • rozmiar <b>{{ pageSize }}</b> • łącznie <b>{{ totalCount }}</b>
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

    <!-- DETAILS DRAWER -->
    <el-drawer
      v-model="drawerOpen"
      size="520px"
      :with-header="false"
    >
      <div class="p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-base font-semibold text-slate-900 truncate">
              {{ selected?.username ?? selected?.email ?? 'Użytkownik' }}
            </div>
            <div class="text-xs text-slate-500 truncate">
              {{ selected?.email ?? '—' }}
            </div>
            <div class="text-[11px] text-slate-400 font-mono truncate">
              {{ selected?.userId ?? '—' }}
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="badge" :class="isOnline(selected) ? 'badge--online' : 'badge--offline'">
              {{ isOnline(selected) ? 'ONLINE' : 'OFFLINE' }}
            </span>
            <el-button size="small" @click="drawerOpen = false">Zamknij</el-button>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2">
          <div class="kpi">
            <div class="kpi__label">Ścieżki</div>
            <div class="kpi__value">{{ selected?.trackings?.length ?? 0 }}</div>
          </div>
          <div class="kpi">
            <div class="kpi__label">Koszyki</div>
            <div class="kpi__value">{{ selected?.carts?.length ?? 0 }}</div>
          </div>
          <div class="kpi">
            <div class="kpi__label">Produkty</div>
            <div class="kpi__value">{{ totalCartQty(selected) }}</div>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <!-- Timeline -->
          <div class="section">
            <div class="section__title">Oś czasu (ścieżki)</div>

            <div v-if="!selected?.trackings?.length" class="empty">
              Brak trackingów.
            </div>

            <div v-else class="timeline">
              <div
                v-for="t in selected.trackings"
                :key="t.trackingId"
                class="timeline__item"
              >
                <div class="timeline__dot"></div>
                <div class="timeline__body">
                  <div class="timeline__top">
                    <span class="timeline__time">{{ formatDateSmart(t.occurredOnUtc) }}</span>
                    <span class="timeline__sid">SID: {{ t.sessionId }}</span>
                  </div>
                  <div class="timeline__path">
                    <span class="font-mono text-[11px]">{{ t.path }}</span>
                  </div>
                  <div v-if="t.referrer" class="timeline__meta">
                    Ref: {{ t.referrer }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carts -->
          <div class="section">
            <div class="section__title">Koszyki</div>

            <div v-if="!selected?.carts?.length" class="empty">
              Brak koszyków.
            </div>

            <div v-else class="space-y-2">
              <div v-for="c in selected.carts" :key="c.cartId" class="cartCard">
                <div class="flex items-center justify-between gap-2">
                  <div class="text-xs font-semibold text-slate-800 truncate">
                    Cart <span class="font-mono text-[11px] text-slate-500">{{ c.cartId }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="pill" :class="c.isActive ? 'pill--green' : 'pill--gray'">
                      {{ c.isActive ? 'AKTYWNY' : 'NIEAKTYWNY' }}
                    </span>
                    <span class="pill" :class="c.lockedOnCheckout ? 'pill--orange' : 'pill--gray'">
                      {{ c.lockedOnCheckout ? 'LOCK' : 'OK' }}
                    </span>
                  </div>
                </div>

                <div class="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Utw: <b>{{ formatDateSmart(c.createdOn) }}</b></span>
                  <span>Upd: <b>{{ formatDateSmart(c.latestUpdatedOn) }}</b></span>
                  <span>Pozycji: <b>{{ c.itemsCount }}</b></span>
                  <span>Qty: <b>{{ c.totalQuantity }}</b></span>
                  <span v-if="c.couponCode">Kupon: <b>{{ c.couponCode }}</b></span>
                </div>

                <div class="mt-2">
                  <div class="text-xs font-semibold text-slate-700 mb-1">Pozycje</div>
                  <div v-if="!c.items?.length" class="text-[11px] text-slate-400">Brak pozycji.</div>

                  <div v-else class="space-y-1">
                    <div v-for="it in c.items" :key="it.id" class="cartItem">
                      <div class="min-w-0">
                        <div class="text-xs truncate">
                          <span class="font-semibold">{{ it.productName ?? '—' }}</span>
                          <span class="ml-2 text-[11px] text-slate-400 font-mono">{{ it.productId }}</span>
                        </div>
                        <div class="text-[11px] text-slate-500">
                          {{ formatDateSmart(it.createdOn) }}
                        </div>
                      </div>
                      <div class="text-xs font-bold text-slate-900">
                        × {{ it.quantity }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Cookies from 'universal-cookie'
import { useToast } from 'vue-toastification'
import { Api } from '/@/services/api'

type Mode = 'all' | 'online' | 'cart'
type SortMode = 'lastActivityDesc' | 'trackingsDesc' | 'cartsDesc' | 'createdDesc'

const toast = useToast()
const cookies = new Cookies()

const loading = ref(false)

const filterMode = ref<Mode>('all')
const sortMode = ref<SortMode>('lastActivityDesc')
const activityWindowMinutes = ref<number>(0)

const search = ref('')
const pageNumber = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

const rows = ref<any[]>([])

const meta = ref({ total: 0, online: 0, withCart: 0 })

const onlineUsers = ref<any[]>([])

const drawerOpen = ref(false)
const selected = ref<any | null>(null)

const autoRefreshEnabled = ref(true)
const countdown = ref(60)
let refreshTimer: any = null
let countdownTimer: any = null

const storeId = cookies.get('dsStore')

const buildFilter = () => {
  const predicate = {
    UserId: null,
    Email: null,
    Username: null,
    Active: null,
    Deleted: null,
    HasShoppingCartItems: null,
    Path: null,
    DateCreated: null,
    DateLastLogin: null
  }

  const s = (search.value ?? '').trim()
  if (s) {
    if (/^[0-9a-fA-F-]{32,36}$/.test(s)) predicate.UserId = s
    else {
      predicate.Email = s
      predicate.Username = s
    }
  }

  if (filterMode.value === 'cart') predicate.HasShoppingCartItems = true

  return {
    StoreId: storeId,
    PageNumber: pageNumber.value,
    PageSize: pageSize.value,
    SmartTableParam: {
      Search: {
        PredicateObject: predicate
      }
    }
  }
}

const isOnline = (row: any) => {
  if (!row?.userId) return false
  const uid = String(row.userId).toLowerCase()

  return (onlineUsers.value ?? []).some((x: any) => {
    const xuid = String(x?.userId ?? x?.UserId ?? '').toLowerCase()
    return xuid === uid
  })
}

const totalCartQty = (row: any) => {
  if (!row?.carts?.length) return 0
  return row.carts.reduce((sum: number, c: any) => sum + (Number(c.totalQuantity ?? 0) || 0), 0)
}

const initials = (s: string) => {
  const str = (s ?? '').trim()
  if (!str) return 'U'
  const parts = str.split(/\s+/).filter(Boolean)
  const a = parts[0]?.[0] ?? 'U'
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (str[1] ?? '')
  return (a + b).toUpperCase()
}

const formatDateSmart = (d: any) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  } as any)
}

const copy = async (text: any) => {
  try {
    await navigator.clipboard.writeText(String(text ?? ''))
    toast.success('Skopiowano')
  } catch {
    toast.warning('Nie udało się skopiować')
  }
}

const fetchOnline = async () => {
  try {
    const res = await Api.tracking.getOnline()
    const list = Array.isArray(res) ? res : (res?.data ?? res ?? [])
    onlineUsers.value = list
  } catch (e) {
    console.warn('online failed', e)
    onlineUsers.value = []
  }
}

const applyClientFiltersAndSort = (items: any[]) => {
  let out = [...(items ?? [])]

  // online mode -> filtr client-side
  if (filterMode.value === 'online') {
    out = out.filter((u) => isOnline(u))
  }

  // window (ostatnie X minut) -> filtr po last activity
  if (activityWindowMinutes.value && activityWindowMinutes.value > 0) {
    const minTs = Date.now() - activityWindowMinutes.value * 60_000
    out = out.filter((u: any) => {
      const t = u?.dateLastActivity ?? u?.dateLastLogin ?? u?.dateCreated
      const dt = new Date(t)
      return !isNaN(dt.getTime()) && dt.getTime() >= minTs
    })
  }

  // sorty
  const getLast = (u: any) => {
    const t = u?.dateLastActivity ?? u?.dateLastLogin ?? u?.dateCreated
    const dt = new Date(t)
    return isNaN(dt.getTime()) ? 0 : dt.getTime()
  }

  if (sortMode.value === 'lastActivityDesc') out.sort((a, b) => getLast(b) - getLast(a))
  if (sortMode.value === 'trackingsDesc') out.sort((a, b) => (b?.trackings?.length ?? 0) - (a?.trackings?.length ?? 0))
  if (sortMode.value === 'cartsDesc') out.sort((a, b) => (b?.carts?.length ?? 0) - (a?.carts?.length ?? 0))
  if (sortMode.value === 'createdDesc') {
    const getCreated = (u: any) => {
      const dt = new Date(u?.dateCreated)
      return isNaN(dt.getTime()) ? 0 : dt.getTime()
    }
    out.sort((a, b) => getCreated(b) - getCreated(a))
  }

  return out
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const filter = buildFilter()
    const res = await Api.tracking.getAllTrackingUsers({
      body: JSON.stringify(buildFilter())
    })
    const table = res?.data ?? res

    const items = table?.items ?? []
    const filtered = applyClientFiltersAndSort(items)

    rows.value = filtered
    // totalCount ustawiamy UX-owo na to co widać (po filtrach client-side)
    totalCount.value = filterMode.value === 'online' || activityWindowMinutes.value > 0 ? filtered.length : (table?.totalCount ?? filtered.length)

    // meta
    meta.value.total = table?.totalCount ?? items.length
    meta.value.online = (onlineUsers.value?.length ?? 0)
    meta.value.withCart = items.filter((u: any) => u?.hasShoppingCartItems).length
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się pobrać użytkowników')
  } finally {
    loading.value = false
  }
}

const refreshNow = async () => {
  countdown.value = 60
  await fetchOnline()
  await fetchUsers()
}

const applySearch = async () => {
  pageNumber.value = 1
  await refreshNow()
}

const setMode = async (m: Mode) => {
  filterMode.value = m
  pageNumber.value = 1
  await refreshNow()
}

const onPage = async (p: number) => {
  pageNumber.value = p
  await refreshNow()
}

const openDetails = (row: any) => {
  selected.value = row
  drawerOpen.value = true
}

const startTimers = () => {
  stopTimers()
  countdown.value = 60

  countdownTimer = setInterval(() => {
    if (!autoRefreshEnabled.value) return
    countdown.value = Math.max(0, countdown.value - 1)
  }, 1000)

  refreshTimer = setInterval(async () => {
    if (!autoRefreshEnabled.value) return
    countdown.value = 60
    await refreshNow()
  }, 60000)
}

const stopTimers = () => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  refreshTimer = null
  countdownTimer = null
}

watch(autoRefreshEnabled, (v) => {
  if (v) startTimers()
  else stopTimers()
})

onMounted(async () => {
  await refreshNow()
  startTimers()
})

onBeforeUnmount(() => stopTimers())
</script>

<style scoped>
/* Modern chips */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  transition: all 150ms ease;
}
.chip:hover { border-color: #cbd5e1; background: #f8fafc; }
.chip--active { border-color: #38bdf8; background: #e0f2fe; }
.chip__count {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #0f172a;
  color: white;
}

/* Table modern look */
.modern-table :deep(.el-table__header-wrapper th) {
  background: #f8fafc !important;
  color: #0f172a !important;
  font-weight: 700 !important;
  font-size: 12px !important;
}
.modern-table :deep(.el-table__row) {
  cursor: pointer;
}
.modern-table :deep(.el-table__row:hover td) {
  background: #f8fafc !important;
}

/* Avatar */
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, #f8fafc, #ffffff);
  color: #0f172a;
  font-weight: 800;
  font-size: 12px;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  font-size: 11px;
  font-weight: 800;
}
.badge--online { border-color: #86efac; background: #ecfdf5; color: #166534; }
.badge--offline { border-color: #e2e8f0; background: #fff; color: #64748b; }
.badge--cart { border-color: #c4b5fd; background: #f5f3ff; color: #5b21b6; }

/* Metrics */
.metric {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px;
  background: #fff;
}
.metric__label { font-size: 11px; color: #64748b; }
.metric__value { font-size: 14px; font-weight: 800; color: #0f172a; }

/* Status pills */
.status {
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  width: fit-content;
}
.status--ok { border-color: #86efac; background: #ecfdf5; color: #166534; }
.status--warn { border-color: #fdba74; background: #fff7ed; color: #9a3412; }
.status--bad { border-color: #fca5a5; background: #fef2f2; color: #991b1b; }
.status--muted { border-color: #e2e8f0; background: #fff; color: #64748b; }

/* Drawer sections */
.kpi {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px;
  background: #fff;
}
.kpi__label { font-size: 11px; color: #64748b; }
.kpi__value { font-size: 18px; font-weight: 900; color: #0f172a; }

.section {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px;
  background: #fff;
}
.section__title {
  font-size: 12px;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 8px;
}
.empty {
  font-size: 12px;
  color: #94a3b8;
}

/* Timeline */
.timeline { position: relative; padding-left: 18px; }
.timeline::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: #e2e8f0;
}
.timeline__item { position: relative; display: flex; gap: 10px; padding: 8px 0; }
.timeline__dot {
  position: absolute;
  left: 2px;
  top: 14px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #38bdf8;
  border: 2px solid #e0f2fe;
}
.timeline__body { margin-left: 12px; min-width: 0; }
.timeline__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: baseline;
}
.timeline__time { font-size: 11px; font-weight: 800; color: #0f172a; }
.timeline__sid { font-size: 11px; color: #64748b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
.timeline__path { margin-top: 2px; font-size: 12px; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timeline__meta { margin-top: 2px; font-size: 11px; color: #64748b; }

/* Cart cards */
.cartCard {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 10px;
  background: #fff;
}
.pill {
  font-size: 11px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
}
.pill--green { border-color: #86efac; background: #ecfdf5; color: #166534; }
.pill--orange { border-color: #fdba74; background: #fff7ed; color: #9a3412; }
.pill--gray { border-color: #e2e8f0; background: #fff; color: #64748b; }

.cartItem {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 8px;
  background: #fbfdff;
}
</style>