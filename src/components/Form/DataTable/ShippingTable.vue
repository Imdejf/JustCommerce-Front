<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref, computed, defineProps } from 'vue'
import { Api } from '/@/services/api'
import { useToast } from 'vue-toastification'
import Cookies from 'universal-cookie'


const router = useRouter()
const toast = useToast()
const cookies = new Cookies()

const dataTable = ref([])
const selectedRow = ref(null);
const selectedRowId = ref(null)
const storeId = cookies.get('dsStore')
const brands = ref([])
const producer = ref(null)

const filter = ref({
  StoreId: cookies.get('dsStore'),
  SmartTableParam: {
    Search: {
      PredicateObject: {
      }
    }
  }
})

const updateDateOrderedFromManufacturer = async (row) => {
  try {
    if(row.itemOrderedFromManufacturerDate !== null) {
      row.itemOrderedFromManufacturer = true
    }
    else {
      row.itemOrderedFromManufacturer = false
    }

    const currentStatus = {
      productId: row.productId,
      orderId: row.orderId,
      itemOrderedFromManufacturerDate: row.itemOrderedFromManufacturerDate
    }

    const payload = {
      body: JSON.stringify(currentStatus)
    }    
   await Api.shipping.changeManufacturerOrderedDate(payload)
    toast.success("Zaktualizowano datę zamówienia u producenta");
  } catch (error) {
    console.error("Błąd podczas aktualizacji:", error);
    toast.error("Nie udało się zaktualizować daty");
  }
};

const updateDateOrderedCourier = async (row) => {
  try {
    if(row.orderedCourierDate !== null) {
      row.orderedCourier = true
    }
    else {
      row.orderedCourier = false
    }

    const currentStatus = {
      productId: row.productId,
      orderId: row.orderId,
      orderedCourierDate: row.orderedCourierDate
    }

    const payload = {
      body: JSON.stringify(currentStatus)
    }    
   await Api.shipping.changeOrderedCourier(payload)
    
    toast.success("Zaktualizowano datę zamówienia kuriera");
  } catch (error) {
    console.error("Błąd podczas aktualizacji:", error);
    toast.error("Nie udało się zaktualizować daty");
  }
};

const updateDateShipped = async (row) => {
  try {
    if(row.itemShipedDate !== null) {
      row.itemShiped = true
    }
    else {
      row.itemShiped = false
    }

    const currentStatus = {
      productId: row.productId,
      orderId: row.orderId,
      itemShipedDate: row.itemShipedDate
    }

    const payload = {
      body: JSON.stringify(currentStatus)
    }    

    await Api.shipping.changeShippingOrderState(payload)
   
    toast.success("Zaktualizowano datę wysyłki");
  } catch (error) {
    console.error("Błąd podczas aktualizacji:", error);
    toast.error("Nie udało się zaktualizować daty");
  }
};


const checkIfAllOrdered = (row) => {
  return row.orderProcessedItems.every(item => item.itemOrderedFromManufacturer);
};

const checkIfAllCourierOrdered = (row) => {
  return row.orderProcessedItems.every(item => item.orderedCourier);
};

const checkIfAllProductShipped = (row) => {
  return row.orderProcessedItems.every(item => item.itemShiped);
};

