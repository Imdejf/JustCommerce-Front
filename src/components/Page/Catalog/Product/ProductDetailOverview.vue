<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { CopyDocument, EditPen, Link, Picture } from '@element-plus/icons-vue'
import type { ProductDTO } from '/@/types/product/Product'
import { ProductAvailability } from '/@/types/product/Product'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    required: true
  }
})

const router = useRouter()
const toast = useToast()

const availabilityLabels: Record<ProductAvailability, string> = {
  [ProductAvailability.Available]: 'Dostępny',
  [ProductAvailability.TwentyFourToFourtyEight]: '24–48 h',
  [ProductAvailability.UpToFiveBusinessDays]: 'Do 5 dni rob.',
  [ProductAvailability.ThreeToSevenDays]: '3–7 dni',
  [ProductAvailability.ThreeToTenDays]: '3–10 dni',
  [ProductAvailability.TwoWeeks]: 'Do 2 tygodni',
  [ProductAvailability.ThreeWeeks]: 'Do 3 tygodni',
  [ProductAvailability.ThreeToFiveWeeks]: '3–5 tygodni',
  [ProductAvailability.TemporarilyUnavailable]: 'Tymczasowo niedostępny',
  [ProductAvailability.SellerConfirmation]: 'Potw. sprzedawcy',
  [ProductAvailability.ToOrder]: 'Na zamówienie'
}

const storefrontBaseUrl = String(import.meta.env.VITE_STOREFRONT_URL || 'https://olmag.pl').replace(/\/$/, '')

const storefrontUrl = computed(() => {
  if (!props.product.slug) {
    return ''
  }
  return `${storefrontBaseUrl}/${props.product.slug}`
})

const marginPercent = computed(() => {
  const producer = props.product.producerPrice
  const price = props.product.price
  if (!producer || producer <= 0 || price == null) {
    return null
  }
  return Math.round(((price - producer) / producer) * 100)
})

const marginTone = computed(() => {
  if (marginPercent.value == null) {
    return 'neutral'
  }
  if (marginPercent.value < 10) {
    return 'low'
  }
  if (marginPercent.value >= 25) {
    return 'high'
  }
  return 'medium'
})

const stats = computed(() => [
  {
    label: 'Cena netto',
    value: formatMoney(props.product.price),
    accent: true
  },
  {
    label: 'Cena producenta',
    value: formatMoney(props.product.producerPrice)
  },
  {
    label: 'Narzut',
    value: marginPercent.value == null ? '—' : `${marginPercent.value}%`,
    tone: marginTone.value
  },
  {
    label: 'Warianty',
    value: String(props.product.variations?.length ?? 0)
  },
  {
    label: 'Kategorie',
    value: String(props.product.categoryIds?.length ?? 0)
  },
  {
    label: 'Atrybuty',
    value: String(props.product.attributes?.length ?? 0)
  }
])

const identifiers = computed(() => [
  { label: 'SKU', value: props.product.sku },
  { label: 'GTIN', value: props.product.gtin },
  { label: 'Identyfikator', value: props.product.identificationCode },
  { label: 'Slug', value: props.product.slug }
])

const statusTags = computed(() => {
  const tags: Array<{ label: string; type: 'success' | 'info' | 'warning' | 'danger' }> = []

  tags.push({
    label: props.product.isPublished ? 'Opublikowany' : 'Szkic',
    type: props.product.isPublished ? 'success' : 'warning'
  })

  if (props.product.isBestseller) tags.push({ label: 'Bestseller', type: 'info' })
  if (props.product.isNew) tags.push({ label: 'Nowość', type: 'info' })
  if (props.product.isSales) tags.push({ label: 'Promocja', type: 'danger' })
  if (props.product.isFeatured) tags.push({ label: 'Polecany', type: 'info' })
  if ((props.product.variations?.length ?? 0) > 0) tags.push({ label: 'Ma warianty', type: 'info' })
  if ((props.product.options?.length ?? 0) > 0) tags.push({ label: `${props.product.options.length} opcji`, type: 'info' })

  return tags
})

const availabilityLabel = computed(
  () => availabilityLabels[props.product.productAvailability] ?? '—'
)

function formatMoney(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return '—'
  }
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 2
  }).format(value)
}

async function copyValue(value?: string | null) {
  if (!value) {
    toast.info('Brak wartości do skopiowania')
    return
  }

  try {
    await navigator.clipboard.writeText(value)
    toast.success('Skopiowano do schowka')
  } catch {
    toast.error('Nie udało się skopiować')
  }
}

function handleEdit() {
  router.push(`/catalog/product/edit/${props.product.id}`)
}
</script>

