<template>
  <div class="p-3 h-[100%]">
  <div class="bg-[#f1f4f9] p-2  border-t-[3px] border-[#64748b] rounded-t-xl">
    <div class="flex justify-between">
      <div class="flex">
      <span class="flex hover:bg-sky-100 p-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="m-auto text-green-500" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13v3q0 .425.288.713T12 17t.713-.288T13 16v-3h3q.425 0 .713-.288T17 12t-.288-.712T16 11h-3V8q0-.425-.288-.712T12 7t-.712.288T11 8v3H8q-.425 0-.712.288T7 12t.288.713T8 13zm1 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
      <router-link :to="'/sale/order/createorder'" class=" rounded-md p-1 text-xs font-semibold">Dodaj zamówienie</router-link>
      <!-- {{filter}} -->
    </span>
    <span class="ml-4 flex hover:bg-sky-100 p-1">
      <svg xmlns="http://www.w3.org/2000/svsg" class="m-auto text-orange-500" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h8.925l-2 2H5v14h14v-6.95l2-2V19q0 .825-.587 1.413T19 21zm4-6v-4.25l9.175-9.175q.3-.3.675-.45t.75-.15q.4 0 .763.15t.662.45L22.425 3q.275.3.425.663T23 4.4t-.137.738t-.438.662L13.25 15zM21.025 4.4l-1.4-1.4zM11 13h1.4l5.8-5.8l-.7-.7l-.725-.7L11 11.575zm6.5-6.5l-.725-.7zl.7.7z"/></svg>
      <a @click="editSelectedRecord" class=" rounded-md p-1 text-xs font-semibold">Edytuj zamówienie</a>
    </span>
    <span class="ml-4 flex hover:bg-sky-100 p-1">
      <svg xmlns="http://www.w3.org/2000/svg" class="m-auto text-blue-500" width="20" height="20" viewBox="0 0 24 24"><!-- Icon from Stash Icons by Pingback LLC - https://github.com/stash-ui/icons/blob/master/LICENSE --><path fill="currentColor" d="M17.5 14.75a2.75 2.75 0 1 0 0 5.5a2.75 2.75 0 0 0 0-5.5m-4.25 2.75a4.25 4.25 0 1 1 8.5 0a4.25 4.25 0 0 1-8.5 0m6.093-1.405a.75.75 0 0 1 0 1.06l-2.28 2.28l-1.406-1.405a.75.75 0 1 1 1.06-1.06l.346.344l1.22-1.22a.75.75 0 0 1 1.06 0" opacity=".5"/><path fill="currentColor" d="M6 2.25A2.75 2.75 0 0 0 3.25 5v14.382a1.75 1.75 0 0 0 2.533 1.565l1-.5a.25.25 0 0 1 .261.024l.906.679a1.75 1.75 0 0 0 2.1 0l.862-.647a.25.25 0 0 1 .279-.014l.673.404a.75.75 0 1 0 .772-1.286l-.674-.404a1.75 1.75 0 0 0-1.95.1l-.862.647a.25.25 0 0 1-.3 0l-.906-.68a1.75 1.75 0 0 0-1.832-.164l-1 .5a.25.25 0 0 1-.362-.224V5c0-.69.56-1.25 1.25-1.25h10c.69 0 1.25.56 1.25 1.25v5.5a.75.75 0 0 0 1.5 0V5A2.75 2.75 0 0 0 16 2.25z"/><path fill="currentColor" d="M7 6.25a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5zm0 3a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5zm0 3a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5zm0 3a.75.75 0 0 0 0 1.5h3.5a.75.75 0 0 0 0-1.5z"/></svg>
      <a @click="invoiceGenerate" class=" rounded-md p-1 text-xs font-semibold">Generuj fakturę</a>
    </span>
    </div>
    <el-input
              style="border-radius: 1px !important; font-size:12px;"
              placeholder="Nazwa produktu lub kod"
              v-model="filter.SmartTableParam.Search.PredicateObject.ProductName"
              class="!font-s !w-[240px]"
              @blur="sendFilterUpdate"
            >
      </el-input>
    </div>
  </div>
  <div class="table-container">
  <el-table class="pt-[1px] !bg-[#d6dfe9]" ef="table" :data="dataTable.items" :border="true" style="width: 100%; min-height: 81vh;" @row-click="handleRowClick" :row-class-name="rowClassName">
    <el-table-column type="expand">
      <template #default="props">
        <div class="">
          <div class="flex w-full gap-[30%] p-2">
            <div>
              <span class="font-bold text-base">Dane Klienta</span>
              <p v-show="props.row.billingAddress.companyName" m="t-0 b-2">
                Firma: {{ props.row.billingAddress.companyName }}
              </p>
              <p v-show="props.row.billingAddress.nip" m="t-0 b-2">
                Nip: {{ props.row.billingAddress.nip }}
              </p>
              <p>
                Imię i nazwisko:
                {{ props.row.billingAddress.firstName + ' ' + props.row.billingAddress.lastName }}
              </p>
              <p>Adres: {{ props.row.billingAddress.addressLine1 }}</p>
              <p>Kod pocztowy: {{ props.row.billingAddress.zipCode }}</p>
              <p>Miasto: {{ props.row.billingAddress.city }}</p>
              <p>Email: {{ props.row.billingAddress.email }}</p>
              <p>Telefon: {{ props.row.billingAddress.phone }}</p>
            </div>

            <div>
              <span class="font-bold text-base">Dane Wysyłki</span>
              <p v-show="props.row.shippingAddress.companyName" m="t-0 b-2">
                Firma: {{ props.row.shippingAddress.companyName }}
              </p>
              <p>
                Imię i nazwisko:
                {{ props.row.shippingAddress.firstName + ' ' + props.row.shippingAddress.lastName }}
              </p>
              <p>Adres: {{ props.row.shippingAddress.addressLine1 }}</p>
              <p>Kod pocztowy: {{ props.row.shippingAddress.zipCode }}</p>
              <p>Miasto: {{ props.row.shippingAddress.city }}</p>
              <p>Telefon: {{ props.row.shippingAddress.phone }}</p>
            </div>
            <div>
              <span class="font-bold text-base">Pozostałe dane</span>
              <p>Płatność: {{ translatePaymentProvider(props.row.payment) }}</p>
              <p>Numer Faktury: {{ props.row.invoiceNumber }}</p>
              <p>Numer Proformy: {{ props.row.proformaNumber }}</p>
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
              <el-table-column label="Data zamówienia"   width="140" prop="city" />
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
    <el-table-column  label="Nr. zam." label-class-name="order_label" prop="numberOrder" width="130">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center search_input">Nr. zam.</div>
        <div class="search-row bg-[#e0e8f0] h-[50px] py-1 px-2 content-center">
            <el-input
              style="border-radius: 1px !important; font-size:12px;"
              placeholder="Szukaj..."
              v-model="filter.SmartTableParam.Search.PredicateObject.NumberOrder"
              class="!font-s m-auto"
              @blur="sendFilterUpdate"
            >
          <!-- Ikona SVG jako prefix -->
          <template #prefix>
            <span class="flex items-center pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 32 32" fill="currentColor">
                <g fill="none">
                  <path
                    clip-rule="evenodd"
                    d="M18.874 19.581a6 6 0 1 1 .707-.707l4.273 4.272l-.708.708zM20 15a5 5 0 1 1-10 0a5 5 0 0 1 10 0z"
                    fill="currentColor"
                    fill-rule="evenodd"
                  />
                </g>
              </svg>
            </span>
          </template>
        </el-input>
        </div>
      </div>
    </template>
    </el-table-column>
    <el-table-column label="Kwota" prop="orderTotal" width="180" label-class-name="order_label">
  <template #header>
    <div class="header-content">
      <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Data zamówienia</div>
      <div class="bg-[#e0e8f0] h-[50px] py-1 px-2 block">
        <el-date-picker
          v-model="filter.SmartTableParam.Search.PredicateObject.DateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="Od"
          end-placeholder="Do"
          :unlink-panels="true"
          format="YYYY-MM-DD"
          class="h-5 !w-[170px] !p-1 mt-1"
          @change="sendFilterUpdate"
          />
      </div>
    </div>
  </template>
  <template #default="prop">
    {{ formatDate(prop.row.createdOn) }}
  </template>
