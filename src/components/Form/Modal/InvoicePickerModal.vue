<template>
  <div class="relative w-full h-full">
    <div class="flex items-center justify-between mb-3">
      <div class="text-lg font-semibold">Wybierz fakturę z tego miesiąca</div>
      <button
        class="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
        @click="$emit('close')"
      >
        Zamknij
      </button>
    </div>

    <!-- Kontekst zamówienia -->
    <div
      v-if="store.orderContext"
      class="mb-4 p-3 rounded bg-slate-50 border border-slate-200 text-sm"
    >
      <div class="font-semibold mb-2 text-slate-700">
        Dane zamówienia (odbiorca faktury)
      </div>

      <div class="grid grid-cols-2 gap-x-6 gap-y-1">
        <div>
          <span class="text-slate-500">Klient:</span>
          <strong class="ml-1">{{ store.orderContext.clientName }}</strong>
        </div>

        <div v-if="store.orderContext.companyName">
          <span class="text-slate-500">Firma:</span>
          <strong class="ml-1">{{ store.orderContext.companyName }}</strong>
        </div>

        <div v-if="store.orderContext.nip">
          <span class="text-slate-500">NIP:</span>
          <strong class="ml-1">{{ normalizeNip(store.orderContext.nip) }}</strong>
        </div>

        <div>
          <span class="text-slate-500">Kwota zamówienia:</span>
          <strong class="ml-1">{{ store.orderContext.orderTotal.toFixed(2) }} zł</strong>
        </div>
      </div>
    </div>

    <!-- Wyszukiwarka -->
    <div class="flex gap-2 mb-3">
      <el-input
        v-model="store.search"
        placeholder="Szukaj po numerze / nabywcy / NIP..."
        class="!w-[380px]"
      />
      <el-button @click="store.reload" :loading="store.loading">Odśwież</el-button>
    </div>

    <!-- Tabela faktur -->
    <el-table
      :data="store.filtered"
      v-loading="store.loading"
      height="55vh"
      style="width: 100%"
      @row-dblclick="attachInvoiceToOrder"
    >
      <el-table-column prop="number" label="Numer" width="160" />
      <el-table-column prop="buyerName" label="Nabywca" />

      <el-table-column label="NIP" width="150">
        <template #default="{ row }">
          {{ normalizeNip(row.buyerTaxNumber) }}
        </template>
      </el-table-column>

      <el-table-column label="Podgląd" width="110">
        <template #default="{ row }">
          <a :href="row.viewUrl" target="_blank" class="text-blue-600 underline">Otwórz</a>
        </template>
      </el-table-column>

      <el-table-column label="" width="140" align="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            :loading="attachLoading && attachingInvoiceId === row.id"
            @click="attachInvoiceToOrder(row)"
          >
            Wybierz
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useInvoiceStore } from '/@/stores/invoice'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'

const store = useInvoiceStore()
const toast = useToast()

// rodzic (App.vue) ma tylko zamknąć modal; attached opcjonalnie do refresh
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'attached'): void
}>()

const attachLoading = ref(false)
const attachingInvoiceId = ref<number | null>(null)

const normalizeNip = (nip?: string | null): string => {
  if (!nip) return ''
  return nip.replace(/\D/g, '') // same cyfry
}

const attachInvoiceToOrder = async (invoice: any) => {
  if (!store.orderContext?.orderId) {
    toast.error('Brak kontekstu zamówienia')
    return
  }
  try {
    attachLoading.value = true
    attachingInvoiceId.value = invoice.id
    
    const payload = {
      orderId: store.orderContext.orderId,
      invoiceId: String(invoice.id),
      number: invoice.number,
      token: invoice.token 
    }

    await Api.orders.addInvoiceToOrder(payload)

    toast.success(`Podpięto fakturę ${invoice.number} do zamówienia`)
    emit('close')
  } catch (e) {
    console.error(e)
    toast.error('Nie udało się podpiąć faktury do zamówienia')
  } finally {
    attachLoading.value = false
    attachingInvoiceId.value = null
  }
}
</script>
