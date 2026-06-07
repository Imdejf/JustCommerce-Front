<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOfferStore } from '/@/stores/offer'

const props = defineProps<{
  hotOffers?: any[]
  pipelineProfit?: number
  pipelineValue?: number
}>()

const router = useRouter()
const offerStore = useOfferStore()

const items = computed(() => props.hotOffers ?? [])

const money = (v?: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(v ?? 0)

const moneyNet = (v?: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 2 }).format(v ?? 0)

const percent = (v?: number) => `${(v ?? 0).toFixed(1)}%`

const statusLabel = (status: number) => {
  const map: Record<number, string> = {
    0: 'Do wysłania',
    1: 'Wysłana',
    2: 'Decyzja',
    3: 'Zaakceptowana',
    4: 'Odrzucona',
    5: 'Anulowana'
  }
  return map[status] ?? '—'
}

const priorityLabel = (p?: string) => {
  if (p === 'high') return 'Wysoki potencjał'
  if (p === 'medium') return 'Średni'
  return 'Do follow-up'
}

const openOffer = async (offerId: string) => {
  await offerStore.showOffer(offerId)
}

const editOffer = (offerId: string) => {
  router.push(`/sale/offer/edit/${offerId}`)
}
</script>

<template>
  <aside class="pipeline-panel">
    <div class="pipeline-panel__head">
      <div>
        <p class="pipeline-panel__eyebrow">Optymalizacja zysku</p>
        <h2>Szanse sprzedaży</h2>
        <p>Oferty z najwyższym potencjałem zysku netto</p>
      </div>
    </div>

    <div class="pipeline-panel__summary">
      <div class="pipeline-panel__stat">
        <span class="pipeline-panel__stat-label">Pipeline brutto</span>
        <strong>{{ money(pipelineValue) }}</strong>
      </div>
      <div class="pipeline-panel__stat">
        <span class="pipeline-panel__stat-label">Zysk netto</span>
        <strong class="pipeline-panel__stat-profit">{{ moneyNet(pipelineProfit) }}</strong>
      </div>
    </div>

    <div v-if="!items.length" class="pipeline-panel__empty">
      <div class="pipeline-panel__empty-icon">🚀</div>
      <p>Brak aktywnych szans. Utwórz ofertę lub zmień status na „Oczekuje na decyzję”.</p>
    </div>

    <div v-else class="pipeline-list">
      <article
        v-for="item in items"
        :key="item.offerId"
        class="pipeline-card"
        :class="`pipeline-card--${item.priority}`"
        @dblclick="openOffer(item.offerId)"
      >
        <div class="pipeline-card__top">
          <div>
            <div class="pipeline-card__number">#{{ item.offerNumber }}</div>
            <div class="pipeline-card__client">{{ item.customerLabel }}</div>
          </div>
          <span class="pipeline-card__badge">{{ priorityLabel(item.priority) }}</span>
        </div>

        <div class="pipeline-card__metrics">
          <div>
            <span>Wartość</span>
            <strong>{{ money(item.totalPriceGross) }}</strong>
          </div>
          <div>
            <span>Zysk netto</span>
            <strong class="pipeline-card__profit">{{ moneyNet(item.profitNet) }}</strong>
          </div>
          <div>
            <span>Marża</span>
            <strong :class="{ 'text-warn': item.marginPct < 12 }">{{ percent(item.marginPct) }}</strong>
          </div>
        </div>

        <div class="pipeline-card__foot">
          <span class="pipeline-card__status">{{ statusLabel(item.offerStatus) }}</span>
          <span
            class="pipeline-card__expire"
            :class="{ 'pipeline-card__expire--bad': item.isExpired, 'pipeline-card__expire--warn': !item.isExpired && item.daysToExpire <= 3 }"
          >
            <template v-if="item.isExpired">Po terminie</template>
            <template v-else-if="item.daysToExpire <= 0">Wygasa dziś</template>
            <template v-else>Za {{ item.daysToExpire }} dni</template>
          </span>
        </div>

        <div class="pipeline-card__actions">
          <button type="button" @click="openOffer(item.offerId)">Podgląd</button>
          <button type="button" class="primary" @click="editOffer(item.offerId)">Edytuj marżę</button>
        </div>
      </article>
    </div>
  </aside>
</template>

<style scoped>
.pipeline-panel {
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, #f8fafc 100%);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pipeline-panel__head h2 {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 900;
  color: #0f172a;
}

.pipeline-panel__head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b;
}

.pipeline-panel__eyebrow {
  margin: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f97316;
}

.pipeline-panel__summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 14px 0 12px;
}

.pipeline-panel__stat {
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
  color: #e2e8f0;
}

.pipeline-panel__stat-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.75;
}

.pipeline-panel__stat strong {
  display: block;
  margin-top: 4px;
  font-size: 14px;
  color: #fff;
}

.pipeline-panel__stat-profit {
  color: #6ee7b7 !important;
}

.pipeline-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 2px;
}

.pipeline-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.pipeline-card:hover {
  border-color: #c7d2fe;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.1);
}

.pipeline-card--high {
  border-color: rgba(249, 115, 22, 0.45);
  box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.08);
}

.pipeline-card__top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.pipeline-card__number {
  font-size: 14px;
  font-weight: 900;
  color: #0f172a;
}

.pipeline-card__client {
  font-size: 12px;
  color: #475569;
  margin-top: 2px;
}

.pipeline-card__badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 3px 7px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
}

.pipeline-card--high .pipeline-card__badge {
  background: rgba(249, 115, 22, 0.15);
  color: #c2410c;
}

.pipeline-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.pipeline-card__metrics span {
  display: block;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #94a3b8;
}

.pipeline-card__metrics strong {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: #1e293b;
}

.pipeline-card__profit {
  color: #047857 !important;
}

.text-warn {
  color: #b45309 !important;
}

.pipeline-card__foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
  font-weight: 700;
}

.pipeline-card__status { color: #64748b; }
.pipeline-card__expire { color: #64748b; }
.pipeline-card__expire--warn { color: #b45309; }
.pipeline-card__expire--bad { color: #b91c1c; }

.pipeline-card__actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.pipeline-card__actions button {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #fff;
  padding: 6px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
}

.pipeline-card__actions button.primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border-color: transparent;
  color: #fff;
}

.pipeline-panel__empty {
  text-align: center;
  padding: 28px 12px;
  color: #64748b;
  font-size: 13px;
}

.pipeline-panel__empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
</style>
