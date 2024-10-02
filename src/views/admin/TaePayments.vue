<script setup lang="ts">
import { onMounted, ref, computed, inject} from 'vue';
import { useApi } from '@/composables/useApi';
import { ADMIN } from '@/composables/apiEndpoints';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import type taePaymentDto from '@/composables/admin/taePayment';
import { DefaultTheme } from '@/theme/LightTheme';
import { debounce } from 'lodash';
import {formatDate} from '@/utils/date/dateFormat';
import {getStatusColor, STATUSENUM} from '@/composables/status';
import { useI18n } from 'vue-i18n';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

interface ApiResponse {
  count: number;
  rows: taePaymentDto[];
}

const {t} = useI18n();
const taePayments = ref<taePaymentDto[]>([]);
const paymentsCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(25);
const search = ref('');

const headers = computed((): DataTableHeader[] => [
  { title: t('admin.label.company'), key: 'companyName' },
  { title: t('admin.label.paymentType'), key: 'paymentType' },
  { title: t('admin.label.taeValue'), align: 'center', key: 'total_value' },
  { title: t('admin.label.dueDate'), key: 'createdAt' },  
  { title: t('admin.label.paymentStatus'), key: 'status' }
]);

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear.toString());

// Define the range of years
const startYear = currentYear - 10;
const endYear = currentYear + 5;

const years = computed(() => {
  const yearsArray = [];
  for (let year = startYear; year <= endYear; year++) {
    yearsArray.push(year.toString());
  }
  return yearsArray;
});

 const getTaePayments = async (search:string, year:string, limit:number, page:number) => {
  const { useAPI } = useApi();
  const payload = { search, year, limit, page };
  const result = await useAPI<ApiResponse>(ADMIN.TAE_PAYMENT, 'GET', null, payload);
  if(!result.error)
  {
    taePayments.value = result.data.rows;
    paymentsCount.value = result.data.count;
  }
  else{
    console.log("Error on fetching tae fees");
  }
};

const handleSearchFilter = debounce(() => {
  currentPage.value = 1;
   getTaePayments(search.value, selectedYear.value, itemsPerPage.value, currentPage.value);
}, 1000);


const handlePageChange = (page: number) => {
  currentPage.value = page;
  getTaePayments(search.value, selectedYear.value, itemsPerPage.value, currentPage.value);
};
const handleYearFilter = () => {
  currentPage.value = 1;
  getTaePayments(search.value, selectedYear.value, itemsPerPage.value, currentPage.value);
};

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {   
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('taePayments.head.taePayments'), href: '' },
    ]); 
  getTaePayments(search.value, selectedYear.value, itemsPerPage.value, currentPage.value);
});
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6 ">
      <h3 class="text-h3 text-center mb-0">{{$t('taePayments.head.taePayments')}}</h3>
    </div>
      <div class="d-flex justify-start align-start">
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('compensationRequest.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
        <v-select
            v-model="selectedYear"
            density="compact"
            class="ml-2"
            max-width="200px"
            variant="outlined"
            color="primary"
            :label="$t('import.label.year')"
            :items="years"
            @update:modelValue="handleYearFilter"
        ></v-select>
    </div>
    <v-card class="pt-1">
   <v-card-text> 
         <v-data-table :headers="headers" :items="taePayments"  item-key="companyId" hide-default-footer>
           <template v-slot:item.createdAt="{ item }">
                              {{  formatDate(new Date(new Date(item.createdAt).setDate(new Date(item.createdAt).getDate() + 1))) }}
                              
          </template>
          <template v-slot:item.total_value="{ item }">
                              {{ item.total_value.toFixed(2) }}
          </template>
          <template v-slot:item.status="{ item }">
              <span class="d-flex text-capitalize" :style="{ color: getStatusColor(STATUSENUM.PAID ) }">
                              {{ STATUSENUM.PAID }}
              </span>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
       <!-- <v-pagination
      v-if="paymentsCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(paymentsCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination> -->
  </v-container>
</template>
<style lang="scss" scoped>
</style>
