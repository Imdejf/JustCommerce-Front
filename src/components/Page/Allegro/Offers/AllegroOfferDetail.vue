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
              <strong>Kod producenta:</strong>
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

          <div class="border-t border-[#e5e7eb] mt-8 pt-6">
            <div v-if="!parameters.length">
              <el-empty description="Brak parametrów dla kategorii oferty" />
            </div>

            <div v-else class="max-w-[460px] space-y-5">
              <div
                v-for="param in visibleParameters"
                :key="param.id"
              >
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-[#64748b] mb-1">
                      {{ param.name }}
                      <span v-if="param.required" class="text-red-500">*</span>
                    </label>

                    <el-select
                      v-if="getParamValues(param).length"
                      v-model="form.parameterValues[param.id]"
                      filterable
                      clearable
                      class="!w-full allegro-select"
                      placeholder="wybierz"
                    >
                      <el-option
                        v-for="value in getParamValues(param)"
                        :key="value.id || value.value || value.name"
                        :label="value.name || value.value"
                        :value="value.id || value.value || value.name"
                      />
                    </el-select>

                    <el-input-number
                      v-else-if="isNumberParameter(param)"
                      v-model="form.parameterValues[param.id]"
                      :controls="false"
                      class="!w-full allegro-input-number"
                    />

                    <el-switch
                      v-else-if="isBooleanParameter(param)"
                      v-model="form.parameterValues[param.id]"
                    />

                    <el-input
                      v-else
                      v-model="form.parameterValues[param.id]"
                      class="allegro-input"
                      placeholder="Wpisz wartość"
                    />
                  </div>

                  <el-tooltip content="Parametr wymagany przez Allegro" placement="top">
                    <span class="text-[#64748b] border border-[#94a3b8] rounded-full w-4 h-4 text-[10px] flex items-center justify-center mt-5">
                      ?
                    </span>
                  </el-tooltip>
                </div>
              </div>

              <button
                v-if="parameters.length > 6"
                class="border border-[#00796b] px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#00796b] hover:bg-[#ecfdf5]"
                type="button"
                @click="showAllParameters = !showAllParameters"
              >
                {{ showAllParameters ? 'MNIEJ PARAMETRÓW' : 'WIĘCEJ PARAMETRÓW' }}
              </button>
            </div>
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
import AllegroPhotosAndDescription from '/@/components/Form/Allegro/AllegroPhotosAndDescription.vue'
import {
  applyParameterValuesFromApi,
  buildParameterValuesForApi,
  createDefaultDescriptionRows,
  extractAllegroUrlFromUpload,
  extractParametersFromLiveOffer,
  fileToBase64,
  getParamValues,
  isBooleanParameter,
  isNumberParameter,
  mapDescriptionRowsFromApi,
  normalizeAllegroImages,
  prepareDescriptionRowsForAllegro,
  buildFeePreviewBody,
} from '/@/components/Form/Allegro/allegroOfferForm.ts'

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
const parameters = ref<any[]>([])
const showAllParameters = ref(false)
const savedParameterValues = ref<any[]>([])

const visibleParameters = computed(() => {
  if (showAllParameters.value) return parameters.value

  const required = parameters.value.filter((param: any) => param.required)
  const optional = parameters.value.filter((param: any) => !param.required)

  return [...required, ...optional].slice(0, 6)
})

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
  parameterValues: {} as Record<string, any>,

  responsibleProducerId: '',
  safetyText: '',

  photos: [] as any[],
  descriptionRows: createDefaultDescriptionRows(),

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
    const result = await Api.allegro.getOfferForEdit(offerId.value)
    offer.value = result?.data || result

    fillFormFromEditDto(offer.value)
    await syncCategoryParameters(offer.value.parameterValues || [])
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać danych oferty do edycji')
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
    await syncCategoryParameters(extractParametersFromLiveOffer(liveOffer.value))

    ElMessage.success('Pobrano aktualne dane z Allegro')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać oferty live z Allegro')
  } finally {
    loading.value = false
  }
}