</el-table-column>
    <el-table-column label="Zamówienie" width="95" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] h-[60px] content-center border-[#d6dfe9] search_input">Zamówienie</div>
        <div class="search-row bg-[#e0e8f0] h-[50px] py-1 px-2 content-center">
        </div>
      </div>
    </template>
      <template #default="prop">
        <div class="text-center">
          <router-link :to="`/sale/order/${prop.row.id}`" target="_blank" class="font-bold"
            >Pokaż</router-link
          >
        </div>
      </template>
    </el-table-column>
    <el-table-column label="Dane klienta" prop="billingData" label-class-name="order_label">
    <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center search_input">Dane klienta</div>
        <div class="search-row bg-[#e0e8f0] h-[50px] py-1 px-2 content-center">
            <el-input
              style="border-radius: 1px !important; font-size:12px;"
              placeholder="Szukaj..."
              class="!font-s m-auto"
              v-model="filter.SmartTableParam.Search.PredicateObject.ClientData"
              @blur="sendFilterUpdate"
            >
          <!-- Ikona SVG jako prefix -->
          <template #prefix>
            <span class="flex items-center pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 32 32" fill="currentColor">
                <g fill="none">
                  <path
                    clip-rule="evenodd"
                    d="M18.874 19.581a6 6 0 1 1 .707-.707l4.273 4.272l-.708.708zM20 15a5 5 0 1 1-10 0a5 5 0 0 1 10 0z"
                    fill="currentColor"
                    fill-rule="evenodd"
                  />
                </g>
              </svg>
            </span>
          </template>
        </el-input>
        </div>
      </div>
    </template>
    </el-table-column>
    <el-table-column label="Adres wysyłki" prop="shippingData" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px]  border-[#d6dfe9] search_input h-[60px] content-center">Adres wysyłki</div>
        <div class="search-row bg-[#e0e8f0] h-[50px] py-1 px-2 content-center ">
          <div class="m-auto">
            <el-input
              style="border-radius: 1px !important; font-size:12px;"
              placeholder="Szukaj..."
              class="!font-s"
              v-model="filter.SmartTableParam.Search.PredicateObject.ShipmentData"
              @blur="sendFilterUpdate"
            >
          <!-- Ikona SVG jako prefix -->
          <template #prefix>
            <span class="flex items-center pl-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 32 32" fill="currentColor">
                <g fill="none">
                  <path
                    clip-rule="evenodd"
                    d="M18.874 19.581a6 6 0 1 1 .707-.707l4.273 4.272l-.708.708zM20 15a5 5 0 1 1-10 0a5 5 0 0 1 10 0z"
                    fill="currentColor"
                    fill-rule="evenodd"
                  />
                </g>
              </svg>
            </span>
          </template>
        </el-input>
      </div>

        </div>
      </div>
    </template>
    </el-table-column>
    <el-table-column label="Informacje dodatkowe" width="90" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] h-[60px] content-center border-[#d6dfe9] search_input">Informacje dodatkowe</div>
        <div class="search-row bg-[#e0e8f0] h-[50px] py-1 px-2 content-center">
        </div>
      </div>
    </template>
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
    <el-table-column label="Kwota" prop="orderTotal" width="180" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Kwota</div>
        <div class=" bg-[#e0e8f0]  h-[50px] py-1 px-2 block">
          <el-input-number class="h-5 " placeholder="Od" :controls="false" :precision="2" :step="0.1" :max="9999999" 
          v-model="filter.SmartTableParam.Search.PredicateObject.AmountMin"
          @blur="sendFilterUpdate"
          />
          <el-input-number class="h-5" placeholder="Do" :controls="false" :precision="2" :step="0.1" :max="9999999" 
          v-model="filter.SmartTableParam.Search.PredicateObject.AmountMax"
          @blur="sendFilterUpdate"
          />
        </div>
      </div>
    </template>
    </el-table-column>
    <el-table-column label="Status" width="200" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Status</div>
        <div class=" bg-[#e0e8f0]  h-[50px] py-2 px-2 block">
          <el-select
          v-model="filter.SmartTableParam.Search.PredicateObject.OrderStatus"
          clearable
          placeholder="Wybierz status"
          :value="filter.SmartTableParam.Search.PredicateObject.OrderStatus"
          @change="sendFilterUpdate"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        </div>
      </div>
    </template>
      <template #default="prop">
        <el-row class="justify-center">
          <el-select
            v-model="prop.row.orderStatus"
            class="m-2 select__element"
            :value="filter.SmartTableParam.Search.PredicateObject.OrderStatus"
            placeholder="Select"
            @change="handleChangeStatus($event, prop.row.id)"
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

    <el-table-column label="Opłacone" width="120" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Opłacone</div>
        <div class=" bg-[#e0e8f0]  h-[50px] py-2 px-2 block">
          <el-select
            class="select__element"
            placeholder="Wybierz"
            v-model="filter.SmartTableParam.Search.PredicateObject.IsPaid"
            @change="sendFilterUpdate"
          >
          <el-option label="Tak" :value="true"></el-option>
          <el-option label="Nie" :value="false"></el-option>
        </el-select>
        </div>
      </div>
    </template>
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
    <el-table-column label="Faktura" width="120" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Faktura</div>
        <div class=" bg-[#e0e8f0]  h-[50px] py-2 px-2 block">
          <el-select
            class=" select__element"
            placeholder="Wybierz"
            v-model="filter.SmartTableParam.Search.PredicateObject.IsInvoice"
            @change="sendFilterUpdate"
          >
            <el-option label="Tak" :value="true"></el-option>
            <el-option label="Nie" :value="false"></el-option>
          </el-select>
        </div>
      </div>
    </template>
    </el-table-column>
  </el-table>
</div>
<el-pagination
      background
      layout="prev, pager, next"
      :current-page="dataTable.pageNumber"
      :page-size="filter.PageSize"
      :total="dataTable.totalCount"
      @current-change="handlePageChange"
      class="m-2"
    />
</div>

</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

enum PaymentProvider {
  Przelewy24 = 0,
  StandardTransfer = 1,
  CashOnDelivery = 2,
  PayPo = 3,
  Blik = 4,
  Term = 5
}

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

const router = useRouter()
const toast = useToast()
const cookies = new Cookies()
const selectedRow = ref(null);
const selectedRowId = ref(null);
const table = ref(null)
const dataTable = ref([])
const parentBorder = ref(false)
const childBorder = ref(false)
const filters = ref({
      numberOrder: null,
      amountMin: null,
      amountMax: null,
      dateRange: null,
      clientData: null,
      shipmentData: null,
      orderStatus: null,
    });

const handleRowClick = (row) => {
  selectedRowId.value = row.id;
  selectedRow.value = row;
};

const rowClassName = ({ row }) => {
  return row.id === selectedRowId.value ? 'selected-row' : '';
};

const editSelectedRecord = () => {
  if (selectedRow.value) {
    const selectedId = selectedRow.value.id;
    router.push(`/sale/order/edit/${selectedId}`);
  }
  else {
    toast.warning("Wybierz zamówienie do edycji")
  }
};

const invoiceGenerate = async () => {
  console.log(selectedRow.value)
  if(!selectedRow.value.isPaid){
    toast.warning("Zamówienie musi być opłacone")
    return;
  }
  
    const result = await Api.invoices.createInvoice(selectedRow.value.id);
}

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
  PageSize: 12,
  SmartTableParam: {
    Search: {
      PredicateObject: {
        NumberOrder: null,
        AmountMin: null,
        AmountMax: null,
        DateRange: null,
        ClientData: null,
        ShipmentData: null,
        OrderStatus: null,
        InvoceStatus: null,
        ProductName: null
      }
    }
  }
})

