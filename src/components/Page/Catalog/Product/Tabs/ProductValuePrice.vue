<script lang="ts" setup>
import { reactive, computed, onMounted, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import jwt_decode from 'jwt-decode'
import Cookies from 'universal-cookie'


/** Enum zgodny z backendem */

export type Tier = {
  id?: string | null
  minQuantity: number
  maxQuantity?: number | null
  mode: VolumePriceMode
  value: number
  isActive: boolean
  priority: number
  isCombinable: boolean
}

const props = withDefaults(defineProps<{
  product: null
  currentUserId?: string | null
  includeInactive?: boolean
}>(), {
  includeInactive: true,
  currentUserId: null
})

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'error', err: unknown): void
}>()


/** Stan */
const isLoading = ref(false)
const saving = ref(false)
const tiers = reactive<Tier[]>([])
const cookies = new Cookies()
const token = cookies.get('Authorization')

export type VolumePriceMode = 1 | 2 | 3

const MODE_LABEL: Record<VolumePriceMode, string> = {
  1: 'Rabat %',
  2: 'Rabat kwotowy',
  3: 'Stała cena / szt.'
}

/** Mapowanie DTO -> model UI */
function mapDtoToTier(dto: any): Tier {
  return {
    id: dto.id,
    minQuantity: dto.minQuantity,
    maxQuantity: dto.maxQuantity ?? null,
    mode: dto.mode, // backend zwraca nazwę enuma
    value: dto.value,
    isActive: dto.isActive,
    priority: dto.priority,
    isCombinable: dto.isCombinable
  }
}


