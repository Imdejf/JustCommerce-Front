<script lang="ts" setup>
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
                    <h2>Szanse</h2>
                </span>
            </div>
        </div>
    </div>
  </div>
  <div class="table-container">
    <el-table class="pt-[1px] !bg-[#d6dfe9]" ref="tableData" :row-key="row_key" :data="dataTable.items" :border="true" style="width: 100%;" :cell-style="cellStyle">
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