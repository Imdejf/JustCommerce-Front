<script lang="ts" setup>
import { computed, ref, reactive, watch, watchEffect, onMounted } from 'vue'
import DropZone from '../../../Form/File/DropZone.vue'
import type { CategoryDTO } from '/@/types/category/Category'
import type { AttributeGroupDTO } from '/@/types/attributeGroup/AttributeGroup'
import { FileDTO } from '/@/types/file/File'
import { Api } from '/@/services/api'
import DropDown from '../../../Form/DropDown/DropDown.vue'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import { useRoute, useRouter } from 'vue-router'
import Cookies from 'universal-cookie'

const props = defineProps({
  category: {
    type: Object as ObjectConstructor,
    default: () => ({} as CategoryDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const cookies = new Cookies()
const router = useRouter()
const route = useRoute()
const files = ref(null)
const language = useLanguageStore()
const store = useStoreStore()
const toast = useToast()

const currentCategory = reactive(props.category)

const file = ref<FileDTO | null>(null)

const myForm = ref(null)
const categories = ref([])
const attributeGroups = ref<Array<Pick<AttributeGroupDTO, 'id' | 'name'>>>([])
const allegroCategoryModalVisible = ref(false)
const allegroCategoryLoading = ref(false)
const allegroCategories = ref([])
const allegroCategoryPath = ref([])

const dropzone = ref(null)

if (props.updated) {
  currentCategory.categoryId = route.params.id
}

currentCategory.attributeGroupIds = currentCategory.attributeGroupIds ?? []

const handleSave = async (values) => {
  if (files.value) {
    currentCategory.storeId = store.selectedStore.id
    currentCategory.thumbnailImage.filePath = files.value?.path
    currentCategory.thumbnailImage.mediaLangs.forEach((mediaLang) => {
      const matchingPath = files.value?.pathLang.find(
        (pathLang) => pathLang.languageId === mediaLang.languageId
      )
      if (matchingPath) {
        mediaLang.filePath = matchingPath.path
      }
    })
  }

  try {
    const payload = {
      body: JSON.stringify(currentCategory)
    }
    if (!props.updated) {
      await Api.categories.create(payload)
      toast.success('Dodano kategorie', {
        timeout: 2000
      })
    } else {
      await Api.categories.update(payload)
      toast.success('Edytowano kategorie', {
        timeout: 2000
      })
    }
    router.go(-1)
  } catch (error) {
    toast.error('Wystąpił błąd', {
      timeout: 2000
    })
  }
}

const filteredLanguages = computed(() => {
  return language.languages.filter((formLanguage) => {
    return language.selectedLanguage?.id === formLanguage.id
  })
})

const slugGenerator = () => {
  if (!currentCategory.name) {
    toast.error('Błędna nazwa kategorii', {
      timeout: 2000
    })
    return
  }

  const slug = currentCategory.name
    .trim() // Usuwanie spacji na początku i końcu
    .toLowerCase() // Zamiana na małe litery
    .replace(/\s+/g, '-') // Zamiana spacji na myślniki

  currentCategory.slug = slug
}

const allCategories = async () => {
  const result = await Api.categories.listByStoreId()
  categories.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

const allAttributeGroups = async () => {
  const result = await Api.attributeGroups.listByStoreId()
  attributeGroups.value = result.items.map((item: AttributeGroupDTO) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

const normalizeList = (result) => {
  const data = result?.data || result

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items

  return []
}

const loadAllegroCategories = async (parentId = null) => {
  allegroCategoryLoading.value = true

  try {
    const result = await Api.allegro.getCategories(parentId)
    allegroCategories.value = normalizeList(result)
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać kategorii Allegro.')
  } finally {
    allegroCategoryLoading.value = false
  }
}

const openAllegroCategoryModal = async () => {
  allegroCategoryModalVisible.value = true
  allegroCategoryPath.value = []
  await loadAllegroCategories(null)
}

const selectAllegroCategory = async (category) => {
  allegroCategoryPath.value.push({
    id: category.id,
    name: category.name
  })

  await loadAllegroCategories(category.id)

  if (!allegroCategories.value.length || category.leaf) {
    currentCategory.allegroCategoryId = category.id
    currentCategory.allegroCategoryName = category.name
    allegroCategoryModalVisible.value = false
  }
}

const goToAllegroCategoryLevel = async (index) => {
  allegroCategoryPath.value = allegroCategoryPath.value.slice(0, index + 1)
  const category = allegroCategoryPath.value[index]
  await loadAllegroCategories(category.id)
}

const goBackAllegroCategory = async () => {
  allegroCategoryPath.value.pop()
  const parent = allegroCategoryPath.value[allegroCategoryPath.value.length - 1]
  await loadAllegroCategories(parent?.id ?? null)
}

const confirmAllegroCategory = () => {
  const selected = allegroCategoryPath.value[allegroCategoryPath.value.length - 1]
  if (!selected) return

  currentCategory.allegroCategoryId = selected.id
  currentCategory.allegroCategoryName = selected.name
  allegroCategoryModalVisible.value = false
}

const clearAllegroCategory = () => {
  currentCategory.allegroCategoryId = null
  currentCategory.allegroCategoryName = null
}

watch(
  currentCategory.thumbnailImage,
  (newThumbnailImage, oldThumbnailImage) => {
    file.value = {
      media: {
        seoFileName: newThumbnailImage.seoFileName,
        altAttribute: newThumbnailImage.altAttribute,
        titleAttribute: newThumbnailImage.title,
        mediaLangs: newThumbnailImage.mediaLangs
      },
      blobFolder: 0,
      watermark: false,
      thumbnail: true
    }
  },
  { deep: true }
)

const selected = ref(null)

onMounted(() => {
  allCategories()
  allAttributeGroups()
})
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormSection :title="'Zdjęcie kategorii'">
      <DropZone
        ref="dropzone"
        :fileInfo="file"
        :url="currentCategory.thumbnailImage.filePath"
        v-model="files"
      ></DropZone>
    </FormSection>
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Zdjęcie SEO'">
          <FormKit
            type="text"
            v-model="currentCategory.thumbnailImage.seoFileName"
            label="Nazwa SEO"
            validation="required"
            validation-visibility="live"
            help="Nazwa pod jaką plik ma zostać zapisany"
          />
          <FormKit
            type="text"
            v-model="currentCategory.thumbnailImage.altAttribute"
            label="Alt atrybut"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentCategory.thumbnailImage.titleAttribute"
            label="Tytuł atrybutu"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
        <FormSection
          ><DropDown
            label="Kategoria nadrzędna"
            v-model="currentCategory.parentCategoryId"
            :value="currentCategory.parentCategoryId"
            :options="categories"
          />
        </FormSection>
        <FormSection title="Grupy atrybutów">
          <el-select
            v-model="currentCategory.attributeGroupIds"
            multiple
            filterable
            clearable
            placeholder="Wybierz grupy atrybutów"
            class="w-full"
          >
            <el-option
              v-for="attributeGroup in attributeGroups"
              :key="attributeGroup.id"
              :label="attributeGroup.name"
              :value="attributeGroup.id"
            />
          </el-select>
        </FormSection>
        <FormSection title="Domyślna kategoria Allegro">
          <div class="w-full rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div v-if="currentCategory.allegroCategoryId" class="mb-4">
              <div class="text-sm font-semibold text-slate-900">
                {{ currentCategory.allegroCategoryName || currentCategory.allegroCategoryId }}
              </div>
              <div class="text-xs text-slate-500 mt-1">
                ID Allegro: {{ currentCategory.allegroCategoryId }}
              </div>
            </div>
            <div v-else class="mb-4 text-sm text-slate-500">
              Brak przypisanej domyślnej kategorii Allegro.
            </div>

            <div class="flex gap-3">
              <el-button type="primary" round @click="openAllegroCategoryModal">
                Wybierz kategorię Allegro
              </el-button>
              <el-button
                v-if="currentCategory.allegroCategoryId"
                type="danger"
                plain
                round
                @click="clearAllegroCategory"
              >
                Wyczyść
              </el-button>
            </div>
          </div>
        </FormSection>
        <FormSection :title="'Kategoria'">
          <FormKit
            type="text"
            v-model="currentCategory.name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentCategory.slug"
            label="Slug"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <div class="mt-7">
            <el-button @click="slugGenerator" color="#ea580c" round>Generuj slug</el-button>
          </div>
        </FormSection>
        <FormSection :title="'SEO'">
          <FormKit
            type="text"
            v-model="currentCategory.metaTitle"
            label="Meta tytuł"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentCategory.metaKeywords"
            label="Słowa kluczowe"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="textarea"
            label="Meta opis"
            v-model="currentCategory.metaDescription"
            rows="10"
            placeholder="Podaj opis meta"
            help="Pamiętej długość nie powinna przekraczać 170 liter!"
            validation="required"
            validation-visibility="live"
            :sections-schema="{
              outer: {
                $el: 'div',
                attrs: {
                  style: { width: '100%' }
                }
              }
            }"
          />
        </FormSection>
        <FormSection title="Skrócony opis">
          <HtmlEditor v-model="currentCategory.shortDescription" />
        </FormSection>
        <FormSection title="Opis">
          <HtmlEditor v-model="currentCategory.description" />
        </FormSection>
        <FormSection title="Zewnętrzni dostawcy">
          <FormKit
            type="text"
            v-model="currentCategory.gmcCategory"
            label="GMC"
            help="Kategoria GMC"
          />
        </FormSection>
        <FormSection title="Ustawienia" class="block">
          <FormKit
            type="number"
            help=""
            label="Kolejność wyświetlania"
            v-model="currentCategory.displayOrder"
            value="0"
            step="1"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Wyróżnij"
            help=""
            v-model="currentCategory.highlight"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Najczęściej odwiedzane"
            help=""
            v-model="currentCategory.mostVisited"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Zamieść w menu"
            help=""
            v-model="currentCategory.includeInMenu"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Widoczny"
            help=""
            v-model="currentCategory.isPublished"
            :value="false"
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.Id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Zdjęcie SEO'">
            <FormKit
              type="text"
              v-model="currentCategory.thumbnailImage.mediaLangs[index].seoFileName"
              label="Nazwa SEO"
              validation="required"
              validation-visibility="live"
              help="Nazwa pod jaką plik ma zostać zapisany"
            />
            <FormKit
              type="text"
              v-model="currentCategory.thumbnailImage.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentCategory.thumbnailImage.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'Kategoria'">
            <FormKit
              type="text"
              v-model="currentCategory.categoryLangs[index].name"
              label="Nazwa"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'SEO'">
            <FormKit
              type="text"
              v-model="currentCategory.categoryLangs[index].metaTitle"
              label="Meta tytuł"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentCategory.categoryLangs[index].metaKeywords"
              label="Słowa kluczowe"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection>
            <FormKit
              type="textarea"
              label="Meta opis"
              v-model="currentCategory.categoryLangs[index].metaDescription"
              rows="10"
              placeholder="Podaj opis meta"
              help="Pamiętej długość nie powinna przekraczać 170 liter!"
              validation="required"
              validation-visibility="live"
              :sections-schema="{
                outer: {
                  $el: 'div',
                  attrs: {
                    style: { width: '100%' }
                  }
                }
              }"
            />
          </FormSection>
          <FormSection title="Skrócony opis">
            <HtmlEditor v-model="currentCategory.categoryLangs[index].shortDescription" />
          </FormSection>
          <FormSection title="Opis">
            <HtmlEditor v-model="currentCategory.categoryLangs[index].description" />
          </FormSection>
        </div>
      </div>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>

    <el-dialog
      v-model="allegroCategoryModalVisible"
      title="Wybierz kategorię Allegro"
      width="900px"
      destroy-on-close
    >
      <div v-loading="allegroCategoryLoading" class="space-y-4">
        <div
          v-if="allegroCategoryPath.length"
          class="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3"
        >
          <div class="text-xs text-[#64748b] mb-1">Wybrana ścieżka:</div>
          <div class="flex flex-wrap items-center gap-2 text-sm">
            <template
              v-for="(item, index) in allegroCategoryPath"
              :key="item.id"
            >
              <button
                class="font-semibold text-[#00796b] hover:underline"
                type="button"
                @click="goToAllegroCategoryLevel(index)"
              >
                {{ item.name }}
              </button>
              <span v-if="index < allegroCategoryPath.length - 1" class="text-[#94a3b8]">
                /
              </span>
            </template>
          </div>
        </div>

        <div class="border border-[#d6dfe9] rounded-xl overflow-hidden">
          <div class="bg-[#f1f5f9] px-4 py-3 text-xs font-semibold text-[#475569]">
            {{ allegroCategoryPath.length ? 'Kategorie podrzędne' : 'Kategorie główne' }}
          </div>

          <div class="max-h-[430px] overflow-auto">
            <button
              v-for="category in allegroCategories"
              :key="category.id"
              class="w-full flex justify-between items-center px-4 py-3 border-b border-[#e5e7eb] text-left hover:bg-[#f8fafc]"
              type="button"
              @click="selectAllegroCategory(category)"
            >
              <div>
                <div class="text-sm font-semibold text-[#111827]">
                  {{ category.name }}
                </div>
                <div class="text-xs text-[#64748b] mt-1">
                  ID kategorii {{ category.id }}
                </div>
              </div>

              <div class="text-xs text-[#00796b] font-semibold">
                {{ category.leaf ? 'Wybierz' : 'Dalej' }}
              </div>
            </button>

            <el-empty
              v-if="!allegroCategories.length"
              description="Brak kolejnych podkategorii"
            />
          </div>
        </div>

        <div
          v-if="allegroCategoryPath.length"
          class="flex justify-between items-center"
        >
          <el-button @click="goBackAllegroCategory">Wróć poziom wyżej</el-button>
          <el-button color="#ea580c" @click="confirmAllegroCategory">
            Zatwierdź tę kategorię
          </el-button>
        </div>
      </div>
    </el-dialog>
  </ContentContainer>
</template>
