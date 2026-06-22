<script lang="ts" setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { Api } from '/@/services/api'
import { onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const props = defineProps({
  order: {
    type: Object,
    default: null
  }
})

const invoicePurchasePaths = ref<string[]>([])
const invoicePath = ref<string | null>(null)
const proformaPath = ref<string | null>(null)
const sendingPaymentLink = ref(false)
const sendingReviewRequest = ref(false)

const billingEditing = ref(false)
const shippingEditing = ref(false)
const savingAddresses = ref(false)
const customerOrderNumber = ref('')
const separateShipping = ref(false)

const billingForm = ref<Record<string, any>>({})
const shippingForm = ref<Record<string, any>>({})

const emit = defineEmits(['closeOrder'])

const closeOfferHandle = () => {
  emit('closeOrder')
}

const cloneAddress = (addr: Record<string, any> | null | undefined) => ({
  isCompany: addr?.isCompany ?? false,
  firstName: addr?.firstName ?? '',
  lastName: addr?.lastName ?? '',
  email: addr?.email ?? '',
  companyName: addr?.companyName ?? '',
  nip: addr?.nip ?? '',
  phone: addr?.phone ?? '',
  addressLine1: addr?.addressLine1 ?? '',
  city: addr?.city ?? '',
  zipCode: addr?.zipCode ?? '',
  stateOrProvinceId: addr?.stateOrProvinceId ?? '00000000-0000-0000-0000-000000000000',
  countryId: addr?.countryId ?? '00000000-0000-0000-0000-000000000000'
})

const addressesEqual = (a: Record<string, any>, b: Record<string, any>) => {
  return (
    a.isCompany === b.isCompany &&
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    (a.email || '') === (b.email || '') &&
    (a.companyName || '') === (b.companyName || '') &&
    (a.nip || '') === (b.nip || '') &&
    (a.phone || '') === (b.phone || '') &&
    a.addressLine1 === b.addressLine1 &&
    a.city === b.city &&
    a.zipCode === b.zipCode
  )
}

const formatAddress = (addr: Record<string, any> | null | undefined) => {
  if (!addr) return '—'
  const lines: string[] = []
  if (addr.isCompany && addr.companyName) {
    lines.push(addr.companyName)
    if (addr.nip) lines.push(`NIP: ${addr.nip}`)
  } else {
    lines.push(`${addr.firstName || ''} ${addr.lastName || ''}`.trim())
  }
  if (addr.email) lines.push(addr.email)
  if (addr.phone) lines.push(`Tel: ${addr.phone}`)
  if (addr.addressLine1) lines.push(addr.addressLine1)
  if (addr.zipCode || addr.city) lines.push(`${addr.zipCode || ''} ${addr.city || ''}`.trim())
  return lines.filter(Boolean).join('\n')
}

const initFormsFromOrder = () => {
  if (!props.order) return
  billingForm.value = cloneAddress(props.order.billingAddress)
  shippingForm.value = cloneAddress(props.order.shippingAddress)
  customerOrderNumber.value = props.order.customerOrderNumber || ''
  if (!props.order.attachments) props.order.attachments = []
  separateShipping.value = !addressesEqual(billingForm.value, shippingForm.value)
  invoicePurchasePaths.value = props.order.purchaseInvoices?.map((p: any) => p.purchaseInvoiceFilePath) || []
  invoicePath.value = props.order.invoicePath || null
  proformaPath.value = props.order.proformaPath || null
}

const mapAddressPayload = (addr: Record<string, any>) => ({
  IsCompany: addr.isCompany,
  FirstName: addr.firstName,
  LastName: addr.lastName,
  Email: addr.email || null,
  CompanyName: addr.companyName || null,
  Nip: addr.nip || null,
  Phone: addr.phone || null,
  AddressLine1: addr.addressLine1,
  City: addr.city,
  ZipCode: addr.zipCode,
  StateOrProvinceId: addr.stateOrProvinceId,
  CountryId: addr.countryId
})

const saveBillingAndShipping = async () => {
  if (!props.order?.id) return

  const zipCodeRegex = /^\d{2}-\d{3}$/
  if (!zipCodeRegex.test(billingForm.value.zipCode)) {
    toast.error('Kod pocztowy rozliczeniowy jest niepoprawny (format xx-xxx).')
    return
  }
  if (separateShipping.value && !zipCodeRegex.test(shippingForm.value.zipCode)) {
    toast.error('Kod pocztowy dostawy jest niepoprawny (format xx-xxx).')
    return
  }

  savingAddresses.value = true
  try {
    const sameAddress = !separateShipping.value
    const payload = {
      OrderId: props.order.id,
      CustomerOrderNumber: customerOrderNumber.value?.trim() || null,
      UseShippingAddressAsBillingAddress: sameAddress,
      BillingAddress: mapAddressPayload(billingForm.value),
      ShippingAddress: sameAddress ? null : mapAddressPayload(shippingForm.value)
    }

    await Api.orders.updateOrderBillingAndShipping({
      body: JSON.stringify(payload)
    })

    props.order.customerOrderNumber = customerOrderNumber.value?.trim() || null
    props.order.billingAddress = { ...billingForm.value }
    props.order.shippingAddress = sameAddress ? { ...billingForm.value } : { ...shippingForm.value }

    billingEditing.value = false
    shippingEditing.value = false
    toast.success('Dane zamówienia zostały zapisane')
  } catch (error) {
    console.error(error)
    toast.error('Nie udało się zapisać danych zamówienia')
  } finally {
    savingAddresses.value = false
  }
}

const PaymentProvider = {
  Przelewy24: 0,
  StandardTransfer: 1,
  CashOnDelivery: 2,
  PayPo: 3,
  Blik: 4,
  Term: 5,
  Allegro: 6
}

const OrderStatus = {
  Shipped: 30,
  Complete: 40,
  Closed: 70
}

const isOrderShipped = () => {
  if (!props.order) return false
  if (props.order.isShipped === true) return true
  return props.order.orderStatus === OrderStatus.Shipped
    || props.order.orderStatus === OrderStatus.Complete
    || props.order.orderStatus === OrderStatus.Closed
}

const canGenerateInvoice = () => {
  if (!props.order) return false
  if (!isOrderShipped()) return false
  if (props.order.invoiceType === 0 || props.order.invoiceType === 2) return false
  if (props.order.sendInvoice && props.order.invoiceType !== 1) return false
  if (props.order.paymentProvider === PaymentProvider.Term) return true
  if (props.order.paymentProvider === PaymentProvider.CashOnDelivery) return props.order.isPaid === true
  return props.order.isPaid === true
}

const generateInvoice = async () => {
  if (!canGenerateInvoice()) {
    if (!isOrderShipped()) {
      toast.warning('Zamówienie musi być wysłane')
      return
    }
    if (props.order.paymentProvider === PaymentProvider.CashOnDelivery && !props.order.isPaid) {
      toast.warning('Zamówienie za pobraniem musi być opłacone')
      return
    }
    if (props.order.paymentProvider !== PaymentProvider.Term && !props.order.isPaid) {
      toast.warning('Zamówienie musi być opłacone')
      return
    }
    toast.warning('Faktura została już wystawiona')
    return
  }

  try {
    await Api.invoices.createInvoice(props.order.id)
    const refreshed = await Api.orders.get(props.order.id)
    const orderData = refreshed.data ?? refreshed
    props.order.invoicePath = orderData.invoicePath
    props.order.sendInvoice = orderData.sendInvoice
    props.order.invoiceType = orderData.invoiceType
    props.order.invoiceNumber = orderData.invoiceNumber
    invoicePath.value = props.order.invoicePath || null
    toast.success('Faktura została wygenerowana')
  } catch (error: any) {
    toast.error(error?.message || 'Nie udało się wygenerować faktury')
  }
}

const sendInvoice = async () => {
  await Api.invoices.sendInvoice(props.order.id)
}

const removePurchaseInvoice = async (invoiceId: string) => {
  try {
    const data = {
      orderId: props.order.id,
      purchaseInvoiceId: invoiceId
    }

    await Api.orders.removePurchaseInvoice({
      body: JSON.stringify(data)
    })

    props.order.purchaseInvoices = props.order.purchaseInvoices.filter(
      (pi: any) => pi.purchaseInvoiceId !== invoiceId
    )

    invoicePurchasePaths.value = props.order.purchaseInvoices.map(
      (pi: any) => pi.purchaseInvoiceFilePath
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

const canSendPaymentLink = () => {
  if (!props.order) return false
  if (props.order.isPaid || props.order.paymentStatus === 20) return false
  if (props.order.paymentProvider === 2) return false
  return true
}

const sendPaymentLinkEmail = async () => {
  if (!props.order?.id) return
  sendingPaymentLink.value = true
  try {
    const result = await Api.orders.sendPaymentLink(props.order.id)
    const paymentUrl = result?.data ?? result
    if (paymentUrl && typeof paymentUrl === 'string') {
      toast.success('Wysłano e-mail z linkiem Przelewy24 i proformą')
    } else {
      toast.success('Wysłano e-mail z linkiem płatności i proformą')
    }
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wysłać linku płatności')
  } finally {
    sendingPaymentLink.value = false
  }
}

const sendReviewRequestEmail = async () => {
  if (!props.order?.id) return
  sendingReviewRequest.value = true
  try {
    await Api.orders.sendReviewRequest(props.order.id)
    toast.success('Wysłano e-mail z prośbą o opinię Google')
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się wysłać prośby o opinię')
  } finally {
    sendingReviewRequest.value = false
  }
}

const handlePurchaseInvoiceUpload = async (uploadInfo: any) => {
  const file = uploadInfo.raw || uploadInfo.file?.raw
  if (!file) return

  try {
    const base64String = await toBase64(file)
    const cleanBase64 = base64String.split(',')[1]

    const response = await Api.orders.uploadPurchaseInvoice({
      body: JSON.stringify({
        orderId: props.order.id,
        base64File: { base64String: cleanBase64 },
        fileName: file.name
      })
    })

    if (!props.order.purchaseInvoices) {
      props.order.purchaseInvoices = []
    }

    props.order.purchaseInvoices.push({
      purchaseInvoiceId: response.data.purchaseInvoiceId,
      purchaseInvoiceFilePath: response.data.purchaseInvoiceFilePath,
      purchaseInvoiceName: response.data.purchaseInvoiceName
    })

    invoicePurchasePaths.value = props.order.purchaseInvoices.map((p: any) => p.purchaseInvoiceFilePath)
    toast.success('Faktura zakupowa została przesłana')
  } catch (error) {
    console.error('Błąd przesyłania faktury:', error)
    toast.error('Błąd przesyłania faktury zakupowej')
  }
}

const handleUploadInvoice = async (uploadInfo: any) => {
  const file = uploadInfo.raw || uploadInfo.file?.raw
  if (!file) return

  try {
    const base64String = await toBase64(file)
    const cleanBase64 = base64String.split(',')[1]

    const response = await Api.orders.uploadInvoice({
      body: JSON.stringify({
        orderId: props.order.id,
        base64File: { base64String: cleanBase64 }
      })
    })

    invoicePath.value = response.data
    toast.success('Faktura sprzedażowa została przesłana')
  } catch (error) {
    console.error('Błąd przesyłania faktury:', error)
    toast.error('Błąd przesyłania faktury')
  }
}

const handleOrderAttachmentUpload = async (uploadInfo: any) => {
  const file = uploadInfo.raw || uploadInfo.file?.raw
  if (!file) return

  try {
    const base64String = await toBase64(file)
    const cleanBase64 = base64String.split(',')[1]

    const response = await Api.orders.uploadOrderAttachment({
      body: JSON.stringify({
        orderId: props.order.id,
        base64File: { base64String: cleanBase64 },
        fileName: file.name
      })
    })

    if (!props.order.attachments) {
      props.order.attachments = []
    }

    props.order.attachments.push(response.data)
    toast.success('Załącznik został dodany')
  } catch (error) {
    console.error('Błąd przesyłania załącznika:', error)
    toast.error('Nie udało się dodać załącznika')
  }
}

const removeOrderAttachment = async (attachmentId: string) => {
  try {
    await Api.orders.removeOrderAttachment({
      body: JSON.stringify({
        orderId: props.order.id,
        attachmentId
      })
    })

    props.order.attachments = (props.order.attachments || []).filter(
      (a: any) => a.attachmentId !== attachmentId
    )
    toast.success('Załącznik został usunięty')
  } catch (error) {
    console.error('Błąd usuwania załącznika:', error)
    toast.error('Nie udało się usunąć załącznika')
  }
}

const toBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

watch(() => props.order?.id, initFormsFromOrder, { immediate: true })

onMounted(initFormsFromOrder)
</script>

<template>
  <div>
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

    <div class="mt-5">
      <h2 class="text-xl font-semibold">Zarządzaj</h2>
      <div class="flex gap-4 mt-5">
        <button
          @click="generateProforma"
          class="bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-1 px-4 rounded"
        >
          Wyślij proformę
        </button>
        <button
          @click="sendPaymentLinkEmail"
          :disabled="!canSendPaymentLink() || sendingPaymentLink"
          class="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-1 px-4 rounded"
        >
          {{ sendingPaymentLink ? 'Wysyłam...' : 'Wyślij link P24 + proforma' }}
        </button>
        <button
          @click="sendReviewRequestEmail"
          :disabled="sendingReviewRequest"
          class="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-gray-900 font-semibold py-1 px-4 rounded"
        >
          {{ sendingReviewRequest ? 'Wysyłam...' : 'Wyślij prośbę o opinię Google' }}
        </button>
        <div v-if="proformaPath" class="flex items-center gap-2">
          <a :href="proformaPath" target="_blank" class="text-blue-600 underline text-sm">Zobacz proformę</a>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <h2 class="text-xl font-semibold">Rozliczenie & Dostawa</h2>

      <div class="mt-4 p-4 border rounded shadow bg-gray-50">
        <label class="block text-sm font-semibold mb-1">Numer zamówienia klienta</label>
        <p class="text-xs text-gray-500 mb-2">
          Na fakturze w polu numeru zamówienia pojawi się: {{ order.orderNumber }} | numer klienta
        </p>
        <input
          v-model="customerOrderNumber"
          type="text"
          class="w-full border rounded px-3 py-2 text-sm"
          placeholder="np. PO-2026/123"
        />
      </div>

      <div class="flex gap-4 mt-5">
        <div class="w-1/2 border rounded shadow p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Dane rozliczeniowe (klient)</h2>
            <button
              @click="billingEditing = !billingEditing"
              class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-3 rounded"
            >
              {{ billingEditing ? 'Anuluj' : 'Edytuj' }}
            </button>
          </div>

          <div v-if="!billingEditing" class="whitespace-pre-line text-sm text-gray-700">
            {{ formatAddress(billingForm) }}
          </div>

          <div v-else class="flex flex-col gap-2 text-sm">
            <label class="flex items-center gap-2">
              <input v-model="billingForm.isCompany" type="checkbox" />
              Firma
            </label>
            <input v-model="billingForm.email" class="border rounded px-2 py-1" placeholder="Email" />
            <input v-if="billingForm.isCompany" v-model="billingForm.companyName" class="border rounded px-2 py-1" placeholder="Nazwa firmy" />
            <input v-if="billingForm.isCompany" v-model="billingForm.nip" class="border rounded px-2 py-1" placeholder="NIP" />
            <template v-if="!billingForm.isCompany">
              <input v-model="billingForm.firstName" class="border rounded px-2 py-1" placeholder="Imię" />
              <input v-model="billingForm.lastName" class="border rounded px-2 py-1" placeholder="Nazwisko" />
            </template>
            <input v-model="billingForm.phone" class="border rounded px-2 py-1" placeholder="Telefon" />
            <input v-model="billingForm.addressLine1" class="border rounded px-2 py-1" placeholder="Ulica i numer" />
            <div class="flex gap-2">
              <input v-model="billingForm.zipCode" class="border rounded px-2 py-1 w-1/3" placeholder="Kod pocztowy" />
              <input v-model="billingForm.city" class="border rounded px-2 py-1 flex-1" placeholder="Miasto" />
            </div>
          </div>
        </div>

        <div class="w-1/2 border rounded shadow p-4">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">Adres dostawy</h2>
            <button
              v-if="separateShipping"
              @click="shippingEditing = !shippingEditing"
              class="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-3 rounded"
            >
              {{ shippingEditing ? 'Anuluj' : 'Edytuj' }}
            </button>
          </div>

          <label class="flex items-center gap-2 text-sm mb-3">
            <input v-model="separateShipping" type="checkbox" />
            Dostawa pod inny adres
          </label>

          <div v-if="!separateShipping" class="text-sm text-gray-500 italic">
            Taki sam jak adres rozliczeniowy
          </div>

          <template v-else>
            <div v-if="!shippingEditing" class="whitespace-pre-line text-sm text-gray-700">
              {{ formatAddress(shippingForm) }}
            </div>
            <div v-else class="flex flex-col gap-2 text-sm">
              <label class="flex items-center gap-2">
                <input v-model="shippingForm.isCompany" type="checkbox" />
                Firma
              </label>
              <input v-model="shippingForm.email" class="border rounded px-2 py-1" placeholder="Email" />
              <input v-if="shippingForm.isCompany" v-model="shippingForm.companyName" class="border rounded px-2 py-1" placeholder="Nazwa firmy" />
              <input v-if="shippingForm.isCompany" v-model="shippingForm.nip" class="border rounded px-2 py-1" placeholder="NIP" />
              <template v-if="!shippingForm.isCompany">
                <input v-model="shippingForm.firstName" class="border rounded px-2 py-1" placeholder="Imię" />
                <input v-model="shippingForm.lastName" class="border rounded px-2 py-1" placeholder="Nazwisko" />
              </template>
              <input v-model="shippingForm.phone" class="border rounded px-2 py-1" placeholder="Telefon" />
              <input v-model="shippingForm.addressLine1" class="border rounded px-2 py-1" placeholder="Ulica i numer" />
              <div class="flex gap-2">
                <input v-model="shippingForm.zipCode" class="border rounded px-2 py-1 w-1/3" placeholder="Kod pocztowy" />
                <input v-model="shippingForm.city" class="border rounded px-2 py-1 flex-1" placeholder="Miasto" />
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="mt-4 text-right">
        <button
          @click="saveBillingAndShipping"
          :disabled="savingAddresses"
          class="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 px-6 rounded"
        >
          {{ savingAddresses ? 'Zapisywanie...' : 'Zapisz dane klienta i dostawy' }}
        </button>
      </div>

      <h2 class="text-xl font-semibold mt-8">Załączniki do zamówienia</h2>
      <p class="text-sm text-gray-500 mt-1">Dodaj np. PDF od klienta — pliki niezwiązane z fakturą sprzedażową ani zakupową.</p>
      <div class="mt-3 border rounded shadow p-4 max-w-xl">
        <el-upload
          class="upload-demo w-full"
          drag
          :auto-upload="false"
          :show-file-list="false"
          accept=".pdf,.png,.jpg,.jpeg"
          @change="handleOrderAttachmentUpload"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            Przeciągnij plik tutaj lub <em>kliknij aby wgrać</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">PDF, JPG, PNG do 5MB</div>
          </template>
        </el-upload>

        <div v-if="order.attachments?.length" class="mt-3 flex flex-col gap-2">
          <div
            v-for="attachment in order.attachments"
            :key="attachment.attachmentId"
            class="flex items-center justify-between gap-2"
          >
            <a
              :href="attachment.filePath"
              target="_blank"
              class="text-blue-600 underline text-sm truncate"
            >
              {{ attachment.fileName }}
            </a>
            <button
              @click="removeOrderAttachment(attachment.attachmentId)"
              class="text-red-500 hover:text-red-700 p-1 shrink-0"
              title="Usuń załącznik"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                <path fill="currentColor" d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9ZM7 6H17V19H7V6ZM9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <h2 class="text-xl font-semibold mt-8">Faktury</h2>
      <div class="flex gap-4 mt-5">
        <div class="w-1/2 border rounded shadow p-4 flex flex-col gap-4">
          <h2 class="text-lg font-semibold mb-2">Faktura sprzedażowa</h2>
          <button
            @click="generateInvoice()"
            :disabled="!canGenerateInvoice()"
            class="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-1 px-4 rounded"
          >
            Generuj fakturę
          </button>
          <button @click="sendInvoice()" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-4 rounded">
            Wyślij fakturę
          </button>
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
              class="text-blue-600 underline text-sm"
            >
              Zobacz wgraną fakturę
            </a>
          </div>
        </div>

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
                  class="text-blue-600 underline text-sm truncate"
                >
                  {{ pi.purchaseInvoiceName || `Faktura ${index + 1}` }}
                </a>
                <button
                  @click="removePurchaseInvoice(pi.purchaseInvoiceId)"
                  class="text-red-500 hover:text-red-700 p-1 shrink-0"
                  title="Usuń fakturę"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
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
