<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'
import { useOfferStore } from '/@/stores/offer'

const router = useRouter()
const toast = useToast()
const cookies = new Cookies()
const offer = useOfferStore()

const dataTable = ref([])
const selectedRowId = ref(null);

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

const formatDate = (dateIso: string) => {
  const date = new Date(dateIso) // Utwórz obiekt daty

  // Formatowanie daty na polski
  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }


  return date.toLocaleDateString('pl-PL', options)
}

const handleRowClick = (row) => {
  selectedRowId.value = row.offerId;
};

const showOfferHandle = async (row) => {
  await offer.showOffer(selectedRowId.value)
  console.log(offer.currentOffer)
}

const rowClassName = ({ row }) => {
  return row.offerId === selectedRowId.value ? 'selected-row' : '';
};

const editSelectedRecord = () => {
  if (selectedRowId.value) {
    const selectedId = selectedRowId.value;
    router.push(`/sale/offer/edit/${selectedId}`);
  }
  else {
    toast.warning("Wybierz ofertę do edycji")
  }
};

function row_key(row) {
     return row.sortId
}

const fetchTableData = async () => {
  try {
    const payload = {
      body: JSON.stringify(filter.value),
    };

    // Wykonaj zapytanie do API
    const result = await Api.offers.smartTable(payload);

    dataTable.value = result.data;
  } catch (error) {
    console.error('Błąd podczas pobierania danych:', error);
    toast.error('Wystąpił problem z pobraniem danych');
  }
};

onMounted(async () => {
  try {
    await fetchTableData()
  } catch (error) {
    console.error(error)
  }
})
</script>
<template>
<div class="mt-10">
     <div class="bg-[#f1f4f9] p-2  border-t-[3px] border-[#64748b] rounded-t-xl">
        <div class="flex justify-between">
            <div class="flex">
                <span class="flex hover:bg-sky-100 p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="m-auto text-green-500" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 13v3q0 .425.288.713T12 17t.713-.288T13 16v-3h3q.425 0 .713-.288T17 12t-.288-.712T16 11h-3V8q0-.425-.288-.712T12 7t-.712.288T11 8v3H8q-.425 0-.712.288T7 12t.288.713T8 13zm1 9q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22m0-2q3.35 0 5.675-2.325T20 12t-2.325-5.675T12 4T6.325 6.325T4 12t2.325 5.675T12 20m0-8"/></svg>
                    <router-link :to="'/sale/offer/createoffer'" class=" rounded-md p-1 text-xs font-semibold">Nowa oferta</router-link>
                    </span>
                    <span class="ml-4 flex hover:bg-sky-100 p-1">
                        <svg xmlns="http://www.w3.org/2000/svsg" class="m-auto text-orange-500" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h8.925l-2 2H5v14h14v-6.95l2-2V19q0 .825-.587 1.413T19 21zm4-6v-4.25l9.175-9.175q.3-.3.675-.45t.75-.15q.4 0 .763.15t.662.45L22.425 3q.275.3.425.663T23 4.4t-.137.738t-.438.662L13.25 15zM21.025 4.4l-1.4-1.4zM11 13h1.4l5.8-5.8l-.7-.7l-.725-.7L11 11.575zm6.5-6.5l-.725-.7zl.7.7z"/></svg>
                    <a @click="editSelectedRecord" class=" rounded-md p-1 text-xs font-semibold">Edytuj ofertę</a>
                </span>
            </div>
        </div>
    </div>
  </div>
  <div class="table-container">
    <el-table class="pt-[1px] !bg-[#d6dfe9]" ref="tableData" :row-key="row_key" :data="dataTable.items" :border="true" @row-click="handleRowClick" @row-dblclick="showOfferHandle" style="width: 100%;" :row-class-name="rowClassName">
      <el-table-column  label="Nr. zam." label-class-name="order_label" prop="offerNumber" width="130">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center search_input">Nr. oferty</div>
        <div class="search-row bg-[#e0e8f0] h-[50px] py-1 px-2 content-center">
            <el-input
              style="border-radius: 1px !important; font-size:12px;"
              placeholder="Szukaj..."
              v-model="filter.SmartTableParam.Search.PredicateObject.OfferNumber"
              class="!font-s m-auto"
              @blur="sendFilterUpdate"
            >
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
    <el-table-column label="Kwota"  width="180" label-class-name="order_label">
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
    <el-table-column label="Dane klienta" prop="billingData" label-class-name="order_label">
    <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center search_input">Dane Firmy</div>
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
              v-if="prop.row.offerNote"
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
</template>


<style>
.table__product .el-table {
  --el-table-border-color:2px solid #fafbfd !important ; /* Ustaw kolor obramowania */
  --el-table-border: 2px solid #fafbfd !important;
  --el-border-width: 1px; /* Ustaw grubość obramowania */
  --el-table-row-hover-bg-color: none !important;
  --el-fill-color-lighter: #f1f4f9
}

.non-clickable-select {
  pointer-events: none !important;
  user-select: none !important;
}

.producer_section .formkit-outer {
  margin:auto;
}

/* Utrzymuje kolor tła w zależności od wartości */
.select-green .el-input__wrapper {
  background-color: #4ade80 !important; /* Zielony */
  color: white !important;
  border-radius: 4px;
  box-shadow: none !important;
}

.select-red .el-input__wrapper {
  background-color: #f87171 !important; /* Czerwony */
  color: white !important;
  border-radius: 4px;
  box-shadow: none !important;
}

.el-scrollbar__thumb {
  display: none !important;

}

.select-red .el-input__suffix,
.select-green .el-input__suffix {
  display: none;
}

/* Upewnia się, że tekst i strzałka są białe */
.select-green .el-input__inner,
.select-red .el-input__inner {
  color: white !important;
  font-weight: bold;
  text-align: center;
}

.select-green .el-select__caret,
.select-red .el-select__caret {
  color: white !important;
}

.table__product .el-table__row {
  overflow: none !important;
}

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

.paid .el-input__wrapper {
  background: #4ade80;
}

.notpaid .el-input__wrapper {
  background: #F53333;
}

.order_label{
  color:#435368;
  background-color: #f1f4f9 !important;
  border-right:1px solid #fafbfd !important;
  border-top:1.1px solid #fafbfd !important;
  margin:2px !important;
}


.table-container {
  height:100%;
  overflow-y: hidden; /* Włącz przewijanie pionowe */
  overflow-x: hidden; /* Opcjonalnie ukryj przewijanie poziome */
  border: 1px solid #d6dfe9; /* Opcjonalnie dodaj obramowanie */
}

.search-row .el-input__wrapper{
  border-radius: 0px 15px 15px 0px !important;
  padding:0px;
}

.el-table--fit {
  height: 100% !important;
}

.el-table__body-wrapper {
  max-height: 76vh !important;
  overflow-y: auto; /* Włącz przewijanie pionowe */
  overflow-x: hidden; /* Opcjonalnie ukryj przewijanie poziome */
  border: 1px solid #d6dfe9; /* Opcjonalnie dodaj obramowanie */
}

.selected-row {
  background-color: #cce7ff !important; /* Kolor podświetlenia */
}
</style>