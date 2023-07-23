<script lang="ts" setup>
import { onMounted, ref, defineProps } from 'vue'
import type { ProductDTO, ProductAttributeDTO } from '/@/types/product/Product'
import { Api } from '/@/services/api'
import { CategoryDTO } from '/@/types/category/Category'
import { useToast } from 'vue-toastification'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: () => null
  }
})

const toast = useToast()
const categoriesList = ref<Array<CategoryDTO>>([])
const selectedCategories = ref(props.product.categoryIds)

const getAllCategory = async () => {
  const result = await Api.categories.listByStoreId()
  categoriesList.value = result.items
}

const getCategoryNameWithParents = (category: CategoryDTO) => {
  const names = [category.name]
  let parent = category.parentCategory
  while (parent) {
    names.unshift(parent.name)
    parent = parent.parentCategory
  }
  return names.join(' >> ')
}

const toggleCategorySelection = (categoryId) => {
  const category = categoriesList.value.find((cat) => cat.id === categoryId)
  if (category) {
    if (category.parentCategory) {
      const parentId = category.parentCategory.id
      if (!selectedCategories.value.includes(parentId)) {
        selectedCategories.value.push(parentId)
        toggleCategorySelection(parentId) // Recursive call for parent's parent if it exists
      }
    }
    const childIds = categoriesList.value
      .filter((cat) => cat.parentCategory && cat.parentCategory.id === categoryId)
      .map((cat) => cat.id)
    if (childIds.length > 0) {
      if (selectedCategories.value.includes(categoryId)) {
        selectedCategories.value = [...selectedCategories.value]
      } else {
        selectedCategories.value = selectedCategories.value.filter((id) => !childIds.includes(id))
      }
    }
  }
}

const handleSave = async () => {
  const category = {
    productId: props.product.id,
    categoryIds: selectedCategories.value
  }
  const payload = {
    body: JSON.stringify(category)
  }

  await Api.products.updateCategory(payload)
  toast.success('Zapisano kategorie', {
    timeout: 2000
  })
}

onMounted(async () => {
  await getAllCategory()
})
</script>
<template>
  {{ produc }}
  <div>
    <div v-for="category in categoriesList" :key="category.id">
      <label>
        <input
          class=""
          type="checkbox"
          :value="category.id"
          v-model="selectedCategories"
          @change="toggleCategorySelection(category.id)"
        />
        {{ getCategoryNameWithParents(category) }}
      </label>
    </div>
    <div class="float-right mx-10 mt-5">
      <el-button @click="handleSave" type="primary" round>Zapisz</el-button>
    </div>
  </div>
</template>
