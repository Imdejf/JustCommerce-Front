<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import type { PostBlogDTO } from '/@/types/postBlog/PostBlog'
import { FileDTO } from '/@/types/file/File'
import { computed, ref, reactive, watch, onMounted } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import Cookies from 'universal-cookie'
import DropZone from '../../../Form/File/DropZone.vue'
import DropDown from '../../../Form/DropDown/DropDown.vue'

const props = defineProps({
  postBlog: {
    type: Object as ObjectConstructor,
    default: () => ({} as PostBlogDTO)
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
const blogCategories = ref([])

const currentPostBlog = reactive(props.postBlog)

if (props.updated) {
  currentPostBlog.id = route.params.id
}

const handleSave = async () => {
  if (files.value) {
    currentPostBlog.thumbnailImage.filePath = files.value?.path
    currentPostBlog.thumbnailImage.mediaLangs.forEach((mediaLang) => {
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
      body: JSON.stringify(currentPostBlog)
    }
    if (!props.updated) {
      await Api.postBlogs.create(payload)
      toast.success('Dodano post', {
        timeout: 2000
      })
    } else {
      await Api.postBlogs.update(payload)
      toast.success('Edytowano post', {
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
  if (!currentPostBlog.name) {
    toast.error('Błędna nazwa kategorii', {
      timeout: 2000
    })
    return
  }

  const slug = currentPostBlog.name
    .trim() // Usuwanie spacji na początku i końcu
    .toLowerCase() // Zamiana na małe litery
    .replace(/\s+/g, '-') // Zamiana spacji na myślniki

  currentPostBlog.slug = slug
}

const allBlogCategories = async () => {
  const result = await Api.categoryBlogs.listByStoreId()
  blogCategories.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

watch(
  currentPostBlog.thumbnailImage,
  (newThumbnailImage, oldThumbnailImage) => {
    file.value = {
      media: {
        seoFileName: newThumbnailImage.seoFileName,
        altAttribute: newThumbnailImage.altAttribute,
        titleAttribute: newThumbnailImage.title,
        mediaLangs: newThumbnailImage.mediaLangs
      },
      blobFolder: 3,
      watermark: false,
      thumbnail: false,
    }
  },
  { deep: true }
)

onMounted(() => {
  allBlogCategories()
})
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormSection :title="'Zdjęcie kategorii'">
      <DropZone
        ref="dropzone"
        :fileInfo="file"
        :url="currentPostBlog.thumbnailImage.filePath"
        v-model="files"
      ></DropZone>
    </FormSection>
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Zdjęcie SEO'">
          <FormKit
            type="text"
            v-model="currentPostBlog.thumbnailImage.seoFileName"
            label="Nazwa SEO"
            validation="required"
            validation-visibility="live"
            help="Nazwa pod jaką plik ma zostać zapisany"
          />
          <FormKit
            type="text"
            v-model="currentPostBlog.thumbnailImage.altAttribute"
            label="Alt atrybut"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentPostBlog.thumbnailImage.titleAttribute"
            label="Tytuł atrybutu"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
        <FormSection :title="'Post'">
          <FormKit
            type="text"
            v-model="currentPostBlog.name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentPostBlog.slug"
            label="Slug"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <div class="mt-7">
            <el-button @click="slugGenerator" color="#ea580c" round>Generuj slug</el-button>
          </div>
        </FormSection>
        <FormSection
          ><DropDown
            label="Kategoria nadrzędna"
            v-model="currentPostBlog.blogCategoryId"
            :value="currentPostBlog.blogCategoryId"
            :options="blogCategories"
          />
        </FormSection>
        <FormSection :title="'SEO'">
          <FormKit
            type="text"
            v-model="currentPostBlog.metaTitle"
            label="Meta tytuł"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentPostBlog.metaKeywords"
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
            v-model="currentPostBlog.metaDescription"
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
        <FormSection title="Opis skrócony">
          <HtmlEditor v-model="currentPostBlog.shortDescription" />
        </FormSection>
        <FormSection title="Opis">
          <HtmlEditor v-model="currentPostBlog.description" />
        </FormSection>
        <FormSection>
          <FormKit
            type="number"
            help=""
            label="Kolejność wyświetlania"
            v-model="currentPostBlog.displayOrder"
            value="0"
            step="1"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Widoczny"
            help=""
            v-model="currentPostBlog.isActive"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Zamieść na stronie"
            help="Artykuł będzie widoczny na stronie głównej"
            v-model="currentPostBlog.isHomePage"
            :value="false"
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.Id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Zdjęcie SEO'">
            <FormKit
              type="text"
              v-model="currentPostBlog.thumbnailImage.mediaLangs[index].seoFileName"
              label="Nazwa SEO"
              validation="required"
              validation-visibility="live"
              help="Nazwa pod jaką plik ma zostać zapisany"
            />
            <FormKit
              type="text"
              v-model="currentPostBlog.thumbnailImage.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentPostBlog.thumbnailImage.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'Post'">
            <FormKit
              type="text"
              v-model="currentPostBlog.blogItemLangs[index].name"
              label="Nazwa"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'SEO'">
            <FormKit
              type="text"
              v-model="currentPostBlog.blogItemLangs[index].metaTitle"
              label="Meta tytuł"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentPostBlog.blogItemLangs[index].metaKeywords"
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
              v-model="currentPostBlog.blogItemLangs[index].metaDescription"
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
          <FormSection title="Opis skrócony">
            <HtmlEditor v-model="currentPostBlog.blogItemLangs[index].shortDescription" />
          </FormSection>
          <FormSection title="Opis">
            <HtmlEditor v-model="currentPostBlog.blogItemLangs[index].description" />
          </FormSection>
        </div>
      </div>

      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>
