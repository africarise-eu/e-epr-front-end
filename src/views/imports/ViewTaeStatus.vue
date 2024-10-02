<script setup lang="ts">
import { computed, onMounted, onUpdated, reactive, ref, inject, type Ref } from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { useApi } from '@/composables/useApi';
import { IMPORT, PRODUCT } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type importTaeStatustDto from '@/composables/imports/teaStatus';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { getStatusColor } from '@/composables/status';
import { useSnackbarStore } from '@/stores/snackbar';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import type TAE_Fee from '@/composables/product/TAE_fee';
import { calculateTotalTae } from '@/composables/services/taeCalculations';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';

interface ApiResponse {
  count: number;
  rows: importTaeStatustDto[];
}
const { t } = useI18n();
const router = useRouter();
const taeStatus = ref<importTaeStatustDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showFilterModal = ref(false);
const taeFees = ref<TAE_Fee[]>([]);
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear.toString());

const headers = computed((): DataTableHeader[] => [
  { title: t('import.label.materials'), key: 'materialName' },
  { title: t('import.label.totalWeightKgs'), key: 'totalWeightKgs',align: 'end' },
  { title: t('import.label.importTaeTotal'), key: 'importTaeTotal' },
  { title: t('import.label.taepayStatus', { year: selectedYear.value }), key: 'payStatus', sortable: false }
]);

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

const getAll = async (year: string, limit: number, page: number) => {
  try {
    const { useAPI } = useApi();
    const payload = { year, limit, page };

    const result = await useAPI<any>(IMPORT.GETTEASTATUS, 'GET', null, payload);

    if (result && result.data) {
      taeStatus.value = result.data.rows;
      productCount.value = result.data.count;
      setTaeTotal();
    }
  } catch (error) {
    console.error('Failed to get tae status:', error);
  }
};

const setTaeTotal = () => {
  taeStatus.value.forEach((material: any) => {
    let selectedTaeFee = taeFees.value.filter((x: any) => x.id == material.materialId)[0];
    if (selectedTaeFee) {
      material.importTaeTotal = calculateTotalTae(material.totalWeightGrams, selectedTaeFee.taeFeeMtKg);
      material.totalWeightKgs = material.totalWeightGrams / 1000;
    }
  });
};

const handleSearchFilter = debounce(() => {
  currentPage.value = 1;
  getAll(selectedYear.value, itemsPerPage.value, currentPage.value);
}, 1000);

const handleYearFilter = () => {
  currentPage.value = 1;
  getAll(selectedYear.value, itemsPerPage.value, currentPage.value);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(selectedYear.value, itemsPerPage.value, currentPage.value);
};

const getTAE_Fees = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<Array<TAE_Fee>>(PRODUCT.TAE_FEES, 'GET', {});
  taeFees.value = result.data;
  getAll(selectedYear.value, itemsPerPage.value, currentPage.value);
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('import.head.list'), href: '/imports' },
    { title: t('import.head.taeStatus'), href: '' }
  ]);
  getTAE_Fees();
});
const navigateBack = () => {
  const targetRoute =  '/imports';
  router.push(targetRoute);
};
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('import.head.taeStatus') }}</h3>
      <v-btn class="mt-5 mr-2 text-capitalize" variant="outlined" @click="navigateBack" >{{ $t('common.back') }}</v-btn>
   
    </div>
    <div class="d-flex justify-start align-start">
      <v-select
        v-model="selectedYear"
        density="compact"
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
        <v-data-table :headers="headers" :items="taeStatus" item-key="id" hide-default-footer>
          <template v-slot:item.materialName="{ item }">
              {{ t(`common.packagingMaterial.${item.materialName}`) }}
          </template>
          <!-- action column -->
          <template v-slot:item.payStatus="{ item }">
            <span class="text-capitalize" :style="{ color: getStatusColor(item.payStatus) }">
              {{ item.payStatus }}
            </span>
          </template>
          <template v-slot:item.totalWeightKgs="{ item }">
            {{ formatNumberWithCommas(item.totalWeightKgs) }}
          </template>
          <template v-slot:item.importTaeTotal="{ item }">
            {{ formatNumberWithCommas(item.importTaeTotal) }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-pagination
    v-if="productCount > itemsPerPage"
      v-model="currentPage "
      :length="Math.ceil(productCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
</template>
<style lang="scss" scoped>
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
