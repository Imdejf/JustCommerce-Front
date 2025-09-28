<script lang="ts" setup>
import type { CategoryDTO } from '/@/types/category/Category.ts'
import { onMounted, ref, watch } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

interface PostDTO {
  id: string;
  name: string;
}

interface CategoryWithPostDTO {
  categoryId: string;
  categoryName: string;
  posts: PostDTO[];
}

const props = defineProps({
  category: {
    type: Object as () => CategoryDTO,
    default: () => null
  }
})

const cookies = new Cookies()
const toast = useToast()

const categoriesWithPostList = ref<Array<CategoryWithPostDTO>>([])

// WYBÓR: tylko jedna kategoria naraz
const selectedCategoryId = ref<string | null>(null)
const selectedPostIds = ref<string[]>([])

// BLOKADA UI podczas zapisu
const isBusy = ref(false)

const isPostSelected = (postId: string) => selectedPostIds.value.includes(postId)

const isCategoryAllSelected = (cat: CategoryWithPostDTO) => {
  const ids = (cat.posts ?? []).map(p => p.id)
  return ids.length > 0 && ids.every(id => selectedPostIds.value.includes(id))
}

const isCategoryPartiallySelected = (cat: CategoryWithPostDTO) => {
  const ids = (cat.posts ?? []).map(p => p.id)
  const any = ids.some(id => selectedPostIds.value.includes(id))
  return any && !isCategoryAllSelected(cat)
}

// Blokada: jeśli wybrana jest jakaś kategoria, inne są wyłączone
const isOtherCategoryDisabled = (cat: CategoryWithPostDTO) =>
  selectedCategoryId.value !== null && selectedCategoryId.value !== cat.categoryId

// ===== Preselekcja z props.category.categoryBlogItems =====
type CategoryBlogItemLink = { categoryId: string; blogId: string }

const getLinksFromProps = (): CategoryBlogItemLink[] => {
  const arr = (props.category as any)?.categoryBlogItems as CategoryBlogItemLink[] | undefined
  if (!Array.isArray(arr)) return []
  return arr.filter(l => l && typeof l === 'object' && 'blogId' in l && 'categoryId' in l)
}

/** Wybierz kategorię z największą liczbą trafień i zaznacz odpowiadające blogId */
const hydrateSelectionFromProps = () => {
  const links = getLinksFromProps()
  if (links.length === 0 || categoriesWithPostList.value.length === 0) return

  const wanted = new Set(links.map(l => l.blogId))

  // znajdź kategorię z największą liczbą dopasowanych postów
  let bestCatId: string | null = null
  let bestMatches: string[] = []
  for (const cat of categoriesWithPostList.value) {
    const matches = (cat.posts ?? []).filter(p => wanted.has(p.id)).map(p => p.id)
    if (matches.length > bestMatches.length) {
      bestMatches = matches
      bestCatId = cat.categoryId
    }
  }

  if (bestCatId && bestMatches.length > 0) {
    selectedCategoryId.value = bestCatId
    selectedPostIds.value = bestMatches
  } else {
    // nic nie dopasowano – brak preselekcji
    selectedCategoryId.value = null
    selectedPostIds.value = []
  }
}

// ===== API helpers (payload camelCase: { blogId, categoryId } z props.category.id) =====
const getCategoryIdFromProps = () => (props.category as any)?.id as string | undefined

const addPostToCategory = async (blogId: string) => {
  const categoryId = getCategoryIdFromProps()
  if (!categoryId) {
    toast.error('Brak category.id w propsach – nie mogę zapisać powiązania.')
    return
  }
  const payload = { body: JSON.stringify({ blogId, categoryId }) }
  await Api.categories.addBlogItemToCategory(payload)
}

const removePostFromCategory = async (blogId: string) => {
  const categoryId = getCategoryIdFromProps()
  if (!categoryId) {
    toast.error('Brak category.id w propsach – nie mogę usunąć powiązania.')
    return
  }
  const payload = { body: JSON.stringify({ blogId, categoryId }) }
  await Api.categories.removeBlogItemToCategory(payload)
}

