<template>
  <el-table ref="table" :data="dataTable.items" :border="true" style="width: 100%" stripe>
    <el-table-column type="expand">
      <template #default="props">
        <div class="bg-gray-100">
          <div class="flex w-full justify-center gap-[30%] p-2">
            <div>
              <span class="font-bold text-base">Dane Klienta</span>
              <p v-show="props.row.billingAddress.companyName" m="t-0 b-2">
                Firma: {{ props.row.billingAddress.companyName }}
              </p>
              <p>
                Imię i nazwisko:
                {{ props.row.billingAddress.firstName + ' ' + props.row.billingAddress.lastName }}
              </p>
              <p>Adres: {{ props.row.billingAddress.addressLine1 }}</p>
              <p>Kod pocztowy: {{ props.row.billingAddress.zipCode }}</p>
              <p>Miasto: {{ props.row.billingAddress.city }}</p>
            </div>
            <div>
              <span class="font-bold text-base">Dane Wysyłki</span>
              <p v-show="props.row.billingAddress.companyName" m="t-0 b-2">
                Firma: {{ props.row.billingAddress.companyName }}
              </p>
              <p>
                Imię i nazwisko:
                {{ props.row.billingAddress.firstName + ' ' + props.row.billingAddress.lastName }}
              </p>
              <p>Adres: {{ props.row.billingAddress.addressLine1 }}</p>
              <p>Kod pocztowy: {{ props.row.billingAddress.zipCode }}</p>
              <p>Miasto: {{ props.row.billingAddress.city }}</p>
            </div>
          </div>
          <div class="px-8 flex gap-5 my-5">
            <strong>Informacje dodatkowe: </strong>
            <p class="w-[75%] text-wrap">
              {{ props.row.orderNote }}
            </p>
          </div>
          <div class="table__product py-4 px-8">
            <el-table :data="props.row.orderItems" :border="true">
              <el-table-column label="Zdjęcie" width="120">
                <template #default="prop"
                  ><a :href="'https://olmag.pl/' + prop.row.slug" target="_blank">
                    <img
                      :src="prop.row.productImage"
                      class="object-contain w-[40px] h-[40px] m-auto"
                    />
                  </a>
                </template>
              </el-table-column>
              <el-table-column label="Nazwa produktu" prop="productName">
                <template #default="prop"
                  ><a :href="'https://olmag.pl/' + prop.row.slug" target="_blank">{{
                    prop.row.productName
                  }}</a></template
                >
              </el-table-column>
              <el-table-column label="Data zamówienia" width="140" prop="city" />
              <el-table-column label="Ilość" width="70" prop="quantity" />
              <el-table-column label="Kod" width="140" prop="identificationCode" />
              <el-table-column label="Cena producenta" width="140">
                <template #default="prop">
                  <span> {{ prop.row.producerPrice }} zł </span>
                </template>
              </el-table-column>
              <el-table-column label="Cena produktu" width="140">
                <template #default="prop">
                  <span> {{ prop.row.productPrice }} zł </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="Nr. zam." prop="numberOrder" width="130" />
    <el-table-column label="Data zamówienia">
      <template #default="prop">
        {{ formatDate(prop.row.createdOn) }}
      </template>
    </el-table-column>
    <el-table-column label="Faktura" width="65">
      <div class="text-center">
        <a class="font-bold cursor-pointer">Pokaż</a>
      </div>
    </el-table-column>
    <el-table-column label="Dane klienta" prop="billingData" />
    <el-table-column label="Adres wysyłki" prop="shippingData" />
    <el-table-column label="Informacje dodatkowe" width="90">
      <template #default="prop">
        <el-row class="justify-center">
          <div class="text-center">
            <span
              class="font-bold cursor-pointer"
              v-if="prop.row.orderNote"
              @click="handleToggleRow(prop.row)"
              >Sprwadź</span
            >
            <span v-else>-</span>
          </div>
        </el-row>
      </template>
    </el-table-column>
    <el-table-column label="Kwota" prop="orderTotal" width="90">
      <template #default="prop">
        <el-row class="justify-center">
          <div class="text-center font-semibold">
            <span>{{ prop.row.orderTotal.toFixed(2) }} zł</span>
          </div>
        </el-row>
      </template>
    </el-table-column>
    <el-table-column label="Status">
      <template #default="prop">
        <el-row class="justify-center">
          <el-select
            v-model="prop.row.orderStatus"
            class="m-2 select__element"
            @change="handleChangeStatus($event, prop.row.id)"
            placeholder="Select"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-row>
      </template>
    </el-table-column>

    <el-table-column label="Opłacone" width="120">
      <template #default="prop">
        <el-row class="justify-center">
          <el-select
            v-model="prop.row.isPaid"
            @change="handleChangePaid(prop.row.isPaid, prop.row.id)"
            class="m-2 select__element"
            placeholder="Select"
            :class="`${prop.row.isPaid ? 'paid' : 'notpaid'}`"
          >
            <el-option label="Tak" :value="true"></el-option>
            <el-option label="Nie" :value="false"></el-option>
          </el-select>
        </el-row>
      </template>
    </el-table-column>
    <el-table-column label="Faktura"> </el-table-column>
  </el-table>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

