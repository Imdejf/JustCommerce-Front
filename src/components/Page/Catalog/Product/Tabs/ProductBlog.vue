<script lang="ts" setup>
import type { ProductDTO } from '/@/types/product/Product.ts'
import { onMounted, ref, watch, computed } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

interface PostDTO {
  id: string
  name: string
}

interface CategoryWithPostDTO {
  categoryId: string
  categoryName: string
  posts: PostDTO[]
}

interface ProductBlogRelationDTO {
  productId: string
  blogItemId: string
  displayOrder: number
}

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})

const cookies = new Cookies()
const toast = useToast()

const categoriesWithPostList = ref<Array<CategoryWithPostDTO>>([])
const selectedPostIds = ref<string[]>([])
const productRelations = ref<ProductBlogRelationDTO[]>([])
const isBusy = ref(false)
const isLoading = ref(false)

const productId = computed(() => (props.product as any)?.id as string | undefined)

const normalizeRelation = (item: any): ProductBlogRelationDTO => {
  return {
    productId: item?.productId ?? item?.ProductId ?? '',
    blogItemId: item?.blogItemId ?? item?.BlogItemId ?? '',
    displayOrder: Number(item?.displayOrder ?? item?.DisplayOrder ?? 0)
  }
}

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

const hydrateSelectionFromRelations = () => {
  selectedPostIds.value = productRelations.value.map(x => x.blogItemId)
}

const getProductDisplayOrder = (blogItemId: string) => {
  const existing = productRelations.value.find(x => x.blogItemId === blogItemId)
  if (existing) return Number(existing.displayOrder ?? 0)

  if (productRelations.value.length === 0) return 1

  return Math.max(...productRelations.value.map(x => Number(x.displayOrder ?? 0))) + 1
}

const addPostToProduct = async (blogItemId: string) => {
  if (!productId.value) {
    toast.error('Brak product.id w propsach – nie mogę zapisać powiązania.')
    return
  }

  const payload = {
    body: JSON.stringify({
      productId: productId.value,
      blogItemId,
      displayOrder: getProductDisplayOrder(blogItemId)
    })
  }

  await Api.products.addProductBlogItem(payload)
}

const removePostFromProduct = async (blogItemId: string) => {
  if (!productId.value) {
    toast.error('Brak product.id w propsach – nie mogę usunąć powiązania.')
    return
  }

  const payload = {
    body: JSON.stringify({
      productId: productId.value,
      blogItemId
    })
  }

  await Api.products.removeProductBlogItem(payload)
}

const getCategoryLabel = (cat: CategoryWithPostDTO) => {
  const total = (cat.posts ?? []).length
  if (!total) return cat.categoryName

  const selected = (cat.posts ?? []).filter(p => selectedPostIds.value.includes(p.id)).length
  return `${cat.categoryName} (${selected}/${total})`
}

const toggleCategoryAll = async (cat: CategoryWithPostDTO, checked: boolean) => {
  if (checked) {
    const idsToAdd = (cat.posts ?? [])
      .map(p => p.id)
      .filter(id => !selectedPostIds.value.includes(id))

    if (idsToAdd.length === 0) return

    isBusy.value = true
    try {
      await Promise.all(idsToAdd.map(id => addPostToProduct(id)))

      const set = new Set(selectedPostIds.value)
      idsToAdd.forEach(id => set.add(id))
      selectedPostIds.value = Array.from(set)

      await getProductBlogItems()
      toast.success('Dodano posty do produktu.')
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się dodać wszystkich postów do produktu.')
    } finally {
      isBusy.value = false
    }
  } else {
    const idsInCat = (cat.posts ?? []).map(p => p.id)
    const idsToRemove = selectedPostIds.value.filter(id => idsInCat.includes(id))

    if (idsToRemove.length === 0) return

    isBusy.value = true
    try {
      await Promise.all(idsToRemove.map(id => removePostFromProduct(id)))
      const toRemove = new Set(idsToRemove)
      selectedPostIds.value = selectedPostIds.value.filter(id => !toRemove.has(id))

      await getProductBlogItems()
      toast.success('Usunięto posty z produktu.')
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się usunąć wszystkich postów z produktu.')
    } finally {
      isBusy.value = false
    }
  }
}

