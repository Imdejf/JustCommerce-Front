<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import Cookies from 'universal-cookie'
import { Api } from '/@/services/api'

type PageStat = {
  path: string
  visits: number
  users: number
  lastVisit?: string
}

const cookies = new Cookies()
const loading = ref(false)
const search = ref('')
const rows = ref<PageStat[]>([])

const filteredRows = computed(() => {
  const phrase = search.value.trim().toLowerCase()
  if (!phrase) return rows.value
  return rows.value.filter((row) => row.path.toLowerCase().includes(phrase))
})

const formatDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pl-PL')
}

const fetchPages = async () => {
  loading.value = true
  try {
    const response = await Api.tracking.getAllTrackingUsers({
      body: JSON.stringify({
        StoreId: cookies.get('dsStore'),
        PageNumber: 1,
        PageSize: 500,
        SmartTableParam: {
          Search: {
            PredicateObject: {
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
          }
        }
      })
    })

    const users = response?.data?.users?.items ?? response?.data?.items ?? response?.items ?? []
    const map = new Map<string, { visits: number; users: Set<string>; lastVisit?: string }>()

    for (const user of users) {
      const userId = String(user.userId ?? '')
      for (const tracking of user.trackings ?? []) {
        const path = String(tracking.path ?? '').trim()
        if (!path) continue

        const current = map.get(path) ?? { visits: 0, users: new Set<string>(), lastVisit: undefined }
        current.visits += 1
        if (userId) current.users.add(userId)

        const occurred = tracking.occurredOnUtc
        if (occurred && (!current.lastVisit || new Date(occurred) > new Date(current.lastVisit))) {
          current.lastVisit = occurred
        }

        map.set(path, current)
      }
    }

    rows.value = [...map.entries()]
      .map(([path, stat]) => ({
        path,
        visits: stat.visits,
        users: stat.users.size,
        lastVisit: stat.lastVisit
      }))
      .sort((a, b) => b.visits - a.visits)
  } catch (error) {
    console.error(error)
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchPages)
</script>

<template>
  <div class="modern-list-page">
    <div class="modern-list-page__header">
      <div class="modern-list-page__intro">
        <h1 class="modern-list-page__title">Śledzenie stron</h1>
        <p class="modern-list-page__subtitle">
          Najczęściej odwiedzane ścieżki na podstawie aktywności użytkowników.
        </p>
      </div>
      <div class="modern-list-page__actions">
        <span class="modern-list-page__count">{{ filteredRows.length }} stron</span>
        <el-button :loading="loading" @click="fetchPages">Odśwież</el-button>
      </div>
    </div>

    <div class="modern-list-page__toolbar">
      <el-input
        v-model="search"
        clearable
        class="modern-list-page__search"
        placeholder="Szukaj ścieżki URL..."
      />
    </div>

    <div v-loading="loading" class="modern-list-card">
      <div class="modern-list-table-wrap">
        <table class="modern-list-table">
          <thead>
            <tr>
              <th>Ścieżka</th>
              <th>Odwiedzin</th>
              <th>Użytkownicy</th>
              <th>Ostatnia wizyta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.path" class="modern-list-table__row">
              <td>
                <span class="modern-list-table__slug">{{ row.path }}</span>
              </td>
              <td><span class="metric-pill">{{ row.visits }}</span></td>
              <td><span class="metric-pill metric-pill--blue">{{ row.users }}</span></td>
              <td class="modern-list-table__text">{{ formatDate(row.lastVisit) }}</td>
            </tr>
            <tr v-if="!loading && filteredRows.length === 0">
              <td colspan="4" class="modern-list-table__empty">Brak danych o odwiedzanych stronach.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modern-list-page {
  padding: 24px;
}

.modern-list-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;
}

.modern-list-page__title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.modern-list-page__subtitle {
  margin: 6px 0 0;
  color: #64748b;
}

.modern-list-page__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modern-list-page__count {
  padding: 8px 14px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 600;
}

.modern-list-page__toolbar {
  margin-bottom: 16px;
}

.modern-list-page__search {
  width: min(420px, 100%);
}

.modern-list-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.modern-list-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-list-table th,
.modern-list-table td {
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}

.modern-list-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.modern-list-table__slug {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.modern-list-table__text {
  color: #0f172a;
  font-weight: 500;
}

.modern-list-table__empty {
  text-align: center;
  color: #64748b;
  padding: 36px 18px !important;
}

.metric-pill {
  display: inline-flex;
  min-width: 36px;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
}

.metric-pill--blue {
  background: #dbeafe;
  color: #1d4ed8;
}
</style>
