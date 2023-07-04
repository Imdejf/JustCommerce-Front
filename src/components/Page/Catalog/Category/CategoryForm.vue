<script lang="ts" setup>
import { computed, ref, reactive, watch, watchEffect, onMounted } from 'vue'
import DropZone from '../../../Form/File/DropZone.vue'
import type { CategoryDTO } from '/@/types/category/Category'
import { FileDTO } from '/@/types/file/File'
import { Api } from '/@/services/api'
import DropDown from '../../../Form/DropDown/DropDown.vue'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import { useRoute, useRouter } from 'vue-router'
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

const dropzone = ref(null)

if (props.updated) {
  currentCategory.categoryId = route.params.id
}

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
      console.log(route.params.id)
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

watch(
  currentCategory.thumbnailImage,
  (newThumbnailImage, oldThumbnailImage) => {
    file.value = {
      Media: {
        SeoFileName: newThumbnailImage.seoFileName,
        AltAttribute: newThumbnailImage.altAttribute,
        TitleAttribute: newThumbnailImage.title,
        MediaLangs: newThumbnailImage.mediaLangs
      },
      BlobFolder: 0,
      Watermark: false
    }
  },
  { deep: true }
)

const selected = ref(null)

onMounted(() => {
  allCategories()
})
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormSection :title="'Zdjęcie kategorii'">
      {{ files }}
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
        <FormSection title="Opis">
          <HtmlEditor v-model="currentCategory.description" />
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
          <FormSection title="Opis">
            <HtmlEditor v-model="currentCategory.categoryLangs[index].description" />
          </FormSection>
        </div>
      </div>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