const handleTogglePost = async (postId: string, checked: boolean) => {
  isBusy.value = true

  try {
    if (checked) {
      await addPostToProduct(postId)

      if (!selectedPostIds.value.includes(postId)) {
        selectedPostIds.value = [...selectedPostIds.value, postId]
      }

      toast.success('Dodano post do produktu.')
    } else {
      await removePostFromProduct(postId)
      selectedPostIds.value = selectedPostIds.value.filter(id => id !== postId)
      toast.success('Usunięto post z produktu.')
    }

    await getProductBlogItems()
  } catch (error) {
    console.error(error)
    toast.error(
      checked
        ? 'Nie udało się dodać posta do produktu.'
        : 'Nie udało się usunąć posta z produktu.'
    )
  } finally {
    isBusy.value = false
  }
}

const getAllCategory = async () => {
  const result = await Api.categoryBlogs.blogCateogryWithPost(cookies.get('dsStore'))
  categoriesWithPostList.value = result?.data ?? []
}

const getProductBlogItems = async () => {
  if (!productId.value) {
    productRelations.value = []
    selectedPostIds.value = []
    return
  }

  const result = await Api.products.getProductBlogItem(productId.value)
  const data = result?.data ?? result ?? []
  productRelations.value = Array.isArray(data) ? data.map(normalizeRelation) : []
  hydrateSelectionFromRelations()
}

const loadData = async () => {
  if (!productId.value) {
    categoriesWithPostList.value = []
    selectedPostIds.value = []
    productRelations.value = []
    return
  }

  isLoading.value = true
  try {
    await Promise.all([
      getAllCategory(),
      getProductBlogItems()
    ])
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać blogów produktu.')
  } finally {
    isLoading.value = false
  }
}

watch(
  () => productId.value,
  async () => {
    await loadData()
  },
  { immediate: true }
)

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div>
    <FormSection title="Blog produktu">
      <div class="space-y-4 px-10">
        <div
          v-if="isLoading"
          class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500"
        >
          Ładowanie...
        </div>

        <template v-else>
          <div
            v-for="cat in categoriesWithPostList"
            :key="cat.categoryId"
            class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4"
          >
            <label class="font-medium flex items-center gap-2 text-gray-900">
              <input
                type="checkbox"
                :checked="isCategoryAllSelected(cat)"
                :disabled="isBusy"
                @change="(e:any) => toggleCategoryAll(cat, e.target.checked)"
              />
              {{ getCategoryLabel(cat) }}
              <span
                v-if="isCategoryPartiallySelected(cat)"
                class="text-xs text-gray-500"
              >
                (częściowo)
              </span>
            </label>

            <div class="mt-3 pl-6 space-y-2">
              <label
                v-for="post in (cat.posts ?? [])"
                :key="post.id"
                class="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  :checked="isPostSelected(post.id)"
                  :disabled="isBusy"
                  @change="(e:any) => handleTogglePost(post.id, e.target.checked)"
                />
                <span>{{ post.name }}</span>
              </label>

              <p
                v-if="!cat.posts || cat.posts.length === 0"
                class="text-sm text-gray-500"
              >
                Brak postów w tej kategorii.
              </p>
            </div>
          </div>

          <div class="text-sm text-gray-600">
            Zaznaczone posty: {{ selectedPostIds.length }}
            <span
              v-if="isBusy"
              class="ml-2 animate-pulse"
            >
              Zapisywanie…
            </span>
          </div>
        </template>
      </div>
    </FormSection>
  </div>
</template>