const fetchTableData = async () => {
  try {
    const payload = {
      body: JSON.stringify(filter.value),
    };

    const result = await Api.shipping.getAllOrderShippingNotProcessed(payload);

    dataTable.value = result.data;

    console.log(dataTable.value)
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

const cellStyle = ({ row, column }) => {
  if (column.type === "expand") {

    // Sprawdzamy, czy wszystkie produkty są zamówione u producenta
    const allOrdered = row.orderProcessedItems.every(item => item.itemOrderedFromManufacturer === true);

    // Jeśli chociaż jeden ma `false`, ustawiamy ciemnoczerwone tło
    if (!allOrdered) {
      return { backgroundColor: "#FF6600" }; // Ciemnoczerwony
    }

    // Jeśli wszystkie są `true`, ustawiamy jasnozielone tło
    return { backgroundColor: "#4ade80" }; // Jasnozielony
  }

  return {};
};

const styleProductTable = ({ row, column }) => {
    if (!row.itemOrderedFromManufacturer) {
      return { backgroundColor: "#FF6600" }; // Ciemnoczerwony
    }

    // Jeśli wszystkie są `true`, ustawiamy jasnozielone tło
    return { backgroundColor: "#4ade80" }; // Jasnozielony

  return {};
};

function row_key(row) {
     return row.sortId
}

const generateOrderForManufacturerHandle = async () => {

  const object = {
    brandId: producer.value,
    storeId: cookies.get('dsStore')
  };

  const payload = {
    body: JSON.stringify(object),
  };

  const result = await Api.shipping.generateOrderToManufacturer(payload);
};

const refreshTable = async () => {
  try {
    await fetchTableData()
  } catch (error) {
    console.error(error)
  }
}


const allBrands = async () => {
  try {
    const result = await Api.brands.listByStoreId()
    brands.value = [
      { value: null, label: 'Producent' },
      ...result.items.map((item) => ({
        value: item.id,
        label: item.name
      }))
    ]
  } catch (error) {
    console.error('Błąd podczas pobierania producentów:', error)
  }
}

onMounted(async () => {
  try {
    await allBrands()
    await fetchTableData()
  } catch (error) {
    console.error(error)
  }
})
</script>
<template>
  <div class="p-3 h-[88vh]">
    <div class="bg-[#f1f4f9] p-2  border-t-[3px] border-[#64748b] rounded-t-xl">
    <div class="flex justify-between">
      <div class="flex">
      <span class="flex hover:bg-sky-100 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="m-auto text-blue-400" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5.53 17.506q-.978-1.142-1.504-2.558T3.5 12q0-3.616 2.664-6.058T12.5 3.5V2l3.673 2.75L12.5 7.5V6Q9.86 6 7.93 7.718T6 12q0 1.13.399 2.15t1.13 1.846zM11.5 22l-3.673-2.75L11.5 16.5V18q2.64 0 4.57-1.718T18 12q0-1.13-.399-2.16q-.399-1.028-1.13-1.855l1.998-1.51q.979 1.142 1.505 2.558T20.5 12q0 3.616-2.664 6.058T11.5 20.5z"/></svg>
        <button @click="openOutlook" class=" rounded-md p-1 text-xs font-semibold">Odśwież</button>
      </span>
    </div>
    <div class="flex gap-3 items-center producer_section">
      <FormKit
      type="select"
      name="producer"
      v-model="producer"
      :options="brands"
      input-class="!text-xs !h-10 !w-[180px]"
      />
        <span class="flex hover:bg-sky-100 p-1 !h-[40px]">
          <svg xmlns="http://www.w3.org/2000/svg" class="m-auto text-blue-400" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5.53 17.506q-.978-1.142-1.504-2.558T3.5 12q0-3.616 2.664-6.058T12.5 3.5V2l3.673 2.75L12.5 7.5V6Q9.86 6 7.93 7.718T6 12q0 1.13.399 2.15t1.13 1.846zM11.5 22l-3.673-2.75L11.5 16.5V18q2.64 0 4.57-1.718T18 12q0-1.13-.399-2.16q-.399-1.028-1.13-1.855l1.998-1.51q.979 1.142 1.505 2.558T20.5 12q0 3.616-2.664 6.058T11.5 20.5z"/></svg>
          <button @click="generateOrderForManufacturerHandle" class=" rounded-md p-1 text-xs font-semibold">Generuj zam. towarów</button>
        </span>
    </div>
    </div>
  </div>
  <div class="table-container">
  <el-table class="pt-[1px] !bg-[#d6dfe9]" ref="tableData" :row-key="row_key" :data="dataTable.items" :border="true" style="width: 100%; min-height: 87vh;" @expand-change="test" :cell-style="cellStyle">
    <el-table-column type="expand">
      <template #default="props">
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
          <div class="table__product m-auto w-[90%] py-4 px-8">
            <el-table :data="props.row.orderProcessedItems" :border="true" :cell-style="styleProductTable" >
              <el-table-column label="Zdjęcie" width="120">
                <template #default="prop"
                  ><a :href="'https://olmag.pl/' + prop.row.slug" target="_blank">
                    <img
                      :src="prop.row.photo"
                      class="object-contain w-[40px] h-[40px] m-auto"
                    />
                  </a>
                </template>
              </el-table-column>
              <el-table-column label="Nazwa produktu" prop="name">
                <template #default="prop"
                  ><a :href="'https://olmag.pl/' + prop.row.slug" target="_blank">{{
                    prop.row.name
                  }}</a></template
                >
              </el-table-column>
              <el-table-column label="Ilość" width="70" prop="quantity" />
              <el-table-column label="Kod" width="140" prop="productCode" />
              <el-table-column label="Data zamówienia u producenta" width="200" prop="itemOrderedFromManufacturerDate" class="p-5">
                <template #default="scope">
                  <el-date-picker
                    v-model="scope.row.itemOrderedFromManufacturerDate"
                    type="date"
                    placeholder="Wybierz datę"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 150px !important;"
                    @change="updateDateOrderedFromManufacturer(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="Data zamówienia kuriera" width="200" prop="orderedCourierDate" class="p-5">
                <template #default="scope">
                  <el-date-picker
                    v-model="scope.row.orderedCourierDate"
                    type="date"
                    placeholder="Wybierz datę"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 150px !important;"
                    @change="updateDateOrderedCourier(scope.row)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="Data wysłania zamówienia" width="200" prop="itemShipedDate" class="p-5">
                <template #default="scope">
                  <el-date-picker
                    v-model="scope.row.itemShipedDate"
                    type="date"
                    placeholder="Wybierz datę"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 150px !important;"
                    @change="updateDateShipped(scope.row)"
                  />
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
    <!-- <el-table-column label="Dane klienta" prop="billingData" label-class-name="order_label">
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
    </el-table-column> -->
    <el-table-column label="Adres wysyłki" width="300" prop="" label-class-name="order_label">
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
    <el-table-column label="Informacje dodatkowe"  label-class-name="order_label">
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
    <el-table-column label="Zamówiono u producenta" width="180" label-class-name="order_label">
  <template #header>
    <div class="header-content">
      <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Zamówiono u producenta</div>
      <div class="bg-[#e0e8f0] h-[50px] py-2 px-2 block">
        <el-select class="select__element" placeholder="Wybierz">
          <el-option label="Tak" :value="true"></el-option>
          <el-option label="Nie" :value="false"></el-option>
        </el-select>
      </div>
    </div>
  </template>
  <template #default="{ row }">
    <el-select
      :model-value="checkIfAllOrdered(row) ? true : false"
      placeholder="Wybierz"
      class="non-clickable-select"
      :class="checkIfAllOrdered(row) ? 'select-green' : 'select-red'"
    >
      <el-option label="Tak" :value="true"></el-option>
      <el-option label="Nie" :value="false"></el-option>
    </el-select>
  </template>
</el-table-column>
    <el-table-column label="Zamówiono kuriera" width="180" label-class-name="order_label">
      <template #header>
          <div class="header-content">
            <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Zamówiono kuriera</div>
            <div class="bg-[#e0e8f0] h-[50px] py-2 px-2 block">
            <el-select class="select__element" placeholder="Wybierz">
              <el-option label="Tak" :value="true"></el-option>
              <el-option label="Nie" :value="false"></el-option>
            </el-select>
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <el-select
          :model-value="checkIfAllCourierOrdered(row) ? true : false"
          placeholder="Wybierz"
          class="non-clickable-select"
          :class="checkIfAllCourierOrdered(row) ? 'select-green' : 'select-red'"
        >
          <el-option label="Tak" :value="true"></el-option>
          <el-option label="Nie" :value="false"></el-option>
        </el-select>
      </template>
    </el-table-column>
    <el-table-column label="Wysłane" width="180" label-class-name="order_label">
      <template #header>
        <div class="header-content">
          <div class="p-2 text-[13px] shadow-xs border-b-[1px] border-[#d6dfe9] h-[60px] content-center">Wysłane</div>
          <div class="bg-[#e0e8f0] h-[50px] py-2 px-2 block">
            <el-select class="select__element" placeholder="Wybierz">
              <el-option label="Tak" :value="true"></el-option>
              <el-option label="Nie" :value="false"></el-option>
            </el-select>
          </div>
        </div>
      </template>
      <template #default="{ row }">
        <el-select
          :model-value="checkIfAllProductShipped(row) ? true : false"
          placeholder="Wybierz"
          class="non-clickable-select"
          :class="checkIfAllProductShipped(row) ? 'select-green' : 'select-red'"
        >
          <el-option label="Tak" :value="true"></el-option>
          <el-option label="Nie" :value="false"></el-option>
        </el-select>
      </template>
    </el-table-column>
  </el-table>
</div>
</div>
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
  /* max-height: 85vh;  */
  overflow-y: hidden; /* Włącz przewijanie pionowe */
  overflow-x: hidden; /* Opcjonalnie ukryj przewijanie poziome */
  border: 1px solid #d6dfe9; /* Opcjonalnie dodaj obramowanie */
}

.search-row .el-input__wrapper{
  border-radius: 0px 15px 15px 0px !important;
  padding:0px;
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
