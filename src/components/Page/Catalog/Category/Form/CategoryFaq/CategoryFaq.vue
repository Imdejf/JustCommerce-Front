<script lang="ts" setup>
import type { CategoryDTO, CategoryFaqItemDTO } from '/@/types/category/Category.ts'
import { computed, onMounted, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const props = defineProps({
  category: {
    type: Object as () => CategoryDTO,
    default: () => null
  }
})

const toast = useToast()

interface CategoryFaqFormModel {
  categoryFaqId?: string
  categoryId?: string
  question: string
  answer: string
  displayOrder: number
  isPublished: boolean
}

interface CategoryFaqViewModel {
  id: string
  categoryId: string
  question: string
  answer: string
  displayOrder: number
  isPublished: boolean
}

const items = ref<CategoryFaqViewModel[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const form = ref<CategoryFaqFormModel>({
  categoryFaqId: '',
  categoryId: '',
  question: '',
  answer: '',
  displayOrder: 1,
  isPublished: true
})

const categoryId = computed(() => (props.category as any)?.id as string | undefined)

const normalizeFaqItem = (item: any): CategoryFaqViewModel => {
  return {
    id: item?.id ?? item?.Id ?? '',
    categoryId: item?.categoryId ?? item?.CategoryId ?? '',
    question: item?.question ?? item?.Question ?? '',
    answer: item?.answer ?? item?.Answer ?? '',
    displayOrder: item?.displayOrder ?? item?.DisplayOrder ?? 0,
    isPublished: item?.isPublished ?? item?.IsPublished ?? false
  }
}

const sortItems = () => {
  items.value = [...items.value].sort((a, b) => a.displayOrder - b.displayOrder)
}

const hydrateFromProps = () => {
  const source = (props.category as any)?.categoryFaqItems as CategoryFaqItemDTO[] | undefined
  if (!Array.isArray(source)) {
    items.value = []
    return
  }

  items.value = source.map(normalizeFaqItem)
  sortItems()
}

const resetForm = () => {
  form.value = {
    categoryFaqId: '',
    categoryId: categoryId.value ?? '',
    question: '',
    answer: '',
    displayOrder: items.value.length > 0
      ? Math.max(...items.value.map(x => x.displayOrder)) + 1
      : 1,
    isPublished: true
  }
  isEditing.value = false
  editingId.value = null
}

const startEdit = (item: CategoryFaqViewModel) => {
  form.value = {
    categoryFaqId: item.id,
    question: item.question,
    answer: item.answer,
    displayOrder: item.displayOrder,
    isPublished: item.isPublished
  }

  isEditing.value = true
  editingId.value = item.id
}

const cancelEdit = () => {
  resetForm()
}

const getAllFaq = async () => {
  if (!categoryId.value) {
    items.value = []
    return
  }

  isLoading.value = true
  try {
    const result = await Api.categories.getCategoryFaqByCategoryId(categoryId.value)
    const data = result?.data ?? result ?? []
    items.value = Array.isArray(data) ? data.map(normalizeFaqItem) : []
    sortItems()
  } catch {
    hydrateFromProps()
    toast.error('Nie udało się pobrać FAQ kategorii.')
  } finally {
    isLoading.value = false
  }
}

const saveFaq = async () => {
  if (!categoryId.value) {
    toast.error('Brak category.id.')
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
    if (isEditing.value && form.value.categoryFaqId) {
      await Api.categories.updateCategoryFaq({
        categoryFaqId: form.value.categoryFaqId,
        question: form.value.question,
        answer: form.value.answer,
        displayOrder: Number(form.value.displayOrder ?? 0),
        isPublished: !!form.value.isPublished
      })

      toast.success('FAQ zostało zaktualizowane.')
    } else {
      await Api.categories.createCategoryFaq({
        categoryId: categoryId.value,
        question: form.value.question,
        answer: form.value.answer,
        displayOrder: Number(form.value.displayOrder ?? 0),
        isPublished: !!form.value.isPublished
      })

      toast.success('FAQ zostało dodane.')
    }

    await getAllFaq()
    resetForm()
  } catch {
    toast.error(isEditing.value
      ? 'Nie udało się zaktualizować FAQ.'
      : 'Nie udało się dodać FAQ.')
  } finally {
    isSaving.value = false
  }
}

const removeFaq = async (id: string) => {
  if (!id) return

  const confirmed = window.confirm('Czy na pewno chcesz usunąć ten wpis FAQ?')
  if (!confirmed) return

  isSaving.value = true
  try {
    await Api.categories.deleteCategoryFaq(id)
    items.value = items.value.filter(x => x.id !== id)

    if (editingId.value === id) {
      resetForm()
    }

    toast.success('FAQ zostało usunięte.')
  } catch {
    toast.error('Nie udało się usunąć FAQ.')
  } finally {
    isSaving.value = false
  }
}

watch(
  () => categoryId.value,
  async () => {
    resetForm()
    await getAllFaq()
  },
  { immediate: true }
)

watch(
  () => (props.category as any)?.categoryFaqItems,
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
    <FormSection title="FAQ kategorii">
      <div class="flex gap-10 w-full justify-between px-10">
        <div class="w-[42%] rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                {{ isEditing ? 'Edytuj FAQ' : 'Dodaj nowe FAQ' }}
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Uzupełnij pytanie i odpowiedź przypisaną do kategorii.
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
                placeholder="Np. Jak długo trwa realizacja zamówienia?"
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
                :disabled="isSaving || !categoryId"
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
                Wszystkie pytania i odpowiedzi przypisane do tej kategorii.
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
            Brak wpisów FAQ dla tej kategorii.
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
  </div>
</template>