<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { ProductDTO, ProductAvailability } from '/@/types/product/Product'
import type { MediaFileDTO, FileDTO } from '/@/types/file/File'
import { useLanguageStore } from '/@/stores/language'
import { useStoreStore } from '/@/stores/store'
import DropZone from '/@/components/Form/File/DropZone'
import { Api } from '/@/services/api'
import jwt_decode from 'jwt-decode'
import Cookies from 'universal-cookie'
import { useRoute, useRouter } from 'vue-router'
import diacritics from 'diacritics'

const props = defineProps({
  product: {
    type: Object as () => ProductDTO,
    default: null
  },
  updated: {
    type: Boolean,
    default: false
  }
})

const cookies = new Cookies()
const store = useStoreStore()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const language = useLanguageStore()
const fileThumbnail = ref<FileDTO | null>(null)
const uploadedFileThumbnail = ref(null)
const currentProduct = reactive(props.product)
const currentFile = ref(null)
const files = ref(props.product.medias)
const brands = ref([])
const rules = ref([])
const test = ref(null)
const productAvailableList = ref([])

const translationsProductAvailable = {
  [ProductAvailability.Available]: 'Dostępny',
  [ProductAvailability.TwentyFourToFourtyEight]: 'Od 24 do 48h',
  [ProductAvailability.UpToFiveBusinessDays]: 'Do 5 dni roboczych',
  [ProductAvailability.ThreeToSevenDays]: 'Od 3 do 7 dni',
  [ProductAvailability.ThreeToTenDays]: 'Od 3 do 10 dni',
  [ProductAvailability.TwoWeeks]: 'Do 2 tygodni',
  [ProductAvailability.ThreeWeeks]: 'Do 3 tygodni',
  [ProductAvailability.ThreeToFiveWeeks]: 'Od 3 do 5 tygodni',
  [ProductAvailability.TemporarilyUnavailable]: 'Tymczasowo niedostępne',
  [ProductAvailability.ToOrder]: 'Na zamówienie',
  [ProductAvailability.SellerConfirmation]: 'Potwierdzenie sprzedawcy'
}

for (const id in translationsProductAvailable) {
  productAvailableList.value.push({
    id: id,
    name: translationsProductAvailable[id]
  })
}

const handleRemoveFile = async (id: string) => {
  try {
    files.value = files.value.filter((file) => file.id !== id)
    toast.success('Usunięto zdjęcie', {
      timeout: 2000
    })
  } catch (error) {
    toast.error('Błąd serwerowy', {
      timeout: 2000
    })
  }
}

