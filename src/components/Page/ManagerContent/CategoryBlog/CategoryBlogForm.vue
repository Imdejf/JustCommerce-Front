<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { BlogCategoryDTO } from '/@/types/blogCategory/BlogCategory'
import { FileDTO } from '/@/types/file/File'
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import Cookies from 'universal-cookie'
import DropZone from '../../../Form/File/DropZone.vue'

const props = defineProps({
  categoryBlog: {
    type: Object as ObjectConstructor,
    default: () => ({} as BlogCategoryDTO)
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const cookies = new Cookies()
const files = ref(null)
const file = ref<FileDTO | null>(null)
const route = useRoute()
const toast = useToast()
const language = useLanguageStore()

const currentCategoryBlog = reactive(props.categoryBlog)

if (props.updated) {
  currentCategoryBlog.id = route.params.id
}

const handleSave = async () => {
  if (files.value) {
    currentCategoryBlog.thumbnailImage.filePath = files.value?.path
    currentCategoryBlog.thumbnailImage.mediaLangs.forEach((mediaLang) => {
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
      body: JSON.stringify(currentCategoryBlog)
    }
    if (!props.updated) {
      await Api.categoryBlogs.create(payload)
      toast.success('Dodano kategorie bloga', {
        timeout: 2000
      })
    } else {
      await Api.categoryBlogs.update(payload)
      toast.success('Edytowano kategorie bloga', {
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

const slugGenerator = () => {
  if (!currentCategoryBlog.name) {
    toast.error('Błędna nazwa kategorii', {
      timeout: 2000
    })
    return
  }

  const slug = currentCategoryBlog.name
    .trim() // Usuwanie spacji na początku i końcu
    .toLowerCase() // Zamiana na małe litery
    .replace(/\s+/g, '-') // Zamiana spacji na myślniki

  currentCategoryBlog.slug = slug
}

watch(
  currentCategoryBlog.thumbnailImage,
  (newThumbnailImage, oldThumbnailImage) => {
    file.value = {
      Media: {
        SeoFileName: newThumbnailImage.seoFileName,
        AltAttribute: newThumbnailImage.altAttribute,
        TitleAttribute: newThumbnailImage.title,
        MediaLangs: newThumbnailImage.mediaLangs
      },
      BlobFolder: 2,
      Watermark: false
    }
  },
  { deep: true }
)
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormSection :title="'Zdjęcie kategorii'">
      <DropZone
        ref="dropzone"
        :fileInfo="file"
        :url="currentCategoryBlog.thumbnailImage.filePath"
        v-model="files"
      ></DropZone>
    </FormSection>
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Zdjęcie SEO'">
          <FormKit
            type="text"
            v-model="currentCategoryBlog.thumbnailImage.seoFileName"
            label="Nazwa SEO"
            validation="required"
            validation-visibility="live"
            help="Nazwa pod jaką plik ma zostać zapisany"
          />
          <FormKit
            type="text"
            v-model="currentCategoryBlog.thumbnailImage.altAttribute"
            label="Alt atrybut"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentCategoryBlog.thumbnailImage.titleAttribute"
            label="Tytuł atrybutu"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
        <FormSection :title="'Kategoria'">
          <FormKit
            type="text"
            v-model="currentCategoryBlog.name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentCategoryBlog.slug"
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
            v-model="currentCategoryBlog.metaTitle"
            label="Meta tytuł"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentCategoryBlog.metaKeywords"
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
            v-model="currentCategoryBlog.metaDescription"
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
          <HtmlEditor v-model="currentCategoryBlog.description" />
        </FormSection>
        <FormSection title="Ustawienia" class="block">
          <FormKit
            type="number"
            help=""
            label="Kolejność wyświetlania"
            v-model="currentCategoryBlog.displayOrder"
            value="0"
            step="1"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Widoczny"
            help=""
            v-model="currentCategoryBlog.isPublished"
            :value="false"
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.Id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Zdjęcie SEO'">
            <FormKit
              type="text"
              v-model="currentCategoryBlog.thumbnailImage.mediaLangs[index].seoFileName"
              label="Nazwa SEO"
              validation="required"
              validation-visibility="live"
              help="Nazwa pod jaką plik ma zostać zapisany"
            />
            <FormKit
              type="text"
              v-model="currentCategoryBlog.thumbnailImage.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentCategoryBlog.thumbnailImage.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'Kategoria'">
            <FormKit
              type="text"
              v-model="currentCategoryBlog.blogCategoryLangs[index].name"
              label="Nazwa"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'SEO'">
            <FormKit
              type="text"
              v-model="currentCategoryBlog.blogCategoryLangs[index].metaTitle"
              label="Meta tytuł"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentCategoryBlog.blogCategoryLangs[index].metaKeywords"
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
              v-model="currentCategoryBlog.blogCategoryLangs[index].metaDescription"
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
            <HtmlEditor v-model="currentCategoryBlog.blogCategoryLangs[index].description" />
          </FormSection>
        </div>
      </div>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
