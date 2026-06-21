<script lang="ts" setup>
import type { ProductDTO, ProductFaqItemDTO } from '/@/types/product/Product'
import { computed, onMounted, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import ProductFaqAiReviewModal, {
  type ProductFaqAiReviewItem
} from '/@/components/Form/Modal/ProductFaqAiReviewModal.vue'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})

const toast = useToast()

interface ProductFaqFormModel {
  productFaqId?: string
  productId?: string
  question: string
  answer: string
  displayOrder: number
  isPublished: boolean
}

interface ProductFaqViewModel {
  id: string
  productId: string
  question: string
  answer: string
  displayOrder: number
  isPublished: boolean
}

const items = ref<ProductFaqViewModel[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const aiFaqUrlModalVisible = ref(false)
const aiFaqReviewVisible = ref(false)
const aiFaqLoading = ref(false)
const aiFaqApplyLoading = ref(false)
const aiFaqCompetitorUrl = ref('')
const aiFaqReviewItems = ref<ProductFaqAiReviewItem[]>([])
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const form = ref<ProductFaqFormModel>({
  productFaqId: '',
  productId: '',
  question: '',
  answer: '',
  displayOrder: 1,
  isPublished: true
})

const productId = computed(() => (props.product as any)?.id as string | undefined)

const normalizeFaqItem = (item: any): ProductFaqViewModel => {
  return {
    id: item?.id ?? item?.Id ?? item?.productFaqId ?? item?.ProductFaqId ?? '',
    productId: item?.productId ?? item?.ProductId ?? '',
    question: item?.question ?? item?.Question ?? '',
    answer: item?.answer ?? item?.Answer ?? '',
    displayOrder: Number(item?.displayOrder ?? item?.DisplayOrder ?? 0),
    isPublished: !!(item?.isPublished ?? item?.IsPublished ?? false)
  }
}

const sortItems = () => {
  items.value = [...items.value].sort((a, b) => a.displayOrder - b.displayOrder)
}

const hydrateFromProps = () => {
  const source = (props.product as any)?.productFaqItems as ProductFaqItemDTO[] | undefined

  if (!Array.isArray(source)) {
    items.value = []
    return
  }

  items.value = source.map(normalizeFaqItem)
  sortItems()
}

const resetForm = () => {
  Object.assign(form.value, {
    productFaqId: '',
    productId: productId.value ?? '',
    question: '',
    answer: '',
    displayOrder: items.value.length > 0
      ? Math.max(...items.value.map(x => Number(x.displayOrder ?? 0))) + 1
      : 1,
    isPublished: true
  })

  isEditing.value = false
  editingId.value = null
}

const startEdit = (item: ProductFaqViewModel) => {
  isEditing.value = true
  editingId.value = item.id

  Object.assign(form.value, {
    productFaqId: item.id,
    productId: item.productId,
    question: item.question ?? '',
    answer: item.answer ?? '',
    displayOrder: Number(item.displayOrder ?? 0),
    isPublished: !!item.isPublished
  })
}

const cancelEdit = () => {
  resetForm()
}

const getAllFaq = async () => {
  if (!productId.value) {
    items.value = []
    return
  }

  isLoading.value = true

  try {
    const result = await Api.productFaq.getByProductId(productId.value)
    const data = result?.data ?? result ?? []
    items.value = Array.isArray(data) ? data.map(normalizeFaqItem) : []
    sortItems()
  } catch {
    hydrateFromProps()
    toast.error('Nie udało się pobrać FAQ produktu.')
  } finally {
    isLoading.value = false
  }
}

const saveFaq = async () => {
  if (!productId.value) {
    toast.error('Brak product.id.')
    return
  }

  if (!form.value.question?.trim()) {
    toast.error('Pytanie jest wymagane.')
    return
  }

  if (!form.value.answer?.trim()) {
    toast.error('Odpowiedź jest wymagana.')
    return
  }

  isSaving.value = true

  try {
    if (isEditing.value && form.value.productFaqId) {
      await Api.productFaq.update({
        body: JSON.stringify({
          productFaqId: form.value.productFaqId,
          productId: productId.value,
          question: form.value.question,
          answer: form.value.answer,
          displayOrder: Number(form.value.displayOrder ?? 0),
          isPublished: !!form.value.isPublished
        })
      })

      toast.success('FAQ zostało zaktualizowane.')
    } else {
      await Api.productFaq.create({
        body: JSON.stringify({
          productId: productId.value,
          question: form.value.question,
          answer: form.value.answer,
          displayOrder: Number(form.value.displayOrder ?? 0),
          isPublished: !!form.value.isPublished
        })
      })

      toast.success('FAQ zostało dodane.')
    }

    await getAllFaq()
    resetForm()
  } catch (error) {
    console.error(error)
    toast.error(
      isEditing.value
        ? 'Nie udało się zaktualizować FAQ.'
        : 'Nie udało się dodać FAQ.'
    )
  } finally {
    isSaving.value = false
  }
}

const normalizeCompetitorFaqItems = (rawItems: any[]): ProductFaqAiReviewItem[] => {
  if (!Array.isArray(rawItems)) return []

  return rawItems
    .map((item, index) => ({
      question: String(item?.question ?? item?.Question ?? '').trim(),
      answer: String(item?.answer ?? item?.Answer ?? '').trim(),
      displayOrder: Number(item?.displayOrder ?? item?.DisplayOrder ?? index + 1),
      selected: true
    }))
    .filter((item) => item.question && item.answer)
}

const extractFaqResponseItems = (payload: any): any[] => {
  const candidates = [
    payload?.faqItems,
    payload?.FaqItems,
    payload?.data?.faqItems,
    payload?.data?.FaqItems,
    payload?.Data?.faqItems,
    payload?.Data?.FaqItems,
    payload?.data?.data?.faqItems,
    payload?.data?.data?.FaqItems,
    payload?.Data?.Data?.faqItems,
    payload?.Data?.Data?.FaqItems
  ]

  return candidates.find(Array.isArray) ?? []
}

const generateFaqWithAi = async () => {
  const url = aiFaqCompetitorUrl.value?.trim()
  if (!url) {
    toast.error('Podaj link do strony konkurencji.')
    return
  }

  if (!productId.value) {
    toast.error('Brak product.id.')
    return
  }

  aiFaqLoading.value = true

  try {
    const res = await Api.chatGpt.generateProductSeoFromCompetitor({
      body: JSON.stringify({
        productSeoFromCompetitorBriefDTO: {
          competitorUrl: url,
          availableAttributes: []
        }
      })
    })

    if (!res.ok) throw new Error('Błąd odpowiedzi serwera')

    const json = await res.json()
    const faqItems = normalizeCompetitorFaqItems(extractFaqResponseItems(json))

    if (!faqItems.length) {
      toast.error('AI nie zwróciło propozycji FAQ.')
      return
    }

    aiFaqReviewItems.value = faqItems
    aiFaqUrlModalVisible.value = false
    aiFaqReviewVisible.value = true
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się wygenerować FAQ.')
  } finally {
    aiFaqLoading.value = false
  }
}

const applySelectedAiFaq = async (payload: {
  faqItems: ProductFaqAiReviewItem[]
}) => {
  if (!productId.value) return

  aiFaqApplyLoading.value = true

  try {
    for (const faq of payload.faqItems) {
      await Api.productFaq.create({
        body: JSON.stringify({
          productId: productId.value,
          question: faq.question,
          answer: faq.answer,
          displayOrder: Number(faq.displayOrder ?? 0),
          isPublished: true
        })
      })
    }

    await getAllFaq()
    aiFaqReviewVisible.value = false
    toast.success(`Dodano ${payload.faqItems.length} wpisów FAQ.`)
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się dodać wybranych FAQ.')
  } finally {
    aiFaqApplyLoading.value = false
  }
}

const removeFaq = async (id: string) => {
  if (!id) return

  const confirmed = window.confirm('Czy na pewno chcesz usunąć ten wpis FAQ?')
  if (!confirmed) return

  isSaving.value = true

  try {
    await Api.productFaq.removeProductFaq(id)
    items.value = items.value.filter(x => x.id !== id)

    if (editingId.value === id) {
      resetForm()
    }

    toast.success('FAQ zostało usunięte.')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się usunąć FAQ.')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => productId.value,
  async () => {
    resetForm()
    await getAllFaq()
  },
  { immediate: true }
)

watch(
  () => (props.product as any)?.productFaqItems,
  () => {
    if (!items.value.length) {
      hydrateFromProps()
    }
  },
  { deep: true }
)

onMounted(() => {
  hydrateFromProps()
  resetForm()
})
</script>

<template>
  <div>
    <FormSection title="FAQ produktu">
      <div class="px-10 mb-4 flex justify-end">
        <el-button type="warning" :disabled="!productId" @click="aiFaqUrlModalVisible = true">
          Generuj FAQ z AI
        </el-button>
      </div>

      <div class="flex gap-10 w-full justify-between px-10">
        <div class="w-[42%] rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ isEditing ? 'Edytuj FAQ' : 'Dodaj nowe FAQ' }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Uzupełnij pytanie i odpowiedź przypisaną do produktu.
              </p>
            </div>

            <button
              v-if="isEditing"
              type="button"
              class="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              :disabled="isSaving"
              @click="cancelEdit"
            >
              Anuluj edycję
            </button>
          </div>

          <div class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Pytanie
              </label>
              <input
                v-model="form.question"
                type="text"
                class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Np. Czy produkt jest dostępny od ręki?"
                :disabled="isSaving"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Odpowiedź
              </label>
              <textarea
                v-model="form.answer"
                rows="6"
                class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Wpisz treść odpowiedzi..."
                :disabled="isSaving"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-end">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Display order
                </label>
                <input
                  v-model.number="form.displayOrder"
                  type="number"
                  min="0"
                  class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  :disabled="isSaving"
                />
              </div>

              <div class="flex items-center">
                <label class="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 cursor-pointer">
                  <input
                    v-model="form.isPublished"
                    type="checkbox"
                    class="h-4 w-4"
                    :disabled="isSaving"
                  />
                  <span class="text-sm font-medium text-gray-700">Opublikowane</span>
                </label>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isSaving || !productId"
                @click="saveFaq"
              >
                {{ isSaving ? 'Zapisywanie...' : (isEditing ? 'Zapisz zmiany' : 'Dodaj FAQ') }}
              </button>
            </div>
          </div>
        </div>

        <div class="w-[58%] rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Lista FAQ</h3>
              <p class="text-sm text-gray-500 mt-1">
                Wszystkie pytania i odpowiedzi przypisane do tego produktu.
              </p>
            </div>

            <span
              v-if="isLoading"
              class="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
            >
              Ładowanie...
            </span>
          </div>

          <div
            v-if="items.length === 0 && !isLoading"
            class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500"
          >
            Brak wpisów FAQ dla tego produktu.
          </div>

          <div
            v-else
            class="space-y-3 max-h-[720px] overflow-y-auto pr-2"
          >
            <div
              v-for="item in items"
              :key="item.id"
              class="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-sm hover:shadow-md transition"
            >
              <div class="flex items-start justify-between gap-4 mb-3">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100">
                      FAQ
                    </span>

                    <span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700 border border-gray-200">
                      Kolejność: {{ item.displayOrder }}
                    </span>

                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border"
                      :class="item.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-100'"
                    >
                      {{ item.isPublished ? 'Opublikowane' : 'Ukryte' }}
                    </span>
                  </div>

                  <div class="text-sm font-semibold text-gray-900 leading-6 break-words">
                    {{ item.question }}
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                    :disabled="isSaving"
                    @click="startEdit(item)"
                  >
                    Edytuj
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                    :disabled="isSaving"
                    @click="removeFaq(item.id)"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              <div class="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                  Odpowiedź
                </div>

                <div class="text-sm leading-6 text-gray-700 whitespace-pre-line break-words">
                  {{ item.answer }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FormSection>

    <el-dialog v-model="aiFaqUrlModalVisible" title="Generuj FAQ z AI" width="560px">
      <p class="text-sm text-gray-600 mb-4">
        Wklej link do strony konkurencji. AI zaproponuje pytania i odpowiedzi — wybierzesz checkboxami,
        które dodać do produktu.
      </p>
      <FormKit
        type="text"
        v-model="aiFaqCompetitorUrl"
        label="Link do produktu u konkurencji"
        placeholder="https://..."
        validation="required"
        validation-visibility="live"
      />
      <template #footer>
        <el-button @click="aiFaqUrlModalVisible = false">Anuluj</el-button>
        <el-button
          type="primary"
          :loading="aiFaqLoading"
          :disabled="!aiFaqCompetitorUrl?.trim()"
          @click="generateFaqWithAi"
        >
          Generuj propozycje FAQ
        </el-button>
      </template>
    </el-dialog>

    <ProductFaqAiReviewModal
      v-if="aiFaqReviewVisible"
      :loading="aiFaqApplyLoading"
      :product-name="(product as any)?.name"
      :faq-items="aiFaqReviewItems"
      @close="aiFaqReviewVisible = false"
      @apply="applySelectedAiFaq"
    />
  </div>
</template>