// ===== Handlery wyboru =====
const toggleCategoryAll = async (cat: CategoryWithPostDTO, checked: boolean) => {
  if (checked) {
    if (selectedCategoryId.value && selectedCategoryId.value !== cat.categoryId) {
      toast.error('Możesz wybrać posty tylko z jednej kategorii.')
      return
    }
    const idsToAdd = (cat.posts ?? []).map(p => p.id).filter(id => !selectedPostIds.value.includes(id))
    if (idsToAdd.length === 0) {
      selectedCategoryId.value = cat.categoryId
      return
    }

    isBusy.value = true
    try {
      selectedCategoryId.value = cat.categoryId
      await Promise.all(idsToAdd.map(id => addPostToCategory(id)))
      const set = new Set(selectedPostIds.value)
      idsToAdd.forEach(id => set.add(id))
      selectedPostIds.value = Array.from(set)
      toast.success('Dodano posty do kategorii.')
    } catch {
      toast.error('Nie udało się dodać wszystkich postów do kategorii.')
    } finally {
      isBusy.value = false
    }
  } else {
    const idsInCat = (cat.posts ?? []).map(p => p.id)
    const idsToRemove = selectedPostIds.value.filter(id => idsInCat.includes(id))
    if (idsToRemove.length === 0) {
      selectedCategoryId.value = null
      return
    }

    isBusy.value = true
    try {
      await Promise.all(idsToRemove.map(id => removePostFromCategory(id)))
      const toRemove = new Set(idsToRemove)
      selectedPostIds.value = selectedPostIds.value.filter(id => !toRemove.has(id))
      if (selectedPostIds.value.length === 0) selectedCategoryId.value = null
      toast.success('Usunięto posty z kategorii.')
    } catch {
      toast.error('Nie udało się usunąć wszystkich postów z kategorii.')
    } finally {
      isBusy.value = false
    }
  }
}

const handleTogglePost = async (cat: CategoryWithPostDTO, postId: string, checked: boolean) => {
  if (checked) {
    if (selectedCategoryId.value && selectedCategoryId.value !== cat.categoryId) {
      toast.error('Możesz wybrać posty tylko z jednej kategorii.')
      return
    }
    isBusy.value = true
    try {
      selectedCategoryId.value = cat.categoryId
      await addPostToCategory(postId)
      if (!selectedPostIds.value.includes(postId)) {
        selectedPostIds.value = [...selectedPostIds.value, postId]
      }
      toast.success('Dodano post do kategorii.')
    } catch {
      toast.error('Nie udało się dodać posta do kategorii.')
    } finally {
      isBusy.value = false
    }
  } else {
    isBusy.value = true
    try {
      await removePostFromCategory(postId)
      selectedPostIds.value = selectedPostIds.value.filter(id => id !== postId)
      if (selectedPostIds.value.length === 0) selectedCategoryId.value = null
      toast.success('Usunięto post z kategorii.')
    } catch {
      toast.error('Nie udało się usunąć posta z kategorii.')
    } finally {
      isBusy.value = false
    }
  }
}

const getCategoryLabel = (cat: CategoryWithPostDTO) => {
  const total = (cat.posts ?? []).length
  if (!total) return cat.categoryName
  const selected = (cat.posts ?? []).filter(p => selectedPostIds.value.includes(p.id)).length
  return `${cat.categoryName} (${selected}/${total})`
}

const clearSelection = () => {
  selectedPostIds.value = []
  selectedCategoryId.value = null
}

const getAllCategory = async () => {
  const result = await Api.categoryBlogs.blogCateogryWithPost(cookies.get('dsStore'))
  categoriesWithPostList.value = result.data ?? []
  hydrateSelectionFromProps()
}

// Gdy dane się zmienią – odśwież preselekcję
watch(categoriesWithPostList, () => hydrateSelectionFromProps())
watch(() => (props.category as any)?.categoryBlogItems, () => {
  selectedCategoryId.value = null
  selectedPostIds.value = []
  hydrateSelectionFromProps()
}, { deep: true })

onMounted(async () => {
  await getAllCategory()
})
</script>

<template>
  <div class="">
    <FormSection :title="'Posty'">
      <div class="space-y-4">
        <div
          v-for="cat in categoriesWithPostList"
          :key="cat.categoryId"
          class="border rounded-md p-3"
        >
          <label class="font-medium flex items-center gap-2">
            <input
              type="checkbox"
              :checked="isCategoryAllSelected(cat)"
              :disabled="(isOtherCategoryDisabled(cat) && !isCategoryAllSelected(cat)) || isBusy"
              @change="(e:any) => toggleCategoryAll(cat, e.target.checked)"
            />
            {{ getCategoryLabel(cat) }}
            <span v-if="isCategoryPartiallySelected(cat)" class="text-xs text-gray-500">(częściowo)</span>
          </label>

          <div class="mt-2 pl-6 space-y-1">
            <label
              v-for="post in (cat.posts ?? [])"
              :key="post.id"
              class="flex items-center gap-2"
            >
              <input
                type="checkbox"
                :checked="isPostSelected(post.id)"
                :disabled="(isOtherCategoryDisabled(cat) && !isPostSelected(post.id)) || isBusy"
                @change="(e:any) => handleTogglePost(cat, post.id, e.target.checked)"
              />
              <span>{{ post.name }}</span>
            </label>

            <p v-if="!cat.posts || cat.posts.length === 0" class="text-sm text-gray-500">
              Brak postów w tej kategorii.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-4 text-sm text-gray-600">
        Zaznaczone posty: {{ selectedPostIds.length }}
        <span v-if="isBusy" class="ml-2 animate-pulse">Zapisywanie…</span>
      </div>
    </FormSection>
  </div>
</template>
