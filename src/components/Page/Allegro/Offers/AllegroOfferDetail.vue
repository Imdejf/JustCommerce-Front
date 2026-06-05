<template>
  <div class="p-4 bg-[#f5f6f8] min-h-screen">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl mb-4">
      <div class="flex justify-between items-center">
        <div class="flex gap-4">
          <button
            type="button"
            class="rounded-md p-1 text-xs font-semibold hover:bg-sky-100"
            @click="goBack"
          >
            Wróć
          </button>

          <button
            type="button"
            class="rounded-md p-1 text-xs font-semibold hover:bg-sky-100"
            @click="loadOffer"
          >
            Odśwież
          </button>

          <button
            type="button"
            class="rounded-md p-1 text-xs font-semibold hover:bg-sky-100"
            @click="loadLiveOffer"
          >
            Pobierz live z Allegro
          </button>
        </div>

        <div class="text-xs font-semibold text-[#435368]">
          ID oferty: {{ offerId }}
        </div>
      </div>
    </div>

    <div v-loading="loading" class="space-y-4">
      <el-empty v-if="!offer && !loading" description="Brak danych oferty Allegro" />

      <template v-else>
        <!-- STATUS -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-4">
            Status oferty
          </h2>

          <div class="grid grid-cols-4 gap-4 text-xs">
            <div>
              <strong>ID Allegro:</strong>
              <p>{{ form.allegroOfferId || offerId }}</p>
            </div>

            <div>
              <strong>Status:</strong>
              <p>
                <el-tag>{{ form.status || '-' }}</el-tag>
              </p>
            </div>

            <div>
              <strong>Produkt lokalny:</strong>
              <p>{{ form.productId || '-' }}</p>
            </div>

            <div>
              <strong>SKU:</strong>
              <p>{{ form.externalId || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- TYTUŁ -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[26px] font-bold text-[#111827] mb-6">
            Tytuł
          </h2>

          <label class="block text-xs font-semibold text-[#374151] mb-2">
            Tytuł <span class="text-red-500">*</span>
          </label>

          <el-input
            v-model="form.title"
            maxlength="75"
            show-word-limit
            placeholder="Wpisz tytuł oferty"
            class="allegro-input"
          />
        </div>

        <!-- KATEGORIA -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[26px] font-bold text-[#111827] mb-6">
            Kategoria
          </h2>

          <div v-if="form.categoryId" class="text-sm text-[#111827]">
            <strong>{{ form.categoryName || form.categoryId }}</strong>
            <span class="text-[#64748b] ml-2">
              Nr kategorii {{ form.categoryId }}
            </span>
          </div>

          <el-empty v-else description="Brak kategorii" />
        </div>

        <!-- PRODUKTY / PARAMETRY -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-5">
            Produkty w ofercie
          </h2>

          <div class="max-w-[560px] mb-6">
            <label class="block text-xs font-semibold text-[#64748b] mb-1">
              ID produktu katalogowego Allegro
            </label>

            <el-input
              v-model="form.allegroCatalogProductId"
              class="allegro-input"
              placeholder="ID produktu katalogowego Allegro"
            />
          </div>

          <div class="max-w-[460px] mb-6">
            <label class="block text-xs font-semibold text-[#64748b] mb-1">
              Stan
            </label>

            <el-select
              v-model="form.condition"
              class="!w-full allegro-select"
              placeholder="Stan"
            >
              <el-option label="Nowy" value="NEW" />
              <el-option label="Używany" value="USED" />
            </el-select>
          </div>

          <div>
            <h3 class="text-sm font-bold text-[#111827] mb-3">
              Parametry Allegro
            </h3>

            <el-table
              :data="form.parameterValues"
              :border="true"
              class="!bg-[#d6dfe9]"
            >
              <el-table-column label="ID parametru" width="180">
                <template #default="{ row }">
                  <el-input v-model="row.parameterId" size="small" />
                </template>
              </el-table-column>

              <el-table-column label="Wartość">
                <template #default="{ row }">
                  <el-input v-model="row.value" size="small" />
                </template>
              </el-table-column>

              <el-table-column label="ID wartości" width="180">
                <template #default="{ row }">
                  <el-input v-model="row.valueId" size="small" />
                </template>
              </el-table-column>

              <el-table-column label="Akcje" width="90">
                <template #default="{ $index }">
                  <el-button size="small" type="danger" @click="removeParameter($index)">
                    Usuń
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <button
              type="button"
              class="mt-3 text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline"
              @click="addParameter"
            >
              DODAJ PARAMETR
            </button>
          </div>
        </div>

        <!-- GPSR -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-5">
            Dane producenta i bezpieczeństwo
          </h2>

          <div class="max-w-[560px] space-y-5">
            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Dane producenta
              </label>

              <el-select
                v-model="form.responsibleProducerId"
                class="!w-full allegro-select"
                placeholder="Wybierz producenta"
                clearable
                filterable
                :loading="loadingInitialData"
              >
                <el-option
                  v-for="item in responsibleProducers"
                  :key="item.id"
                  :label="item.name || item.id"
                  :value="item.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Informacje o bezpieczeństwie
              </label>

              <el-input
                v-model="form.safetyText"
                type="textarea"
                maxlength="5000"
                show-word-limit
                :rows="6"
                class="allegro-textarea"
                placeholder="Treść informacji o bezpieczeństwie"
              />
            </div>
          </div>
        </div>

        <!-- ZDJĘCIA I OPIS -->
        <AllegroPhotosAndDescription
          v-model:photos="form.photos"
          v-model:descriptionRows="form.descriptionRows"
        />

        <!-- DOSTAWA -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-5">
            Dostawa i płatność
          </h2>

          <div class="max-w-[560px] space-y-6">
            <div>
              <label class="block text-[11px] font-semibold text-[#475569] mb-2 uppercase">
                Cennik dostawy
              </label>

              <el-select
                v-model="form.deliveryPriceListId"
                class="!w-full allegro-select"
                placeholder="Wybierz cennik"
                clearable
                filterable
              >
                <el-option
                  v-for="item in deliveryPriceLists"
                  :key="item.id"
                  :label="item.name || item.id"
                  :value="item.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-[#475569] mb-2 uppercase">
                Czas wysyłki
              </label>

              <el-select
                v-model="form.shippingTime"
                class="!w-full allegro-select"
                placeholder="Wybierz czas wysyłki"
              >
                <el-option label="1 dzień" value="PT24H" />
                <el-option label="2 dni" value="PT48H" />
                <el-option label="3 dni" value="PT72H" />
                <el-option label="5 dni" value="PT120H" />
                <el-option label="7 dni" value="PT168H" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- CENA -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-6">
            Cena
          </h2>

          <div class="max-w-[560px] space-y-5">
            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Cena
              </label>

              <el-input
                v-model="form.price"
                placeholder="Cena"
                class="allegro-input !w-[300px]"
              >
                <template #suffix>
                  zł
                </template>
              </el-input>
            </div>

            <div>
              <h3 class="text-sm font-bold text-[#111827] mb-3">
                Faktura VAT
              </h3>

              <div class="grid grid-cols-2 gap-4">
                <el-select
                  v-model="form.invoiceOption"
                  class="!w-full allegro-select"
                  placeholder="Opcje faktury"
                >
                  <el-option label="faktura VAT" value="VAT" />
                  <el-option label="faktura bez VAT" value="NO_VAT" />
                  <el-option label="nie wystawiam faktury" value="NONE" />
                </el-select>

                <el-select
                  v-model="form.invoiceSubject"
                  class="!w-full allegro-select"
                  placeholder="Przedmiot oferty"
                  clearable
                >
                  <el-option label="towar" value="GOODS" />
                  <el-option label="usługa" value="SERVICE" />
                </el-select>
              </div>

              <el-select
                v-model="form.vatRatePoland"
                class="!w-[300px] allegro-select mt-4"
                placeholder="Stawka VAT Polska"
                clearable
              >
                <el-option label="23%" value="23" />
                <el-option label="8%" value="8" />
                <el-option label="5%" value="5" />
                <el-option label="0%" value="0" />
              </el-select>
            </div>
          </div>
        </div>

        <!-- STAN -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-6">
            Stan magazynowy
          </h2>

          <div class="flex items-center gap-4 mb-8 max-w-[560px]">
            <el-input
              v-model="form.stockQuantity"
              placeholder="Liczba sztuk"
              class="allegro-input !w-[360px]"
            />

            <el-select
              v-model="form.stockUnit"
              class="allegro-select !w-[120px]"
            >
              <el-option label="sztuk" value="UNIT" />
              <el-option label="par" value="PAIR" />
              <el-option label="kompletów" value="SET" />
            </el-select>
          </div>
        </div>

        <!-- WARUNKI SPRZEDAŻY -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <h2 class="text-[22px] font-bold text-[#111827] mb-6">
            Warunki sprzedaży
          </h2>

          <div class="max-w-[560px] space-y-5">
            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Warunki zwrotów
              </label>

              <el-select
                v-model="form.returnPolicyId"
                class="!w-full allegro-select"
                placeholder="Warunki zwrotów"
                clearable
                filterable
              >
                <el-option
                  v-for="item in returnPolicies"
                  :key="item.id"
                  :label="item.name || item.id"
                  :value="item.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Reklamacje / rękojmia
              </label>

              <el-select
                v-model="form.impliedWarrantyId"
                class="!w-full allegro-select"
                placeholder="Warunki reklamacji / rękojmi"
                clearable
                filterable
              >
                <el-option
                  v-for="item in impliedWarranties"
                  :key="item.id"
                  :label="item.name || item.id"
                  :value="item.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Gwarancja
              </label>

              <el-select
                v-model="form.warrantyId"
                class="!w-full allegro-select"
                placeholder="Gwarancja"
                clearable
                filterable
              >
                <el-option
                  v-for="item in warranties"
                  :key="item.id"
                  :label="item.name || item.id"
                  :value="item.id"
                />
              </el-select>
            </div>
          </div>
        </div>

        <!-- AKCJE -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <div class="flex justify-end gap-4">
            <button
              type="button"
              class="h-[42px] px-8 text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline"
              @click="previewFees"
            >
              SPRAWDŹ PROWIZJE
            </button>

            <button
              type="button"
              class="h-[42px] px-8 bg-[#4f6bed] hover:bg-[#3f5bdc] text-white text-xs font-bold tracking-[0.18em] rounded disabled:opacity-50"
              :disabled="saving"
              @click="saveChanges"
            >
              {{ saving ? 'ZAPISUJĘ...' : 'ZAPISZ ZMIANY W ALLEGRO' }}
            </button>
          </div>

          <el-collapse v-if="feePreview" class="mt-5">
            <el-collapse-item title="Podgląd prowizji" name="fees">
              <pre class="json-preview">{{ JSON.stringify(feePreview, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- RAW -->
        <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
          <el-collapse>
            <el-collapse-item title="Pokaż surowe dane oferty" name="json">
              <pre class="json-preview">{{ JSON.stringify(offer, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Api } from '/@/services/api'
import AllegroPhotosAndDescription from '/@/components/form/allegro/AllegroPhotosAndDescription.vue'

const route = useRoute()
const router = useRouter()

const offerId = computed(() => String(route.params.id || ''))

const loading = ref(false)
const saving = ref(false)
const loadingInitialData = ref(false)

const offer = ref<any>(null)
const liveOffer = ref<any>(null)
const feePreview = ref<any | null>(null)

const responsibleProducers = ref<any[]>([])
const returnPolicies = ref<any[]>([])
const impliedWarranties = ref<any[]>([])
const warranties = ref<any[]>([])
const deliveryPriceLists = ref<any[]>([])

const form = reactive({
  allegroOfferId: '',
  productId: '',
  externalId: '',
  status: '',

  title: '',
  categoryId: '',
  categoryName: '',
  allegroCatalogProductId: '',

  condition: 'NEW',
  parameterValues: [] as any[],

  responsibleProducerId: '',
  safetyText: '',

  photos: [] as any[],
  descriptionRows: [
    {
      id: crypto.randomUUID(),
      text: '',
      active: true,
      layout: 'TEXT_ONLY',
      imageUrl: null,
      imageFile: null,
    },
  ] as any[],

  deliveryPriceListId: '',
  shippingTime: 'PT72H',

  price: null as number | null,
  stockQuantity: 0 as number | null,
  stockUnit: 'UNIT',

  invoiceOption: 'VAT',
  invoiceSubject: 'GOODS',
  vatRatePoland: '23',

  returnPolicyId: '',
  impliedWarrantyId: '',
  warrantyId: '',
})

const normalizeList = (result: any) => {
  const data = result?.data || result

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.responsibleProducers)) return data.responsibleProducers
  if (Array.isArray(data?.returnPolicies)) return data.returnPolicies
  if (Array.isArray(data?.impliedWarranties)) return data.impliedWarranties
  if (Array.isArray(data?.warranties)) return data.warranties

  return []
}

const loadInitialData = async () => {
  loadingInitialData.value = true

  try {
    const [
      producersResult,
      returnPoliciesResult,
      impliedWarrantiesResult,
      warrantiesResult,
      deliveryPriceListsResult,
    ] = await Promise.allSettled([
      Api.allegro.getResponsibleProducers?.(),
      Api.allegro.getReturnPolicies(),
      Api.allegro.getImpliedWarranties(),
      Api.allegro.getWarranties(),
      Api.allegro.getDeliveryPriceLists(),
    ])

    responsibleProducers.value =
      producersResult.status === 'fulfilled' ? normalizeList(producersResult.value) : []

    returnPolicies.value =
      returnPoliciesResult.status === 'fulfilled' ? normalizeList(returnPoliciesResult.value) : []

    impliedWarranties.value =
      impliedWarrantiesResult.status === 'fulfilled' ? normalizeList(impliedWarrantiesResult.value) : []

    warranties.value =
      warrantiesResult.status === 'fulfilled' ? normalizeList(warrantiesResult.value) : []

    deliveryPriceLists.value =
      deliveryPriceListsResult.status === 'fulfilled' ? normalizeList(deliveryPriceListsResult.value) : []
  } finally {
    loadingInitialData.value = false
  }
}

const loadOffer = async () => {
  if (!offerId.value) {
    ElMessage.error('Brak ID oferty Allegro')
    return
  }

  loading.value = true

  try {
    const result = await Api.allegro.getOffer(offerId.value)
    offer.value = result?.data || result

    fillFormFromOffer(offer.value)
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać szczegółów oferty Allegro')
  } finally {
    loading.value = false
  }
}

const loadLiveOffer = async () => {
  if (!offerId.value) {
    ElMessage.error('Brak ID oferty Allegro')
    return
  }

  loading.value = true

  try {
    const result = await Api.allegro.getLiveOffer(offerId.value)
    liveOffer.value = result?.data || result

    fillFormFromLiveOffer(liveOffer.value)

    ElMessage.success('Pobrano aktualne dane z Allegro')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać oferty live z Allegro')
  } finally {
    loading.value = false
  }
}

const fillFormFromOffer = (data: any) => {
  form.allegroOfferId = data.allegroOfferId || data.offerId || data.id || offerId.value
  form.productId = data.productId || ''
  form.externalId = data.externalId || data.sku || ''
  form.status = data.status || ''

  form.title = data.name || data.productName || data.title || ''
  form.categoryId = data.categoryId || data.category?.id || ''
  form.categoryName = data.categoryName || data.category?.name || ''

  form.price = Number(data.price?.amount || data.price || 0)
  form.stockQuantity = Number(data.stock || data.stockQuantity || data.availableStock || 0)

  form.deliveryPriceListId = data.deliveryPriceListId || data.shippingRateId || ''
  form.returnPolicyId = data.returnPolicyId || ''
  form.impliedWarrantyId = data.impliedWarrantyId || ''
  form.warrantyId = data.warrantyId || ''

  form.photos = normalizeImages(data.images || [])
  form.parameterValues = normalizeParameters(data.parameters || data.parameterValues || [])

  if (!form.descriptionRows.length) {
    form.descriptionRows = createDefaultDescriptionRows()
  }
}

const fillFormFromLiveOffer = (data: any) => {
  form.title = data.name || form.title
  form.status = data.publication?.status || form.status

  form.categoryId = data.category?.id || data.productSet?.[0]?.product?.category?.id || form.categoryId
  form.categoryName = data.category?.name || form.categoryName

  form.price = Number(data.sellingMode?.price?.amount || form.price || 0)

  form.stockQuantity = Number(data.stock?.available || form.stockQuantity || 0)
  form.stockUnit = data.stock?.unit || form.stockUnit

  form.deliveryPriceListId =
    data.delivery?.shippingRates?.id ||
    data.deliveryPriceListId ||
    form.deliveryPriceListId

  form.shippingTime =
    data.delivery?.handlingTime ||
    form.shippingTime

  form.returnPolicyId =
    data.afterSalesServices?.returnPolicy?.id ||
    form.returnPolicyId

  form.impliedWarrantyId =
    data.afterSalesServices?.impliedWarranty?.id ||
    form.impliedWarrantyId

  form.warrantyId =
    data.afterSalesServices?.warranty?.id ||
    form.warrantyId

  const productSetItem = data.productSet?.[0]

  form.allegroCatalogProductId =
    productSetItem?.product?.id ||
    form.allegroCatalogProductId

  form.responsibleProducerId =
    productSetItem?.responsibleProducer?.id ||
    form.responsibleProducerId

  form.safetyText =
    productSetItem?.safetyInformation?.description ||
    form.safetyText

  form.photos = normalizeImages(data.images || productSetItem?.product?.images || [])
  form.parameterValues = normalizeParameters(data.parameters || productSetItem?.product?.parameters || [])

  form.descriptionRows = normalizeDescription(data.description)
}

const normalizeImages = (images: any[]) => {
  if (!Array.isArray(images)) return []

  return images
    .map((x: any) => {
      const url = typeof x === 'string'
        ? x
        : x.url || x.allegroUrl || x.filePath

      if (!url) return null

      return {
        id: crypto.randomUUID(),
        url,
        allegroUrl: url
      }
    })
    .filter(Boolean)
}

const normalizeParameters = (parameters: any[]) => {
  if (!Array.isArray(parameters)) return []

  return parameters.map((x: any) => ({
    parameterId: x.id || x.parameterId || '',
    valueId: x.valuesIds?.[0] || x.valueId || '',
    value: x.values?.[0] || x.value || ''
  }))
}

const normalizeDescription = (description: any) => {
  const sections = description?.sections || []

  if (!Array.isArray(sections) || !sections.length) {
    return createDefaultDescriptionRows()
  }

  return sections.map((section: any) => {
    const items = section.items || []

    const textItem = items.find((x: any) => x.type === 'TEXT')
    const imageItem = items.find((x: any) => x.type === 'IMAGE')

    const firstType = items[0]?.type
    const layout =
      textItem && imageItem && firstType === 'IMAGE'
        ? 'IMAGE_TEXT_RIGHT'
        : textItem && imageItem
          ? 'TEXT_IMAGE_RIGHT'
          : imageItem
            ? 'IMAGE_ONLY'
            : 'TEXT_ONLY'

    return {
      id: crypto.randomUUID(),
      text: stripHtml(textItem?.content || ''),
      active: true,
      layout,
      imageUrl: imageItem?.url || null,
      imageFile: null,
    }
  })
}

const createDefaultDescriptionRows = () => [
  {
    id: crypto.randomUUID(),
    text: '',
    active: true,
    layout: 'TEXT_ONLY',
    imageUrl: null,
    imageFile: null,
  },
]

const stripHtml = (html: string) => {
  if (!html) return ''

  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
}

const toAllegroHtml = (text: string) => {
  if (!text) return ''

  const escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '<br />')

  return `<p>${escaped}</p>`
}

const buildDescription = () => {
  return {
    sections: form.descriptionRows
      .filter((row: any) =>
        row.active &&
        (
          String(row.text || '').trim() ||
          String(row.imageUrl || '').trim()
        )
      )
      .map((row: any) => {
        const items: any[] = []

        const addText = () => {
          if (String(row.text || '').trim()) {
            items.push({
              type: 'TEXT',
              content: toAllegroHtml(row.text)
            })
          }
        }

        const addImage = () => {
          if (String(row.imageUrl || '').trim()) {
            items.push({
              type: 'IMAGE',
              url: row.imageUrl
            })
          }
        }

        if (row.layout === 'IMAGE_TEXT_RIGHT') {
          addImage()
          addText()
        } else {
          addText()
          addImage()
        }

        return { items }
      })
      .filter((section: any) => section.items.length)
  }
}

const buildPatchBody = () => {
  const imageUrls = form.photos
    .map((x: any) => x.allegroUrl || x.url)
    .filter(Boolean)

  const productSetItem: any = {
    product: {
      id: form.allegroCatalogProductId || null,
      name: form.title,
      category: {
        id: form.categoryId
      },
      parameters: form.parameterValues
        .filter((x: any) => x.parameterId)
        .map((x: any) => ({
          id: x.parameterId,
          valuesIds: x.valueId ? [x.valueId] : null,
          values: x.value && !x.valueId ? [x.value] : null
        })),
      images: imageUrls
    }
  }

  if (form.responsibleProducerId) {
    productSetItem.responsibleProducer = {
      type: 'ID',
      id: form.responsibleProducerId
    }
  }

  if (form.safetyText) {
    productSetItem.safetyInformation = {
      type: 'TEXT',
      description: form.safetyText
    }
  }

  return {
    name: form.title,

    productSet: [
      productSetItem
    ],

    sellingMode: {
      format: 'BUY_NOW',
      price: {
        amount: Number(form.price || 0).toFixed(2),
        currency: 'PLN'
      }
    },

    stock: {
      available: Number(form.stockQuantity || 0),
      unit: form.stockUnit || 'UNIT'
    },

    delivery: {
      shippingRates: form.deliveryPriceListId
        ? {
            id: form.deliveryPriceListId
          }
        : null,
      handlingTime: form.shippingTime || null
    },

    afterSalesServices: {
      returnPolicy: form.returnPolicyId
        ? {
            id: form.returnPolicyId
          }
        : null,
      impliedWarranty: form.impliedWarrantyId
        ? {
            id: form.impliedWarrantyId
          }
        : null,
      warranty: form.warrantyId
        ? {
            id: form.warrantyId
          }
        : null
    },

    parameters: [],

    images: imageUrls,

    description: buildDescription()
  }
}

const saveChanges = async () => {
  if (!offerId.value) {
    ElMessage.error('Brak ID oferty Allegro')
    return
  }

  saving.value = true

  try {
    const body = buildPatchBody()

    await Api.allegro.patchOffer(offerId.value, body)

    ElMessage.success('Zmiany zostały wysłane do Allegro')

    await loadLiveOffer()
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się zapisać zmian w Allegro')
  } finally {
    saving.value = false
  }
}

const buildFeePreviewBody = () => {
  return {
    offer: {
      name: form.title,
      category: {
        id: form.categoryId
      },
      sellingMode: {
        format: 'BUY_NOW',
        price: {
          amount: String(form.price || 0),
          currency: 'PLN'
        }
      },
      stock: {
        available: Number(form.stockQuantity || 1),
        unit: form.stockUnit
      },
      delivery: {
        shippingRates: form.deliveryPriceListId
          ? {
              id: form.deliveryPriceListId
            }
          : null
      }
    }
  }
}

const previewFees = async () => {
  try {
    feePreview.value = await Api.allegro.previewOfferFees(buildFeePreviewBody())
    ElMessage.success('Pobrano prowizje z Allegro')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać prowizji')
  }
}

const addParameter = () => {
  form.parameterValues.push({
    parameterId: '',
    valueId: '',
    value: ''
  })
}

const removeParameter = (index: number) => {
  form.parameterValues.splice(index, 1)
}

const goBack = () => {
  router.push('/allegro/offers')
}

onMounted(async () => {
  await loadInitialData()
  await loadOffer()
  await loadLiveOffer()
})
</script>

<style scoped>
:deep(.allegro-input .el-input__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #9ca3af inset;
  transition: all 0.2s ease;
}

:deep(.allegro-select .el-select__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #9ca3af inset;
}

:deep(.allegro-textarea .el-textarea__inner) {
  min-height: 150px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px #9ca3af inset;
  font-size: 13px;
}

.json-preview {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  font-size: 11px;
  max-height: 500px;
  overflow: auto;
}
</style>