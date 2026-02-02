<script lang="ts" setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { Api } from '/@/services/api'
import { onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification'

const toast = useToast()

const props = defineProps({
    order: {
        type: Object,
        default: null
    },
});

const invoicePurchasePaths = ref<string[]>([])
const invoicePath = ref<string | null>(null)
const proformaPath = ref<string | null>(null)

const emit = defineEmits(['closeOrder'])

const closeOfferHandle = () => {
    emit('closeOrder')
}


const sendInvoice = async () => {
  await Api.invoices.sendInvoice(props.order.id)
}

const removePurchaseInvoice = async (invoiceId: string) => {
  try {
    const data = {
      orderId: props.order.id,
      purchaseInvoiceId: invoiceId,
    }

    const payload = {
      body: JSON.stringify(data),
    }

    await Api.orders.removePurchaseInvoice(payload)

    // Usuń z oryginalnego obiektu zamówienia
    props.order.purchaseInvoices = props.order.purchaseInvoices.filter(
      (pi) => pi.purchaseInvoiceId !== invoiceId
    )

    invoicePurchasePaths.value = props.order.purchaseInvoices.map(
      (pi) => pi.purchaseInvoiceFilePath
    )

    toast.success('Faktura została usunięta')
  } catch (error) {
    console.error('Błąd usuwania faktury:', error)
    toast.error('Nie udało się usunąć faktury')
  }
}

const generateProforma = async () => {
  try {
    const { data } = await Api.invoices.generateProforma(props.order.id)
    proformaPath.value = data
    if (props.order) props.order.proformaPath = data
    toast.success('Proforma została wygenerowana')
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wygenerować proformy')
  }
}

const handlePurchaseInvoiceUpload = async (uploadInfo: any) => {
  const file = uploadInfo.raw || uploadInfo.file?.raw
  if (!file) {
    console.warn('Brak pliku')
    return
  }

  try {
    const base64String = await toBase64(file)
    const cleanBase64 = base64String.split(',')[1]

    const dataPurchaseInvoice = {
      orderId: props.order.id,
      base64File: {
        base64String: cleanBase64,
      },
      fileName: file.name
    }

    const payload = {
      body: JSON.stringify(dataPurchaseInvoice),
    }

    // Backend zwraca PurchaseInvoiceEntity
    const response = await Api.orders.uploadPurchaseInvoice(payload)

    // Upewniamy się, że lista istnieje
    if (!props.order.purchaseInvoices) {
      props.order.purchaseInvoices = []
    }

    // Dodajemy nową fakturę bez odpytywania backendu
    props.order.purchaseInvoices.push({
      purchaseInvoiceId: response.data.purchaseInvoiceId,
      purchaseInvoiceFilePath: response.data.purchaseInvoiceFilePath
    })

    // Aktualizujemy ścieżki do wyświetlenia
    invoicePurchasePaths.value = props.order.purchaseInvoices.map(p => p.purchaseInvoiceFilePath)

    toast.success('Faktura zakupowa została przesłana')

  } catch (error) {
    console.error('Błąd przesyłania faktury:', error)
    toast.error('Błąd przesyłania faktury zakupowej')
  }
}


const handleUploadInvoice = async (uploadInfo: any) => {
  const file = uploadInfo.raw || uploadInfo.file?.raw
  if (!file) {
    console.warn('Brak pliku')
    return
  }

  try {
    const base64String = await toBase64(file)
    const cleanBase64 = base64String.split(',')[1]

   const dataInovice = {
      orderId: props.order.id,
      base64File: {
        base64String: cleanBase64,
      }
    }

    const payload = {
      body: JSON.stringify(dataInovice),
    };

    var response = await Api.orders.uploadInvoice(payload)
    invoicePath.value = response.data
      toast.success('Faktura zakupowa została przesłana')

  } catch (error) {
    console.error('Błąd przesyłania faktury:', error)
    console.log('Błąd przesyłania faktury')
  }
}


const toBase64 = (file: File): Promise<string> => {
    console.log(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

onMounted(() => {
  invoicePurchasePaths.value = props.order?.purchaseInvoices?.map(p => p.purchaseInvoiceFilePath) || []
  invoicePath.value = props.order?.invoicePath || null
})
</script>
<template>
 <div>
    <!-- Zamknięcie -->
    <div class="flex justify-between border-b pb-2">
      <div class="right">
        <h1 class="text-xl font-semibold">Zamówienie: {{ order.orderNumber }}</h1>
      </div>
      <div class="left">
        <a @click="closeOfferHandle" class="cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z" />
          </svg>
        </a>
      </div>
    </div>
    <!-- Zarządzaj -->
    <div class="mt-5">
      <h2 class="text-xl font-semibold">Zarządzaj</h2>
      <div class="flex gap-4 mt-5">
        <button
          @click="generateProforma"
          class="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-1 px-4 rounded"
        >
          Wyślij proformę
        </button>

        <div v-if="proformaPath" class="flex items-center gap-2">
          <a
            :href="proformaPath"
            target="_blank"
            class="text-blue-600 underline text-sm flex items-center gap-1"
          >
            <!-- ikona PDF -->
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8zM8 8h7v1H8zm0 4h7v1H8zm0 4h4v1H8zM13 3.5 18.5 9H14z"/>
            </svg>
            Zobacz proformę
          </a>
        </div>
      </div>
    </div>
    <!-- Rozliczenie & Dostawa -->
    <div class="mt-5">
      <h2 class="text-xl font-semibold">Rozliczenie & Dostawa</h2>
      <div class="flex gap-4 mt-5">
        <!-- Billing -->
        <div class="w-1/2 border rounded shadow p-4 flex flex-col justify-between">
          <div>
            <h2 class="text-lg font-semibold mb-4">Billing address</h2>
          </div>
          <div class="mt-4 text-right">
            <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded">
              Edit
            </button>
          </div>
        </div>

        <!-- Shipping -->
        <div class="w-1/2 border rounded shadow p-4 flex flex-col justify-between">
          <div>
            <h2 class="text-lg font-semibold mb-4">Shipping address</h2>
          </div>
          <div class="mt-4 text-right">
            <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded">
              Edit
            </button>
          </div>
        </div>
      </div>

      <!-- Faktury -->
      <h2 class="text-xl font-semibold mt-8">Faktury</h2>
      <div class="flex gap-4 mt-5">
        <!-- Lewa kolumna: faktura sprzedażowa -->
        <div class="w-1/2 border rounded shadow p-4 flex flex-col gap-4">
          <h2 class="text-lg font-semibold mb-2">Faktura sprzedażowa</h2>
          <button class="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-4 rounded">
            Generuj fakturę
          </button>
          <button @click="sendInvoice()" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded">
            Wyślij fakturę
          </button>
          <!-- Drop zone -->
          <el-upload
            class="upload-demo w-full"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".pdf"
            @change="handleUploadInvoice"
            >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
                Przeciągnij plik tutaj lub <em>kliknij aby wgrać</em>
            </div>
            <template #tip>
                <div class="el-upload__tip">Obsługiwane pliki PDF do 5MB</div>
            </template>
            </el-upload>
            <div v-if="invoicePath" class="mt-2">
            <a
                :href="invoicePath + '?inline=yes'"
                target="_blank"
                class="text-blue-600 underline text-sm flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8zm1 7H8V8h7zm0 4H8v-1h7zm-3 4H8v-1h4zM13 3.5L18.5 9H14z"/>
                </svg>
                Zobacz wgraną fakturę
            </a>
            </div>
        </div>

        <!-- Prawa kolumna: faktura zakupowa -->
        <div class="w-1/2 border rounded shadow p-4 flex flex-col gap-4">
        <h2 class="text-lg font-semibold mb-2">Faktura zakupowa za towar</h2>

        <el-upload
            class="upload-demo w-full"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".pdf"
            @change="handlePurchaseInvoiceUpload"
        >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
            Przeciągnij plik tutaj lub <em>kliknij aby wgrać</em>
            </div>
            <template #tip>
            <div class="el-upload__tip">Obsługiwane pliki PDF do 5MB</div>
            </template>
        </el-upload>

        <div v-if="invoicePurchasePaths.length > 0" class="mt-2 flex flex-col gap-2">
          <template v-for="(pi, index) in props.order.purchaseInvoices" :key="pi.purchaseInvoiceId">
            <div class="flex items-center justify-between gap-2">
                <a
                :href="pi.purchaseInvoiceFilePath"
                target="_blank"
                class="text-blue-600 underline text-sm flex items-center gap-1"
                >
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                    <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8zm1 7H8V8h7zm0 4H8v-1h7zm-3 4H8v-1h4zM13 3.5L18.5 9H14z" />
                </svg>
                {{ pi.purchaseInvoiceName || `Faktura ${index + 1}` }}
                </a>
                    <button
                    @click="removePurchaseInvoice(pi.purchaseInvoiceId)"
                    class="text-red-500 hover:text-red-700 p-1"
                    title="Usuń fakturę"
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path fill="currentColor" d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9ZM7 6H17V19H7V6ZM9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
                    </svg>
                </button>
            </div>
            </template>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>