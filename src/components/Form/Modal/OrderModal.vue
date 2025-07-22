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

const invoicePath = ref<string | null>(null)


const emit = defineEmits(['closeOrder'])

const closeOfferHandle = () => {
    emit('closeOrder')
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

    const dataPurchaseInovice = {
      orderId: props.order.id,
      base64File: {
        base64String: cleanBase64,
      },
    }

    const payload = {
      body: JSON.stringify(dataPurchaseInovice),
    };

    var response = await Api.orders.uploadPurchaseInvoice(payload)
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
onMounted(async () => {
  console.log(props.order.invoicePurchasePath)
})

onMounted(() => {
  invoicePath.value = props.order?.invoicePurchasePath || null
})
</script>
<template>
 <div>
    <!-- Zamknięcie -->
    <div class="flex justify-end border-b pb-2">
      <div class="left">
        <a @click="closeOfferHandle" class="cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
            <path fill="currentColor"
              d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z" />
          </svg>
        </a>
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
          <button class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded">
            Wyślij fakturę
          </button>
          <!-- Drop zone -->
          <el-upload
            class="upload-demo w-full"
            drag
            multiple
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              Przeciągnij plik tutaj lub <em>kliknij aby wgrać</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">Obsługiwane pliki PDF do 5MB</div>
            </template>
          </el-upload>
        </div>

        <!-- Prawa kolumna: faktura zakupowa -->
        <div class="w-1/2 border rounded shadow p-4 flex flex-col gap-4">
          <h2 class="text-lg font-semibold mb-2">Faktura zakupowa za towar</h2>
          <!-- Drop zone -->
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
            <div v-if="invoicePath" class="mt-2">
            <a
                :href="invoicePath"
                target="_blank"
                class="text-blue-600 underline text-sm flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16">
                <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8zm1 7H8V8h7zm0 4H8v-1h7zm-3 4H8v-1h4zM13 3.5L18.5 9H14z"/>
                </svg>
                Zobacz wgraną fakturę zakupową
            </a>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>