enum OrderStatus {
  New = 1,
  OnHold = 10,
  InProgress = 20,
  Shipped = 30,
  Complete = 40,
  Canceled = 50,
  Refunded = 60,
  Closed = 70,
  OverduePayment = 80,
  WorkOrder = 100
}

const options = [
  { value: OrderStatus.New, label: 'Nowe' },
  { value: OrderStatus.OnHold, label: 'Wstrzymane' },
  { value: OrderStatus.InProgress, label: 'W trakcie realizacji' },
  { value: OrderStatus.Shipped, label: 'Wysłane' },
  { value: OrderStatus.Complete, label: 'Zakończone' },
  { value: OrderStatus.Canceled, label: 'Anulowane' },
  { value: OrderStatus.Refunded, label: 'Zwrot' },
  { value: OrderStatus.Closed, label: 'Zamknięte' },
  { value: OrderStatus.OverduePayment, label: 'Opóźniona płatność' },
  { value: OrderStatus.WorkOrder, label: 'Zamówienie robocze' } // Dodaj nowy status, jeśli jest taki dostępny
]

const toast = useToast()
const cookies = new Cookies()
const table = ref(null)
const dataTable = ref([])
const parentBorder = ref(false)
const childBorder = ref(false)

const formatDate = (dateIso: string) => {
  const date = new Date(dateIso) // Utwórz obiekt daty

  // Formatowanie daty na polski
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  }

  return date.toLocaleString('pl-PL', options)
}

const filter = ref({
  StoreId: cookies.get('dsStore'),
  PageNumber: 1,
  PageSize: 120,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        Name: null,
        HasOptions: null,
        IsVisibleIndividually: null,
        IsPublished: null,
        CreatedOn: null
      }
    }
  }
})

const handleChangeStatus = async (status: number, orderId: string) => {
  const currentStatus = {
    orderStatus: status,
    orderId: orderId
  }

  const payload = {
    body: JSON.stringify(currentStatus)
  }

  await Api.orders.changeOrderStatus(payload)
  toast.success('Zmieniono status zamówienia')
}

const handleChangePaid = async (status: boolean, orderId: string) => {
  const currentStatus = {
    isPaid: status,
    orderId: orderId
  }

  const payload = {
    body: JSON.stringify(currentStatus)
  }

  await Api.orders.changePaidStatus(payload)
  toast.success('Zmieniono status płatności')
}

const handleToggleRow = (row) => {
  table.value.toggleRowExpansion(row)
}

onMounted(async () => {
  try {
    const payload = {
      body: JSON.stringify(filter.value)
    }
    const result = await Api.orders.smartTable(payload)
    dataTable.value = result.data
    console.log(dataTable.value)
  } catch (error) {
    console.error(error)
  }
})
</script>

<style>
.cell {
  text-align: center;
  font-size: 11px;
}

.el-select-dropdown__item.selected {
  color: #fb923c !important;
}

.select__element .el-input {
  font-size: 11px;
  font-weight: 700;
}

.table__product .cell {
  font-size: 12px;
  font-weight: 500;
}

.paid .el-input__wrapper {
  background: #4ade80;
}
.notpaid .el-input__wrapper {
  background: #dc2626;
}
</style>