const fillFormFromEditDto = (data: any) => {
  form.allegroOfferId = data.allegroOfferId || data.offerId || data.id || offerId.value
  form.productId = data.productId || ''
  form.externalId = data.externalId || data.productIdentificationCode || data.identificationCode || ''
  form.status = data.status || ''

  form.title = data.name || data.productName || data.title || ''
  form.categoryId = data.categoryId || data.category?.id || ''
  form.categoryName = data.categoryName || data.category?.name || ''
  form.allegroCatalogProductId = data.allegroCatalogProductId || ''

  form.price = Number(data.price?.amount || data.price || 0)
  form.stockQuantity = Number(data.stock || data.stockQuantity || data.availableStock || 0)
  form.stockUnit = data.stockUnit || form.stockUnit

  form.deliveryPriceListId = data.deliveryPriceListId || data.shippingRateId || ''
  form.shippingTime = data.shippingTime || form.shippingTime
  form.returnPolicyId = data.returnPolicyId || ''
  form.impliedWarrantyId = data.impliedWarrantyId || ''
  form.warrantyId = data.warrantyId || ''

  form.responsibleProducerId = data.responsibleProducerId || ''
  form.safetyText = data.safetyText || ''

  form.invoiceOption = data.invoiceOption || form.invoiceOption
  form.invoiceSubject = data.invoiceSubject || form.invoiceSubject
  form.vatRatePoland = data.vatRatePoland || form.vatRatePoland
  form.condition = data.condition || form.condition

  form.photos = normalizeAllegroImages(data.images || [])
  savedParameterValues.value = data.parameterValues || data.parameters || []
  form.descriptionRows = mapDescriptionRowsFromApi(data.descriptionRows || [])
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

  form.photos = normalizeAllegroImages([
    ...(data.images || []),
    ...(productSetItem?.product?.images || []),
  ])
  savedParameterValues.value = extractParametersFromLiveOffer(data)

  form.descriptionRows = normalizeDescription(data.description)
}

const loadCategoryParameters = async (categoryId: string) => {
  const result = await Api.allegro.getCategoryParameters(categoryId)
  const data = result?.data || result

  parameters.value = Array.isArray(data) ? data : (data?.items || [])

  parameters.value.forEach((param: any) => {
    if (form.parameterValues[param.id] === undefined) {
      form.parameterValues[param.id] = null
    }
  })
}

