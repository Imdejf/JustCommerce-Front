<script lang="ts" setup>
import { ref } from 'vue'
import ProductTable from '/@/components/Page/Catalog/Product/ProductTable.vue'
import ImportFile from '/@/components/Form/Modal/ImportFile.vue'
import ExportProductFieldsModal from '/@/components/Form/Modal/ExportProductFieldsModal.vue'
import Cookies from 'universal-cookie'
import { useToast } from 'vue-toastification'
import { Api } from '/@/services/api'

const cookies = new Cookies()
const toast = useToast()
const showImportModal = ref(false)
const showExportModal = ref(false)
const tableRef = ref<InstanceType<typeof ProductTable> | null>(null)
const exportLoading = ref(false)

const exportFields = [
  { key: 'Id', label: 'Id', required: true },
  { key: 'SKU', label: 'SKU' },
  { key: 'Kod identyfikacji', label: 'Kod identyfikacji' },
  { key: 'Nazwa', label: 'Nazwa' },
  { key: 'Nazwa Producenta', label: 'Nazwa Producenta' },
  { key: 'Cena', label: 'Cena' },
  { key: 'Cena Producenta', label: 'Cena Producenta' },
  { key: 'Narzut', label: 'Narzut' },
  { key: 'Stara cena', label: 'Stara cena' },
  { key: 'Cena promocyjna', label: 'Cena promocyjna' },
  { key: 'Id reguły transportu', label: 'Id reguły transportu' },
  { key: 'Nazwa reguły transportu', label: 'Nazwa reguły transportu' },
  { key: 'Cena transportu karton', label: 'Cena transportu karton' },
  { key: 'Cena transportu paleta', label: 'Cena transportu paleta' },
  { key: 'Darmowa dostawa', label: 'Darmowa dostawa' },
  { key: 'Pobranie', label: 'Pobranie' },
  { key: 'GMC', label: 'GMC' },
  { key: 'Opublikowany', label: 'Opublikowany' },
  { key: 'Czas realizacji', label: 'Czas realizacji' },
  { key: 'URL miniatury', label: 'URL miniatury' },
  { key: 'URL galerii', label: 'URL galerii' }
]

function openImportModal() {
  showImportModal.value = true
}

function openExportModal() {
  showExportModal.value = true
}

function onImportClose(success?: boolean) {
  showImportModal.value = false
  if (success) tableRef.value?.refresh?.()
}

async function onExportConfirm(fields: string[]) {
  showExportModal.value = false
  exportLoading.value = true
  try {
    const predicate = (tableRef.value?.getExportFilters?.() ?? {}) as Record<string, any>
    const createdOn = predicate.CreatedOn as { after?: string } | undefined
    const filters = {
      name: predicate.Name ?? null,
      identificationCode: predicate.IdentificationCode ?? null,
      brandId: predicate.BrandId ?? null,
      categoryId: predicate.CategoryId ?? null,
      isPublished: predicate.IsPublished ?? null,
      isVisibleIndividually: predicate.IsVisibleIndividually ?? null,
      hasOptions: predicate.HasOptions ?? null,
      minPrice: predicate.MinPrice ?? null,
      maxPrice: predicate.MaxPrice ?? null,
      minStock: predicate.MinStock ?? null,
      maxStock: predicate.MaxStock ?? null,
      createdFrom: createdOn?.after ?? null
    }
    const result = await Api.products.exportProductToExcel({
      body: JSON.stringify({
        storeId: cookies.get('dsStore'),
        fields,
        filters
      })
    })
    if (!result.ok) throw new Error(`HTTP ${result.status}`)
    const blob = await result.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Produkty_${new Date().toISOString().replace(/[:.]/g, '_')}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success('Eksport zakończony')
  } catch {
    toast.error('Błąd eksportu')
  } finally {
    exportLoading.value = false
  }
}
</script>

<template>
  <div>
    <ProductTable
      ref="tableRef"
      :export-loading="exportLoading"
      @open-import="openImportModal"
      @open-export="openExportModal"
    />
    <ImportFile
      :visible="showImportModal"
      title="Import produktów z Excela"
      :endpoints="['administration/product/ImportProductFromExcel', 'product/ImportProductFromExcel']"
      @close="onImportClose"
    />
    <ExportProductFieldsModal
      :visible="showExportModal"
      :fields="exportFields"
      @close="showExportModal = false"
      @confirm="onExportConfirm"
    />
  </div>
</template>