/** Pobranie z backendu */
async function load() {
  if (!props.product.id) return
  isLoading.value = true
  try {
    const res = await Api.productValuePrice.getByProductId(props.product.id, props.includeInactive)
    const rows = res.data ?? []
    tiers.splice(0, tiers.length, ...rows.map(mapDtoToTier))
  } catch (err) {
    emit('error', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(() => props.product.id, () => load())

/** Operacje na wierszach (UI) */
function addRow() {
  tiers.push({
    id: null,
    minQuantity: guessNextMin(),
    maxQuantity: null,
    mode: 3 as VolumePriceMode,
    value: 0,
    isActive: true,
    priority: 0,
    isCombinable: false
  })
}
function duplicateRow(idx: number) {
  const t = tiers[idx]
  tiers.splice(idx + 1, 0, { ...t, id: null })
}
function removeLocal(idx: number) {
  tiers.splice(idx, 1)
}
function sortRows() {
  tiers.sort((a, b) => (b.priority - a.priority) || (b.minQuantity - a.minQuantity))
}
function clearAll() {
  tiers.splice(0, tiers.length)
}
function guessNextMin() {
  return tiers.length ? Math.max(...tiers.map(t => t.minQuantity || 0)) + 5 : 10
}

/** Walidacja */
type RowError = { min?: string; max?: string; value?: string }
const rowErrors = computed<RowError[]>(() =>
  tiers.map(t => {
    const e: RowError = {}
    if (!Number.isFinite(t.minQuantity) || t.minQuantity <= 0) e.min = 'Min > 0'
    if (t.maxQuantity != null) {
      if (!Number.isFinite(t.maxQuantity)) e.max = 'Max liczba'
      else if (t.maxQuantity < t.minQuantity) e.max = 'Max >= Min'
    }
    if (!Number.isFinite(t.value) || t.value <= 0) e.value = 'Wartość > 0'
    if (t.mode === 1 && (t.value <= 0 || t.value > 100)) e.value = 'Procent 0–100'
    return e
  })
)
const overlapError = computed<string | null>(() => {
  const withMax = tiers.filter(t => t.maxQuantity != null)
    .map(t => ({ min: t.minQuantity, max: t.maxQuantity as number }))
    .sort((a, b) => a.min - b.min)
  for (let i = 0; i < withMax.length - 1; i++) {
    const a = withMax[i], b = withMax[i + 1]
    if (b.min <= a.max) return `Zakresy nachodzą się: [${a.min}, ${a.max}] i [${b.min}, ${b.max}]`
  }
  const open = tiers.filter(t => t.maxQuantity == null)
  const mins = new Set<number>()
  for (const t of open) {
    if (mins.has(t.minQuantity)) return `Duplikat Min dla progów bez Max: ${t.minQuantity}`
    mins.add(t.minQuantity)
  }
  return null
})
const hasRowErrors = computed(() => rowErrors.value.some(r => Object.keys(r).length > 0))
const canSave = computed(() => !hasRowErrors.value && !overlapError.value && tiers.length > 0)

/** Zapis: ReplaceAll (POST "") */
async function saveReplaceAll() {
  if (!canSave.value) return
  saving.value = true
  try {
    sortRows()
    const command = {
      productId: props.product.id,
      replaceAll: true,
      actorId: props.currentUserId,
      items: tiers.map(t => ({
        id: t.id ?? undefined,
        minQuantity: t.minQuantity,
        maxQuantity: t.maxQuantity ?? undefined,
        mode: t.mode,
        value: Number(t.value),
        isActive: !!t.isActive,
        priority: Number(t.priority || 0),
        isCombinable: !!t.isCombinable
      }))
    }
    await Api.productValuePrice.addOrReplace({ body: JSON.stringify(command) })
    emit('saved')
    await load()
  } catch (err) {
    emit('error', err)
  } finally {
    saving.value = false
  }
}

/** Usuń z backendu (DELETE "" z body) */
async function removeServer(id?: string | null) {
  const decoded = jwt_decode(token)
  if (!id) { return }
  try {
    await Api.productValuePrice.removeVolumePrice({
      body: JSON.stringify({ id:id, UpdatedById: decoded.UserId })
    })
    await load()
  } catch (err) {
    emit('error', err)
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <div class="text-lg font-semibold">Rabatowanie (progi ilościowe)</div>
      <div class="flex gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          @click="addRow"
          :disabled="isLoading"
        >
          Dodaj próg
        </button>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
          @click="sortRows"
          :disabled="tiers.length === 0 || isLoading"
        >
          Sortuj
        </button>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-transparent bg-transparent px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60"
          @click="clearAll"
          :disabled="tiers.length === 0 || isLoading"
        >
          Wyczyść
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-gray-500 italic">Ładowanie…</div>

    <div v-if="overlapError" class="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-800">
      {{ overlapError }}
    </div>

    <div class="overflow-x-auto rounded-md border border-gray-200">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-gray-50">
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Min</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Max</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Tryb</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Wartość</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Aktywny</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Priorytet</th>
            <th class="px-3 py-2 text-left font-semibold text-gray-900">Łącz z promo</th>
            <th class="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(t, idx) in tiers"
            :key="t.id ?? idx"
            class="border-t border-gray-200 hover:bg-gray-50"
          >
            <td class="px-3 py-2 align-middle">
              <input
                type="number"
                min="1"
                v-model.number="t.minQuantity"
                class="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              />
              <div v-if="rowErrors[idx]?.min" class="mt-1 text-xs text-red-600">
                {{ rowErrors[idx]?.min }}
              </div>
            </td>

            <td class="px-3 py-2 align-middle">
              <input
                type="number"
                v-model.number="t.maxQuantity"
                placeholder="—"
                class="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              />
              <div v-if="rowErrors[idx]?.max" class="mt-1 text-xs text-red-600">
                {{ rowErrors[idx]?.max }}
              </div>
            </td>

            <td class="px-3 py-2 align-middle">
              <select
                v-model.number="t.mode"
                class="w-44 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              >
                <option :value="3">{{ MODE_LABEL[3] }}</option>
                <option :value="1">{{ MODE_LABEL[1] }}</option>
                <option :value="2">{{ MODE_LABEL[2] }}</option>
              </select>
            </td>

            <td class="px-3 py-2 align-middle">
              <input
                type="number"
                step="0.01"
                min="0"
                v-model.number="t.value"
                class="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              />
              <div v-if="rowErrors[idx]?.value" class="mt-1 text-xs text-red-600">
                {{ rowErrors[idx]?.value }}
              </div>
            </td>

            <td class="px-3 py-2 align-middle">
              <input type="checkbox" v-model="t.isActive" class="h-4 w-4 accent-blue-600" />
            </td>

            <td class="px-3 py-2 align-middle">
              <input
                type="number"
                v-model.number="t.priority"
                step="1"
                class="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300/40"
              />
            </td>

            <td class="px-3 py-2 align-middle">
              <input type="checkbox" v-model="t.isCombinable" class="h-4 w-4 accent-blue-600" />
            </td>

            <td class="px-3 py-2 align-middle">
              <div class="flex justify-end gap-2">
                <button
                  class="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                  @click="duplicateRow(idx)"
                >
                  Duplikuj
                </button>
                <button
                  class="inline-flex items-center rounded-md border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  @click="t.id ? removeServer(t.id) : removeLocal(idx)"
                >
                  Usuń
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!isLoading && tiers.length === 0">
            <td colspan="8" class="px-3 py-6 text-center text-gray-500">
              Brak progów – dodaj pierwszy.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-end">
      <button
        class="inline-flex items-center rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        :disabled="!canSave || saving"
        @click="saveReplaceAll"
      >
        {{ saving ? 'Zapisywanie…' : 'Zapisz' }}
      </button>
    </div>
  </div>
</template>