const syncCategoryParameters = async (apiParams: any[] = []) => {
  savedParameterValues.value = apiParams

  if (!form.categoryId) {
    parameters.value = []
    return
  }

  showAllParameters.value = false
  await loadCategoryParameters(form.categoryId)
  applyParameterValuesFromApi(form.parameterValues, apiParams)
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

const uploadPhotos = async () => {
  const uploadedUrls: string[] = []

  for (const photo of form.photos) {
    if (photo.allegroUrl) {
      uploadedUrls.push(photo.allegroUrl)
      continue
    }

    if (photo.file) {
      const base64File = await fileToBase64(photo.file)
      const uploaded = await Api.allegro.uploadImage(base64File)

      const allegroUrl = extractAllegroUrlFromUpload(uploaded)

      if (allegroUrl) {
        photo.allegroUrl = allegroUrl
        photo.url = allegroUrl
        uploadedUrls.push(allegroUrl)
      }

      continue
    }

    if (
      photo.url &&
      photo.url.startsWith('https://') &&
      photo.url.includes('allegroimg.com')
    ) {
      uploadedUrls.push(photo.url)
    }
  }

  return uploadedUrls
    .filter(Boolean)
    .filter((x: string) => x.startsWith('https://'))
    .filter((x: string) => x.includes('allegroimg.com'))
    .filter((value, index, self) => self.indexOf(value) === index)
}

const buildUpdateBody = (imageUrls: string[], descriptionRows: any[]) => ({
  offerName: form.title,
  categoryId: form.categoryId,
  allegroCatalogProductId: form.allegroCatalogProductId || null,
  parameterValues: buildParameterValuesForApi(form.parameterValues, parameters.value),
  imageUrls,
  descriptionRows,
  price: Number(form.price || 0),
  stockQuantity: Number(form.stockQuantity || 0),
  stockUnit: form.stockUnit || 'UNIT',
  condition: form.condition || null,
  deliveryPriceListId: form.deliveryPriceListId || null,
  shippingTime: form.shippingTime || null,
  returnPolicyId: form.returnPolicyId || null,
  impliedWarrantyId: form.impliedWarrantyId || null,
  warrantyId: form.warrantyId || null,
  invoiceOption: form.invoiceOption || null,
  invoiceSubject: form.invoiceSubject || null,
  vatRatePoland: form.vatRatePoland || null,
  safetyText: form.safetyText || null,
  responsibleProducerId: form.responsibleProducerId || null,
})

const waitForOperation = async (allegroOfferId: string, operationId: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const operation = await Api.allegro.getOfferOperationStatus(
      allegroOfferId,
      operationId
    )

    const status = operation?.status || operation?.data?.status

    if (status === 'COMPLETED' || status === 'SUCCESS') {
      return operation
    }

    if (status === 'FAILED' || status === 'ERROR') {
      throw new Error('Allegro odrzuciło edycję oferty')
    }

    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  return null
}

const saveChanges = async () => {
  if (!offerId.value) {
    ElMessage.error('Brak ID oferty Allegro')
    return
  }

  if (!form.title?.trim()) {
    ElMessage.error('Tytuł oferty jest wymagany')
    return
  }

  if (!form.categoryId) {
    ElMessage.error('Brak kategorii oferty')
    return
  }

  if (!form.deliveryPriceListId) {
    ElMessage.error('Wybierz cennik dostawy')
    return
  }

  if (!form.returnPolicyId || !form.impliedWarrantyId) {
    ElMessage.error('Uzupełnij warunki zwrotów i reklamacji')
    return
  }

  saving.value = true

  try {
    const imageUrls = await uploadPhotos()

    if (!imageUrls.length) {
      ElMessage.error('Dodaj co najmniej jedno zdjęcie Allegro')
      return
    }

    const descriptionRows = await prepareDescriptionRowsForAllegro(
      form.descriptionRows,
      form.photos,
      base64File => Api.allegro.uploadImage(base64File),
    )

    const result = await Api.allegro.updateOffer(
      offerId.value,
      buildUpdateBody(imageUrls, descriptionRows)
    )

    const operationId =
      result?.operationId ||
      result?.data?.operationId

    if (operationId) {
      await waitForOperation(
        result?.id || form.allegroOfferId || offerId.value,
        operationId
      )
    }

    ElMessage.success('Oferta została zaktualizowana w Allegro')
    await loadOffer()
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || 'Nie udało się zapisać zmian w Allegro')
  } finally {
    saving.value = false
  }
}

const previewFees = async () => {
  if (!form.categoryId) {
    ElMessage.error('Brak kategorii — nie można sprawdzić prowizji')
    return
  }

  if (!form.price || Number(form.price) <= 0) {
    ElMessage.error('Podaj cenę, aby sprawdzić prowizję')
    return
  }

  try {
    feePreview.value = await Api.allegro.previewOfferFees(
      buildFeePreviewBody({
        title: form.title,
        categoryId: form.categoryId,
        price: form.price,
        stockQuantity: form.stockQuantity,
        stockUnit: form.stockUnit,
        deliveryPriceListId: form.deliveryPriceListId,
      })
    )
    ElMessage.success('Pobrano prowizje z Allegro')
  } catch (error) {
    console.error(error)
    ElMessage.error('Nie udało się pobrać prowizji')
  }
}

const goBack = () => {
  router.push('/allegro/offers')
}

onMounted(async () => {
  await loadInitialData()
  await loadOffer()
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

:deep(.allegro-input-number .el-input__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #9ca3af inset;
}

:deep(.allegro-input-number) {
  width: 100%;
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