const fetchTableData = async () => {
  try {
    const payload = {
      body: JSON.stringify(filter.value),
    };

    // Wykonaj zapytanie do API
    const result = await Api.orders.smartTable(payload);

    dataTable.value = result.data;
  } catch (error) {
    console.error('Błąd podczas pobierania danych:', error);
    toast.error('Wystąpił problem z pobraniem danych');
  }
};

const sendFilterUpdate = async () => {
  try {
    const payload = {
      body: JSON.stringify(filter.value),
    };

    // Wykonanie żądania do backendu
    const result = await Api.orders.smartTable(payload);

    // Aktualizacja danych tabeli
    dataTable.value = result.data; // Przypisanie nowych danych do `dataTable`
    toast.success('Dane zostały zaktualizowane');
  } catch (error) {
    console.error('Błąd podczas wysyłania danych filtrowania:', error);
    toast.error('Wystąpił problem z aktualizacją danych');
  }
};


const handlePageChange = async (page) => {
  filter.value.PageNumber = page;
  await fetchTableData();
};

const handleChangeStatus = async (status: number, orderId: string) => {
  const currentStatus = {
    orderStatus: status,
    orderId: orderId
  }

  const payload = {
    body: JSON.stringify(currentStatus)
  }
  console.log(currentStatus)
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
    await fetchTableData()
  } catch (error) {
    console.error(error)
  }
})

