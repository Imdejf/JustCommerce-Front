<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'

const router = useRouter()
const toast = useToast()
const cookies = new Cookies()

const dataTable = ref([])
const selectedRow = ref(null);
const selectedRowId = ref(null)

const filter = ref({
  StoreId: cookies.get('dsStore'),
  SmartTableParam: {
    Search: {
      PredicateObject: {
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
    const result = await Api.shipping.getAllOrderShippingNotProcessed(payload);

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

    const result = await Api.shipping.getAllOrderShippingNotProcessed(payload);

    dataTable.value = result.data;
    toast.success('Dane zostały zaktualizowane');
  } catch (error) {
    console.error('Błąd podczas wysyłania danych filtrowania:', error);
    toast.error('Wystąpił problem z aktualizacją danych');
  }
};


const handleRowClick = (row) => {
  selectedRowId.value = row.id;
  selectedRow.value = row;
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
  <div class="p-3">
  <div class="bg-[#f1f4f9] p-2  border-t-[3px] border-[#64748b] rounded-t-xl h-[40px]">
  </div>
  <div class="table-container !h-[100]">
  <el-table class="pt-[1px] !bg-[#d6dfe9]" ef="table" :data="dataTable.items" :border="true" style="width: 100%;" @row-click="handleRowClick">
    <el-table-column type="expand">
      <template #default="props" cell-name="tes">
        <div>
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
              <el-table-column label="Producent" width="140" prop="city" />
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
    <el-table-column  label="Nr. zam." label-class-name="order_label" prop="orderNumber" width="130">
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
    <el-table-column label="Producent" prop="brandName" width="180" label-class-name="order_label">
    <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Producent</div>
        <div class="bg-[#e0e8f0] h-[50px] py-1 px-2 block">
    
        </div>
      </div>
    </template>
    <template #default="{ row }">
      <span class="text-[12px] font-bold">{{ row.brandName }}</span>
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
    <el-table-column label="Adres wysyłki" prop="" label-class-name="order_label">
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
    <el-table-column label="Informacje dodatkowe" width="450" label-class-name="order_label">
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
    <el-table-column label="Zamówiono kuriera" width="140" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Zamówiono kuriera</div>
        <div class=" bg-[#e0e8f0]  h-[50px] py-2 px-2 block">
          <el-select
            class="select__element"
            placeholder="Wybierz"
            v-model="filter.SmartTableParam.Search.PredicateObject.IsShipping"
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
    <el-table-column label="Wysłane" width="120" label-class-name="order_label">
      <template #header>
      <div class="header-content">
        <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Wysłane</div>
        <div class=" bg-[#e0e8f0]  h-[50px] py-2 px-2 block">
          <el-select
            class="select__element"
            placeholder="Wybierz"
            v-model="filter.SmartTableParam.Search.PredicateObject.IsShipping"
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
  </el-table>
</div>
</div>
</template>

<style>
.expand-cell {
  background-color: red !important;
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
  max-height: 85vh; /* Maksymalna wysokość tabeli */
  overflow-y: hidden; /* Włącz przewijanie pionowe */
  overflow-x: hidden; /* Opcjonalnie ukryj przewijanie poziome */
  border: 1px solid #d6dfe9; /* Opcjonalnie dodaj obramowanie */
}

.search-row .el-input__wrapper{
  border-radius: 0px 15px 15px 0px !important;
  padding:0px;
}

.custom-status-column {
  background:red;
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