<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type ColumnType = 'text' | 'image' | 'boolean' | 'priceMarkup' | 'slug'

type TableColumn = {
  prop: string
  label: string
  type?: ColumnType
  width?: string
}

const props = defineProps({
  dataTable: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array as () => TableColumn[],
    default: () => []
  },
  link: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  searchPlaceholder: {
    type: String,
    default: 'Szukaj w tabeli...'
  },
  emptyText: {
    type: String,
    default: 'Brak danych do wyświetlenia.'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()
const search = ref('')

const rows = computed(() => {
  const items = Array.isArray(props.dataTable) ? props.dataTable : []
  const phrase = search.value.trim().toLowerCase()
  if (!phrase) return items

  return items.filter((row: any) =>
    props.columns.some((column) => {
      const value = row?.[column.prop]
      if (value === null || value === undefined) return false
      return String(value).toLowerCase().includes(phrase)
    })
  )
})

const totalCount = computed(() => (Array.isArray(props.dataTable) ? props.dataTable.length : 0))

const resolveColumnType = (column: TableColumn): ColumnType => {
  if (column.type) return column.type
  if (column.prop === 'filePath') return 'image'
  if (column.prop === 'priceMarkup') return 'priceMarkup'
  if (column.prop === 'slug') return 'slug'
  if (['isPublished', 'active', 'isActive', 'published'].includes(column.prop)) return 'boolean'
  return 'text'
}

const formatCell = (row: any, column: TableColumn) => {
  const value = row?.[column.prop]
  if (value === null || value === undefined || value === '') return '—'
  return value
}

const booleanLabel = (value: unknown) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return 'Aktywny'
  if (value === false || value === 'false' || value === 0 || value === '0') return 'Nieaktywny'
  return String(value ?? '—')
}

const booleanTone = (value: unknown) => {
  if (value === true || value === 'true' || value === 1 || value === '1') return 'yes'
  return 'no'
}

const markupTone = (value: number) => {
  if (value > 14) return 'high'
  if (value >= 10) return 'mid'
  return 'low'
}

const handleRowClick = (row: any) => {
  if (!props.link || !row?.id) return
  router.push({
    path: `${props.link}/${row.id}`,
    query: route.query
  })
}
</script>

<template>
  <div class="modern-list-page">
    <div class="modern-list-page__header">
      <div class="modern-list-page__intro">
        <h1 v-if="title" class="modern-list-page__title">{{ title }}</h1>
        <p v-if="subtitle" class="modern-list-page__subtitle">{{ subtitle }}</p>
      </div>

      <div class="modern-list-page__actions">
        <span class="modern-list-page__count">{{ rows.length }} / {{ totalCount }}</span>
        <slot name="topbar" />
      </div>
    </div>

    <div class="modern-list-page__toolbar">
      <slot name="control" />
      <el-input
        v-model="search"
        clearable
        class="modern-list-page__search"
        :placeholder="searchPlaceholder"
      />
      <slot name="filter" />
    </div>

    <div v-loading="loading" class="modern-list-card">
      <div class="modern-list-table-wrap">
        <table class="modern-list-table">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.prop"
                :style="column.width ? { width: column.width } : undefined"
              >
                {{ column.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, index) in rows"
              :key="row.id ?? index"
              class="modern-list-table__row"
              :class="{ 'modern-list-table__row--clickable': !!link }"
              @click="handleRowClick(row)"
            >
              <td v-for="column in columns" :key="column.prop">
                <img
                  v-if="resolveColumnType(column) === 'image'"
                  :src="row[column.prop]"
                  alt=""
                  class="modern-list-table__image"
                />

                <span
                  v-else-if="resolveColumnType(column) === 'priceMarkup'"
                  class="markup-chip"
                  :class="`markup-chip--${markupTone(Number(row[column.prop]))}`"
                >
                  {{ row[column.prop] }}%
                </span>

                <span
                  v-else-if="resolveColumnType(column) === 'boolean'"
                  class="status-chip"
                  :class="`status-chip--${booleanTone(row[column.prop])}`"
                >
                  {{ booleanLabel(row[column.prop]) }}
                </span>

                <span
                  v-else-if="resolveColumnType(column) === 'slug'"
                  class="modern-list-table__slug"
                >
                  {{ formatCell(row, column) }}
                </span>

                <span
                  v-else
                  class="modern-list-table__text"
                  :class="{ 'modern-list-table__text--truncate': column.prop === 'description' }"
                  :title="column.prop === 'description' ? String(row[column.prop] ?? '') : undefined"
                >
                  {{ formatCell(row, column) }}
                </span>
              </td>
            </tr>

            <tr v-if="!loading && rows.length === 0">
              <td :colspan="Math.max(columns.length, 1)" class="modern-list-table__empty">
                {{ emptyText }}
              </td>
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
  font-size: 14px;
}

.modern-list-page__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.modern-list-page__search {
  width: min(360px, 100%);
}

.modern-list-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.modern-list-table-wrap {
  overflow-x: auto;
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
  vertical-align: middle;
}

.modern-list-table th {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.modern-list-table__row--clickable {
  cursor: pointer;
  transition: background 0.15s ease;
}

.modern-list-table__row--clickable:hover {
  background: #f8fafc;
}

.modern-list-table__text {
  color: #0f172a;
  font-weight: 500;
}

.modern-list-table__text--truncate {
  display: block;
  max-width: 420px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.modern-list-table__image {
  width: 64px;
  height: 64px;
  object-fit: contain;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.modern-list-table__empty {
  text-align: center;
  color: #64748b;
  padding: 36px 18px !important;
}

.status-chip,
.markup-chip {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.status-chip--yes {
  background: #dcfce7;
  color: #166534;
}

.status-chip--no {
  background: #fee2e2;
  color: #b91c1c;
}

.markup-chip--high {
  background: #dcfce7;
  color: #166534;
}

.markup-chip--mid {
  background: #fef3c7;
  color: #b45309;
}

.markup-chip--low {
  background: #fee2e2;
  color: #b91c1c;
}
</style>