const handleSave = async (values) => {
  const token = cookies.get('Authorization')
  const decoded = jwt_decode(token)
  currentProduct.storeId = store.selectedStore.id
  if (uploadedFileThumbnail.value) {
    currentProduct.thumbnailImage.filePath = uploadedFileThumbnail.value?.path
    currentProduct.thumbnailImage.mediaLangs.forEach((mediaLang) => {
      const matchingPath = uploadedFileThumbnail.value?.pathLang.find(
        (pathLang) => pathLang.languageId === mediaLang.languageId
      )
      if (matchingPath) {
        mediaLang.filePath = matchingPath.path
      }
    })
  }

  currentProduct.slug = diacritics.remove(currentProduct.slug)

  currentProduct.currentUserId = decoded.sub
  currentProduct.deletedMediaIds = []
  try {
    const payload = {
      body: JSON.stringify(currentProduct)
    }
    if (!props.updated) {
      await Api.products.create(payload)
      toast.success('Dodano produkt', {
        timeout: 2000
      })
    } else {
      await Api.products.update(payload)
      toast.success('Edytowano produkt', {
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

const handleAddFile = (file: Object) => {
  files.value.push(file.media)
}

const handleEditFile = (file: Object) => {
  const index = files.value?.findIndex((c) => c.mediaId === file.id)
  console.log(file)
  currentFile.value = {
    displayOrder: file.displayOrder,
    mediaId: file.id,
    filePath: file?.filePath || '',
    seoFileName: file?.seoFileName || '',
    altAttribute: file?.altAttribute || '',
    titleAttribute: file?.titleAttribute || '',
    mediaLangs: language.languages.map((lang) => {
      const selectedMediaLang = file?.mediaLangs.find(
        (mediaLang) => mediaLang.languageId === lang.id
      )
      console.log(selectedMediaLang)
      return {
        languageId: lang.id,
        seoFileName: selectedMediaLang?.seoFileName || '',
        altAttribute: selectedMediaLang?.altAttribute || '',
        titleAttribute: selectedMediaLang?.titleAttribute || '',
        filePath: selectedMediaLang?.filePath || ''
      }
    })
  }

  files.value[index] = currentFile.value

  console.log(currentFile.value)
}

const slugGenerator = () => {
  if (!currentProduct.name) {
    toast.error('Błędna nazwa produktu', {
      timeout: 2000
    })
    return
  }

  const slug = currentProduct.name.trim().toLowerCase().replace(/\s+/g, '-')

  currentProduct.slug = slug
}

const allBrands = async () => {
  const result = await Api.brands.listByStoreId()
  brands.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

const allRules = async () => {
  const result = await Api.rules.listByStoreId()

  rules.value = result.items.map((item) => {
    return {
      id: item.id,
      name: item.name
    }
  })
}

onMounted(() => {
  allBrands()
  allRules()
  fileThumbnail.value = {
    media: {
      seoFileName: currentProduct.thumbnailImage.seoFileName,
      altAttribute: currentProduct.thumbnailImage.altAttribute,
      titleAttribute: currentProduct.thumbnailImage.titleAttribute,
      mediaLangs: currentProduct.thumbnailImage.mediaLangs
    },
    blobFolder: 1,
    watermark: false,
    thumbnail: true
  }
})

watch(
  currentProduct.thumbnailImage,
  (newThumbnailImage, oldThumbnailImage) => {
    fileThumbnail.value = {
      media: {
        seoFileName: newThumbnailImage.seoFileName,
        altAttribute: newThumbnailImage.altAttribute,
        titleAttribute: newThumbnailImage.titleAttribute,
        mediaLangs: newThumbnailImage.mediaLangs
      },
      blobFolder: 1,
      watermark: false,
      thumbnail: true
    }
  },
  { deep: true }
)
</script>

<template>
  <ContentContainer :showLanguage="true">
    <FormKit ref="myForm" type="form" @submit="handleSave" :actions="false">
      <FormSection :title="'Zdjęcie produktu'">
        <DropZone
          ref="dropzone"
          :fileInfo="fileThumbnail"
          :url="currentProduct.thumbnailImage.filePath"
          v-model="uploadedFileThumbnail"
        ></DropZone>
      </FormSection>
      <div v-if="!language.selectedLanguage">
        <FormSection :title="'Zdjęcie SEO'">
          <FormKit
            type="text"
            v-model="currentProduct.thumbnailImage.seoFileName"
            label="Nazwa SEO"
            validation="required"
            validation-visibility="live"
            help="Nazwa pod jaką plik ma zostać zapisany"
          />
          <FormKit
            type="text"
            v-model="currentProduct.thumbnailImage.altAttribute"
            label="Alt atrybut"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentProduct.thumbnailImage.titleAttribute"
            label="Tytuł atrybutu"
            validation="required"
            validation-visibility="live"
            help=""
          />
        </FormSection>
        <FormSection :title="'Produkt'">
          <FormKit
            type="text"
            v-model="currentProduct.name"
            label="Nazwa"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentProduct.slug"
            label="Slug"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <div class="mt-7">
            <el-button @click="slugGenerator" color="#ea580c" round>Generuj slug</el-button>
          </div>
        </FormSection>
        <FormSection :title="'Transport'"
          ><DropDown
            label="Reguła transportowa"
            v-model="currentProduct.ruleId"
            :value="currentProduct.ruleId"
            :options="rules"
          />
        </FormSection>
        <FormSection :title="'Marka'"
          ><DropDown
            label="Producent"
            v-model="currentProduct.brandId"
            :value="currentProduct.brandId"
            :options="brands"
          />
        </FormSection>
        <FormSection :title="'Zdjęcia'" class="formsection_width_full">
          <MediaArea
            :filesValue="files"
            :editFile="currentFile"
            @handleAdd="handleAddFile"
            @handleEdit="handleEditFile"
            @handleRemove="handleRemoveFile"
            :folder="1"
            :watermark="true"
          />
        </FormSection>
        <FormSection :title="'SEO'">
          <FormKit
            type="text"
            v-model="currentProduct.metaTitle"
            label="Meta tytuł"
            validation="required"
            validation-visibility="live"
            help=""
          />
          <FormKit
            type="text"
            v-model="currentProduct.metaKeywords"
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
            v-model="currentProduct.metaDescription"
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
        <FormSection :title="'Opis skrócony'">
          <HtmlEditor v-model="currentProduct.shortDescription" />
        </FormSection>
        <FormSection :title="'Opis'">
          <HtmlEditor v-model="currentProduct.description" />
        </FormSection>
        <FormSection :title="'Specyfikacja'">
          <HtmlEditor v-model="currentProduct.specification" />
        </FormSection>
        <FormSection :title="'Kod'">
          <FormKit type="text" v-model="currentProduct.sku" label="SKU" help="" />
          <FormKit type="text" v-model="currentProduct.gtin" label="GTIN" help="" />
          <FormKit
            type="text"
            v-model="currentProduct.identificationCode"
            label="Kod identyfikacyjny"
            help=""
          />
        </FormSection>
        <FormSection :title="'Cena'">
          <FormKit
            type="number"
            v-model="currentProduct.price"
            label="Cena (netto)"
            step="0.01"
            validation="required"
            validation-visibility="live"
          />
          <FormKit label="Stara cena" type="number" step="0.01" v-model="currentProduct.oldPrice" />
          <FormKit
            label="Cena producenta"
            type="number"
            step="0.01"
            v-model="currentProduct.producerPrice"
          />
        </FormSection>

        <FormSection>
          <FormKit
            type="number"
            v-model="currentProduct.specialPrice"
            label="Cena specjalna (netto)"
          />
          <div class="formkit-outer" data-family="text" data-type="number" data-empty="true">
            <div class="formkit-wrapper">
              <label class="formkit-label" for="input_15">Rozpoczęcie - zakończenie promocji</label>
              <div class="formkit-inner">
                <el-date-picker
                  v-model="test"
                  type="datetimerange"
                  start-placeholder="Start Date"
                  end-placeholder="End Date"
                  :default-time="defaultTime1"
                />
              </div>
            </div>
          </div>
        </FormSection>
        <FormSection :title="'Dostępność'">
          <DropDown
            label="Czas realiazacji"
            v-model="currentProduct.productAvailability"
            :value="currentProduct.productAvailability"
            :options="productAvailableList"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Widoczny"
            help=""
            v-model="product.isPublished"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Bestseller"
            help=""
            v-model="currentProduct.isBestseller"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Nowość"
            help=""
            v-model="currentProduct.isNew"
            :value="false"
          />
        </FormSection>
        <FormSection>
          <FormKit
            type="checkbox"
            label="Strona główna"
            help=""
            v-model="currentProduct.isHomePage"
            :value="false"
          />
        </FormSection>
      </div>
      <div v-for="(formLanguage, index) in language.languages" :key="formLanguage.id">
        <div v-if="language.selectedLanguage?.id === formLanguage.id">
          <FormSection :title="'Zdjęcie SEO'">
            <FormKit
              type="text"
              v-model="currentProduct.thumbnailImage.mediaLangs[index].seoFileName"
              label="Nazwa SEO"
              validation="required"
              validation-visibility="live"
              help="Nazwa pod jaką plik ma zostać zapisany"
            />
            <FormKit
              type="text"
              v-model="currentProduct.thumbnailImage.mediaLangs[index].altAttribute"
              label="Alt atrybut"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentProduct.thumbnailImage.mediaLangs[index].titleAttribute"
              label="Tytuł atrybutu"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'Produkt'">
            <FormKit
              type="text"
              v-model="currentProduct.productLangs[index].name"
              label="Nazwa"
              validation="required"
              validation-visibility="live"
              help=""
            />
          </FormSection>
          <FormSection :title="'SEO'">
            <FormKit
              type="text"
              v-model="currentProduct.productLangs[index].metaTitle"
              label="Meta tytuł"
              validation="required"
              validation-visibility="live"
              help=""
            />
            <FormKit
              type="text"
              v-model="currentProduct.productLangs[index].metaKeywords"
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
              v-model="currentProduct.productLangs[index].metaDescription"
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
          <FormSection :title="'Opis skrócony'">
            <HtmlEditor v-model="currentProduct.productLangs[index].shortDescription" />
          </FormSection>
          <FormSection :title="'Opis'">
            <HtmlEditor v-model="currentProduct.productLangs[index].description" />
          </FormSection>
          <FormSection :title="'Specyfikacja'">
            <HtmlEditor v-model="currentProduct.productLangs[index].specification" />
          </FormSection>
        </div>
      </div>
      <div class="save-button w-full my-10">
        <FormKit type="submit" label="Zapisz" style="display: flex; justify-content: flex-end" />
      </div>
    </FormKit>
  </ContentContainer>
</template>

<style>
.formkit-inner .el-date-editor {
  padding: 20px !important;
}

.formkit-inner .el-date-editor .el-range-input {
  font-size: 12px;
}
</style>
