<template>
  <div class="p-3">
    <div class="bg-[#f1f4f9] p-2 border-t-[3px] border-[#64748b] rounded-t-xl">
      <div class="flex justify-between items-center">
        <div class="flex gap-4">
          <span class="flex hover:bg-sky-100 p-1">
            <a @click="loadAll" class="rounded-md p-1 text-xs font-semibold">
              Odśwież
            </a>
          </span>

          <span class="flex hover:bg-sky-100 p-1">
            <a @click="saveAutomationSettings" class="rounded-md p-1 text-xs font-semibold">
              Zapisz ustawienia
            </a>
          </span>

          <span class="flex hover:bg-sky-100 p-1">
            <a @click="runAutomationNow" class="rounded-md p-1 text-xs font-semibold">
              Uruchom automatyzację teraz
            </a>
          </span>
        </div>

        <div class="text-xs font-semibold text-[#435368]">
          Ustawienia Allegro
        </div>
      </div>
    </div>

    <div v-loading="loading" class="bg-white border border-[#d6dfe9] p-4">
      <div class="grid grid-cols-1 gap-4">
        <FormSection title="Automatyzacja zamówień">
          <div class="grid grid-cols-1 gap-4 text-xs text-[#334155]">
            <p>
              Harmonogram uruchamia automatyzację co 5 minut (import, tworzenie lokalnych zamówień, synchronizacja cen/stanów).
            </p>

            <el-checkbox v-model="settings.autoImportOrders">
              Automatyczny import zamówień z Allegro (AutoImportOrders)
            </el-checkbox>

            <el-checkbox v-model="settings.autoCreateLocalOrders">
              Automatyczne tworzenie zamówień lokalnych po imporcie (AutoCreateLocalOrders)
            </el-checkbox>

            <el-checkbox v-model="settings.autoSyncPrices">
              Automatyczna synchronizacja cen ofert
            </el-checkbox>

            <el-checkbox v-model="settings.autoSyncStock">
              Automatyczna synchronizacja stanów ofert
            </el-checkbox>

            <div class="max-w-xs">
              <label class="block text-xs font-semibold text-[#64748b] mb-1">
                Ile dni wstecz importować zamówienia
              </label>
              <el-input-number
                v-model="settings.importOrdersDaysBack"
                :min="1"
                :max="365"
                class="!w-full"
              />
            </div>

            <el-checkbox v-model="settings.sandbox">
              Tryb sandbox
            </el-checkbox>

            <p
              v-if="settings.autoCreateLocalOrders && !automationDefaultsReady"
              class="text-[#b45309]"
            >
              Aby automatycznie tworzyć zamówienia lokalne, uzupełnij wszystkie domyślne wartości poniżej.
            </p>
          </div>
        </FormSection>

        <FormSection title="Domyślne wartości zamówienia lokalnego">
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Sklep</label>
              <el-select v-model="settings.defaultStoreId" clearable filterable class="!w-full" placeholder="Wybierz sklep">
                <el-option
                  v-for="store in stores"
                  :key="store.id"
                  :label="store.name || store.id"
                  :value="store.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Utworzone przez (ID użytkownika)</label>
              <el-input v-model="settings.defaultCreatedById" placeholder="GUID użytkownika" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Domyślny klient (ID użytkownika)</label>
              <el-input v-model="settings.defaultCustomerId" placeholder="GUID klienta" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Język</label>
              <el-select v-model="settings.defaultLanguageId" clearable filterable class="!w-full" placeholder="Wybierz język">
                <el-option
                  v-for="language in languages"
                  :key="language.id"
                  :label="language.name || language.id"
                  :value="language.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Kraj</label>
              <el-select
                v-model="settings.defaultCountryId"
                clearable
                filterable
                class="!w-full"
                placeholder="Wybierz kraj"
                @change="onCountryChange"
              >
                <el-option
                  v-for="country in countries"
                  :key="country.id"
                  :label="country.name"
                  :value="country.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Województwo</label>
              <el-select v-model="settings.defaultStateProvinceId" clearable filterable class="!w-full" placeholder="Wybierz województwo">
                <el-option
                  v-for="province in stateProvinces"
                  :key="province.id"
                  :label="province.name"
                  :value="province.id"
                />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Metoda dostawy</label>
              <el-select v-model="settings.defaultDeliveryMethod" class="!w-full">
                <el-option label="Kurier" :value="0" />
                <el-option label="Odbiór własny" :value="1" />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Status zamówienia</label>
              <el-select v-model="settings.defaultOrderStatus" class="!w-full">
                <el-option label="Nowe" :value="1" />
                <el-option label="Wstrzymane" :value="10" />
                <el-option label="W trakcie" :value="20" />
                <el-option label="Wysłane" :value="30" />
                <el-option label="Zakończone" :value="40" />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Status płatności — opłacone</label>
              <el-select v-model="settings.defaultPaidPaymentStatus" class="!w-full">
                <el-option label="Oczekuje na płatność" :value="10" />
                <el-option label="Płatność otrzymana" :value="20" />
                <el-option label="Płatność nieudana" :value="30" />
              </el-select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-[#64748b] mb-1">Status płatności — nieopłacone</label>
              <el-select v-model="settings.defaultUnpaidPaymentStatus" class="!w-full">
                <el-option label="Oczekuje na płatność" :value="10" />
                <el-option label="Płatność otrzymana" :value="20" />
                <el-option label="Płatność nieudana" :value="30" />
              </el-select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Cenniki dostawy">
          <el-table :data="deliveryPriceLists" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!deliveryPriceLists.length"
            description="Brak cenników dostawy"
          />
        </FormSection>

        <FormSection title="Polityki zwrotów">
          <el-table :data="returnPolicies" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!returnPolicies.length"
            description="Brak polityk zwrotów"
          />
        </FormSection>

        <FormSection title="Rękojmie">
          <el-table :data="impliedWarranties" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!impliedWarranties.length"
            description="Brak rękojmi"
          />
        </FormSection>

        <FormSection title="Gwarancje">
          <el-table :data="warranties" :border="true" class="!bg-[#d6dfe9]">
            <el-table-column label="ID" width="260">
              <template #default="scope">
                {{ scope.row.id || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="Nazwa">
              <template #default="scope">
                {{ scope.row.name || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!warranties.length"
            description="Brak gwarancji"
          />
        </FormSection>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import Cookies from 'universal-cookie'
import jwt_decode from 'jwt-decode'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()
const cookies = new Cookies()

const loading = ref(false)
const saving = ref(false)
const runningAutomation = ref(false)

const stores = ref<any[]>([])
const languages = ref<any[]>([])
const countries = ref<any[]>([])
const stateProvinces = ref<any[]>([])

const deliveryPriceLists = ref<any[]>([])
const returnPolicies = ref<any[]>([])
const impliedWarranties = ref<any[]>([])
const warranties = ref<any[]>([])

const envDefaults = Api.allegro.getAllegroLocalOrderEnvDefaults()

const settings = reactive({
  sandbox: false,
  autoImportOrders: false,
  autoCreateLocalOrders: false,
  autoSyncPrices: false,
  autoSyncStock: false,
  importOrdersDaysBack: 30,
  defaultStoreId: envDefaults.storeId as string | null,
  defaultCreatedById: envDefaults.userId as string | null,
  defaultCustomerId: envDefaults.userId as string | null,
  defaultLanguageId: envDefaults.languageId as string | null,
  defaultCountryId: envDefaults.countryId as string | null,
  defaultStateProvinceId: envDefaults.stateProvinceId as string | null,
  defaultDeliveryMethod: 0,
  defaultOrderStatus: 1,
  defaultPaidPaymentStatus: 20,
  defaultUnpaidPaymentStatus: 10,
})

const automationDefaultsReady = computed(() => {
  return !!(
    settings.defaultStoreId &&
    settings.defaultCreatedById &&
    settings.defaultCustomerId &&
    settings.defaultLanguageId &&
    settings.defaultCountryId &&
    settings.defaultStateProvinceId
  )
})

const normalizeList = (result: any) => {
  const data = result?.data || result
  return data?.items || data || []
}

const toGuidString = (value: any) => {
  if (!value) return null
  return String(value)
}

const applySettings = (data: any) => {
  settings.sandbox = data?.sandbox ?? false
  settings.autoImportOrders = data?.autoImportOrders ?? false
  settings.autoCreateLocalOrders = data?.autoCreateLocalOrders ?? false
  settings.autoSyncPrices = data?.autoSyncPrices ?? false
  settings.autoSyncStock = data?.autoSyncStock ?? false
  settings.importOrdersDaysBack = data?.importOrdersDaysBack ?? 30
  settings.defaultStoreId = envDefaults.storeId || toGuidString(data?.defaultStoreId)
  settings.defaultCreatedById = envDefaults.userId || toGuidString(data?.defaultCreatedById)
  settings.defaultCustomerId = envDefaults.userId || toGuidString(data?.defaultCustomerId)
  settings.defaultLanguageId = envDefaults.languageId || toGuidString(data?.defaultLanguageId)
  settings.defaultCountryId = envDefaults.countryId || toGuidString(data?.defaultCountryId)
  settings.defaultStateProvinceId = envDefaults.stateProvinceId || toGuidString(data?.defaultStateProvinceId)
  settings.defaultDeliveryMethod = data?.defaultDeliveryMethod ?? 0
  settings.defaultOrderStatus = data?.defaultOrderStatus ?? 1
  settings.defaultPaidPaymentStatus = data?.defaultPaidPaymentStatus ?? 20
  settings.defaultUnpaidPaymentStatus = data?.defaultUnpaidPaymentStatus ?? 10
}

const buildSettingsPayload = () => ({
  sandbox: settings.sandbox,
  autoImportOrders: settings.autoImportOrders,
  autoCreateLocalOrders: settings.autoCreateLocalOrders,
  autoSyncPrices: settings.autoSyncPrices,
  autoSyncStock: settings.autoSyncStock,
  importOrdersDaysBack: settings.importOrdersDaysBack,
  defaultStoreId: envDefaults.storeId || settings.defaultStoreId || null,
  defaultCreatedById: envDefaults.userId || settings.defaultCreatedById || null,
  defaultCustomerId: envDefaults.userId || settings.defaultCustomerId || null,
  defaultLanguageId: envDefaults.languageId || settings.defaultLanguageId || null,
  defaultCountryId: envDefaults.countryId || settings.defaultCountryId || null,
  defaultStateProvinceId: envDefaults.stateProvinceId || settings.defaultStateProvinceId || null,
  defaultDeliveryMethod: settings.defaultDeliveryMethod,
  defaultOrderStatus: settings.defaultOrderStatus,
  defaultPaidPaymentStatus: settings.defaultPaidPaymentStatus,
  defaultUnpaidPaymentStatus: settings.defaultUnpaidPaymentStatus,
})

const loadReferenceData = async () => {
  const storeId = settings.defaultStoreId || cookies.get('dsStore')

  const [storesResult, languagesResult, addressesResult] = await Promise.all([
    Api.stores.list(),
    Api.languages.list(),
    storeId ? Api.orders.getAvilableAddresses(storeId) : Promise.resolve(null),
  ])

  stores.value = normalizeList(storesResult)
  languages.value = normalizeList(languagesResult)

  if (addressesResult) {
    countries.value = (addressesResult.countries || []).map((country: any) => ({
      id: country.value,
      name: country.text,
    }))

    stateProvinces.value = (addressesResult.stateOrProvinces || []).map((province: any) => ({
      id: province.value,
      name: province.text,
    }))
  }
}

const loadAutomationSettings = async () => {
  const result = await Api.allegro.getSettings()
  const data = result?.data || result
  applySettings(data)
}

const loadSaleSettings = async () => {
  const [delivery, returns, implied, warranty] = await Promise.all([
    Api.allegro.getDeliveryPriceLists(),
    Api.allegro.getReturnPolicies(),
    Api.allegro.getImpliedWarranties(),
    Api.allegro.getWarranties(),
  ])

  deliveryPriceLists.value = normalizeList(delivery)
  returnPolicies.value = normalizeList(returns)
  impliedWarranties.value = normalizeList(implied)
  warranties.value = normalizeList(warranty)
}

const ensureEnvDefaults = () => {
  if (envDefaults.storeId) {
    settings.defaultStoreId = envDefaults.storeId
  } else if (!settings.defaultStoreId) {
    const storeId = cookies.get('dsStore')
    if (storeId) {
      settings.defaultStoreId = storeId
    }
  }

  if (envDefaults.countryId) {
    settings.defaultCountryId = envDefaults.countryId
  }

  if (envDefaults.stateProvinceId) {
    settings.defaultStateProvinceId = envDefaults.stateProvinceId
  }

  if (envDefaults.userId) {
    settings.defaultCreatedById = envDefaults.userId
    settings.defaultCustomerId = envDefaults.userId
    return
  }

  if (settings.defaultCreatedById) {
    return
  }

  try {
    const token = cookies.get('Authorization')
    if (!token) return

    const decoded: any = jwt_decode(token)
    if (decoded?.UserId) {
      settings.defaultCreatedById = decoded.UserId
    }
  } catch (error) {
    console.error(error)
  }
}

const onCountryChange = async () => {
  await loadReferenceData()
}

const loadAll = async () => {
  loading.value = true

  try {
    ensureEnvDefaults()

    await loadAutomationSettings()
    await loadReferenceData()
    await loadSaleSettings()

    toast.success('Pobrano ustawienia Allegro')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się pobrać ustawień Allegro')
  } finally {
    loading.value = false
  }
}

const saveAutomationSettings = async () => {
  if (settings.autoCreateLocalOrders && !automationDefaultsReady.value) {
    toast.warning('Uzupełnij domyślne wartości zamówienia lokalnego')
    return
  }

  saving.value = true

  try {
    const result = await Api.allegro.saveSettings(buildSettingsPayload())
    applySettings(result?.data || result)
    toast.success('Zapisano ustawienia automatyzacji Allegro')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zapisać ustawień')
  } finally {
    saving.value = false
  }
}

const runAutomationNow = async () => {
  runningAutomation.value = true

  try {
    await Api.allegro.runAutomation()
    toast.success('Automatyzacja Allegro została uruchomiona')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się uruchomić automatyzacji')
  } finally {
    runningAutomation.value = false
  }
}

onMounted(async () => {
  await loadAll()
})
</script>

<style scoped>
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