<template>
  <section class="product-detail-overview">
    <div class="product-detail-overview__hero">
      <div class="product-detail-overview__media">
        <img
          v-if="product.thumbnailImage?.filePath"
          :src="product.thumbnailImage.filePath"
          :alt="product.thumbnailImage.altAttribute || product.name"
          class="product-detail-overview__image"
        />
        <div v-else class="product-detail-overview__image-placeholder">
          <el-icon :size="40"><Picture /></el-icon>
        </div>
      </div>

      <div class="product-detail-overview__main">
        <div class="product-detail-overview__title-row">
          <div class="min-w-0 flex-1">
            <p class="product-detail-overview__eyebrow">Produkt</p>
            <h1 class="product-detail-overview__title">{{ product.name }}</h1>
          </div>
          <div class="product-detail-overview__actions">
            <el-button type="primary" size="large" :icon="EditPen" @click="handleEdit">
              Edytuj produkt
            </el-button>
            <el-button
              v-if="storefrontUrl"
              tag="a"
              :href="storefrontUrl"
              target="_blank"
              rel="noopener noreferrer"
              size="large"
              :icon="Link"
            >
              Sklep
            </el-button>
          </div>
        </div>

        <div class="product-detail-overview__tags">
          <el-tag
            v-for="tag in statusTags"
            :key="tag.label"
            :type="tag.type"
            effect="light"
            round
          >
            {{ tag.label }}
          </el-tag>
          <el-tag type="info" effect="plain" round>{{ availabilityLabel }}</el-tag>
        </div>

        <p v-if="product.shortDescription" class="product-detail-overview__description">
          {{ product.shortDescription }}
        </p>
      </div>
    </div>

    <div class="product-detail-overview__stats">
      <article
        v-for="stat in stats"
        :key="stat.label"
        class="product-detail-overview__stat"
        :class="{
          'product-detail-overview__stat--accent': stat.accent,
          [`product-detail-overview__stat--margin-${stat.tone}`]: !!stat.tone
        }"
      >
        <span class="product-detail-overview__stat-label">{{ stat.label }}</span>
        <strong class="product-detail-overview__stat-value">{{ stat.value }}</strong>
      </article>
    </div>

    <div class="product-detail-overview__identifiers">
      <div
        v-for="item in identifiers"
        :key="item.label"
        class="product-detail-overview__identifier"
      >
        <span class="product-detail-overview__identifier-label">{{ item.label }}</span>
        <div class="product-detail-overview__identifier-value-wrap">
          <code class="product-detail-overview__identifier-value">{{ item.value || '—' }}</code>
          <el-button
            v-if="item.value"
            text
            type="primary"
            :icon="CopyDocument"
            title="Kopiuj"
            @click="copyValue(item.value)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-detail-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.product-detail-overview__hero {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.product-detail-overview__media {
  width: 160px;
  height: 160px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-detail-overview__image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
}

.product-detail-overview__image-placeholder {
  color: #94a3b8;
}

.product-detail-overview__main {
  min-width: 0;
}

.product-detail-overview__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.product-detail-overview__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.product-detail-overview__title {
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.85rem);
  line-height: 1.25;
  font-weight: 700;
  color: #0f172a;
}

.product-detail-overview__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.product-detail-overview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.product-detail-overview__description {
  margin: 16px 0 0;
  color: #475569;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-detail-overview__stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.product-detail-overview__stat {
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.product-detail-overview__stat--accent {
  border-color: #fdba74;
  background: #fff7ed;
}

.product-detail-overview__stat--margin-low {
  border-color: #fecaca;
  background: #fef2f2;
}

.product-detail-overview__stat--margin-medium {
  border-color: #fde68a;
  background: #fffbeb;
}

.product-detail-overview__stat--margin-high {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.product-detail-overview__stat-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 6px;
}

.product-detail-overview__stat-value {
  font-size: 1.125rem;
  color: #0f172a;
}

.product-detail-overview__identifiers {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.product-detail-overview__identifier {
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  min-width: 0;
}

.product-detail-overview__identifier-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 8px;
}

.product-detail-overview__identifier-value-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.product-detail-overview__identifier-value {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1200px) {
  .product-detail-overview__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .product-detail-overview__identifiers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .product-detail-overview {
    padding: 16px;
  }

  .product-detail-overview__hero {
    grid-template-columns: 1fr;
  }

  .product-detail-overview__media {
    width: 100%;
    max-width: 220px;
  }

  .product-detail-overview__stats,
  .product-detail-overview__identifiers {
    grid-template-columns: 1fr;
  }
}
</style>