function translatePaymentProvider(value: number): string | null {
  switch (value) {
    case PaymentProvider.Przelewy24:
      return 'Przelewy24'
    case PaymentProvider.StandardTransfer:
      return 'Przelew Standardowy'
    case PaymentProvider.CashOnDelivery:
      return 'Płatność przy odbiorze'
    case PaymentProvider.PayPo:
      return 'PayPo'
    case PaymentProvider.Blik:
      return 'Blik'
    case PaymentProvider.Term:
      return 'Termin'
    default:
      return null // lub inny sposób obsługi nieprawidłowej wartości
  }
}
</script>

<style>
.cell {
  text-align: center;
  font-size: 11px;
}

.el-range-input {
  font-size:10px !important;
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

.el-scrollbar__thumb {
  display: none !important;

}

.paid .el-input__wrapper {
  background: #4ade80;
}

.notpaid .el-input__wrapper {
  background: #dc2626;
}

.order_label{
  color:#435368;
  background-color: #f1f4f9 !important;
  border-right:1px solid #fafbfd !important;
  border-top:1.1px solid #fafbfd !important;
  margin:2px !important;
}

.el-table__body-wrapper {
  margin-top: 1px;
}

.table-container {
  overflow-y: hidden; /* Włącz przewijanie pionowe */
  overflow-x: hidden; /* Opcjonalnie ukryj przewijanie poziome */
  border: 1px solid #d6dfe9; /* Opcjonalnie dodaj obramowanie */
}

.search-row .el-input__wrapper{
  border-radius: 0px 15px 15px 0px !important;
  padding:0px;
}

.el-table__body-wrapper {
  max-height: 68vh !important; /* Maksymalna wysokość tabeli */
  overflow-y: auto; /* Włącz przewijanie pionowe */
  overflow-x: hidden; /* Opcjonalnie ukryj przewijanie poziome */
  border: 1px solid #d6dfe9; /* Opcjonalnie dodaj obramowanie */
}

.selected-row {
  background-color: #cce7ff !important; /* Kolor podświetlenia */
}
</style>
