<script setup lang="ts">
import { computed, onMounted, onUpdated, reactive, ref, type Ref } from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { useApi } from '@/composables/useApi';
import { IMPORT, PRODUCT, PRODUCTION } from '@/composables/apiEndpoints';
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
import { formatNumberWithCommas } from '@/utils/commonMethods';

interface ApiResponse {
  count: number;
  rows: importTaeStatustDto[];
}
interface ProductionWeightTae {
  materialName: string;
  planWeight: number;
  taeStatus: string;
  actualWeight: number;
  taePayStatus: string;
}
interface ProductionTaePay {
  materialName: string;
  planTae: number;
  taeStatus: string;
  actualTae: number;
  taePayStatus: string;
}
const taeStatus = ref<ProductionTaePay[]>([]);
const taeStatusByWeight = ref<ProductionWeightTae[]>([]);

const currentPage = ref(1);
const taeFees = ref<TAE_Fee[]>([]);

const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear.toString());

// Define the range of years
const startYear = currentYear - 10;
const endYear = currentYear + 1;
const router = useRouter();
const { t } = useI18n();
const years = computed(() => {
  const yearsArray = [];
  for (let year = startYear; year <= endYear; year++) {
    yearsArray.push(year.toString());
  }
  return yearsArray;
});
const weightHeaders = computed<DataTableHeader[]>(() => [
  { title: t('production.meterialTable.meterialKG'), key: 'materialName' },
  { title: t('production.meterialTable.plan', { year: selectedYear.value }),align: 'end', key: 'planWeight' },
  { title: t('production.meterialTable.taeStatus', { year: selectedYear.value }), key: 'taeStatus', sortable: false },
  { title: t('production.meterialTable.actual', { year: Number(selectedYear.value) - 1 }),align: 'end', key: 'actualWeight' },
  { title: t('production.meterialTable.taePayStatus', { year: Number(selectedYear.value) - 1 }), key: 'taePayStatus', sortable: false }
]);
const mtHeaders = computed<DataTableHeader[]>(() => [
  { title: t('production.meterialTable.meterialMT'), key: 'materialName' },
  { title: t('production.meterialTable.planTae', { year: selectedYear.value }), key: 'planTae' },
  { title: t('production.meterialTable.taeStatus', { year: selectedYear.value }), key: 'taeStatus', sortable: false },
  { title: t('production.meterialTable.actualTae', { year: Number(selectedYear.value) - 1 }), key: 'actualTae' },
  { title: t('production.meterialTable.taePayStatus', { year: Number(selectedYear.value) - 1 }), key: 'taePayStatus', sortable: false }
]);

const isApprovedProduct = (item: any) => {
  return item.status === 'approved';
};

const getAll = async (year: string) => {
  try {
    const { useAPI } = useApi();

    const result = await useAPI<any>(PRODUCTION.LIST_PRODUCTION + `/${year}`, 'GET');

    if (result && result.data) {
      //   taeStatus.value = result.data;
      //   productCount.value = 5;//result.data.count;
      //  setTaeTotal()
      taeStatusByWeight.value = result.data.productionMaterial.map((production: any) => {
        return {
          id: production.id,
          materialName: production.materials.material,
          planWeight: production.plan / 1000,
          taeStatus: production.taeStatus,
          actualWeight: production.actual / 1000,
          taePayStatus: production.taePayStatus
        };
      });
      taeStatus.value = result.data.productionMaterial.map((production: any) => {
        return {
          id: production.id,
          materialName: production.materials.material,
          planTae: calculateTotalTae(production.plan, production.materials.taeFeeMtKg),
          taeStatus: production.taeStatus,
          actualTae: calculateTotalTae(production.actual, production.materials.taeFeeMtKg),
          taePayStatus: production.taePayStatus
        };
      });
    } else {
      taeStatusByWeight.value = [];
      taeStatus.value = [];
    }
  } catch (error) {
    console.error('Failed to get tae status:', error);
  }
};

const handleYearFilter = async () => {
  await getAll(selectedYear.value);
  const weightHeaders = ref<DataTableHeader[]>([
    { title: t('production.meterialTable.meterialKG'), key: 'materialName' },
    { title: t('production.meterialTable.plan', { year: selectedYear.value }), key: 'planWeight' },
    { title: t('production.meterialTable.taeStatus'), key: 'taeStatus', sortable: false },
    { title: t('production.meterialTable.actual', { year: Number(selectedYear.value) - 1 }), key: 'actualWeight' },
    { title: t('production.meterialTable.taePayStatus'), key: 'taePayStatus', sortable: false }
  ]);

  const mtHeaders = ref<DataTableHeader[]>([
    { title: t('production.meterialTable.meterialMT'), key: 'materialName' },
    { title: t('production.meterialTable.planTae', { year: selectedYear.value }), key: 'planTae' },
    { title: t('production.meterialTable.taeStatus'), key: 'taeStatus', sortable: false },
    { title: t('production.meterialTable.actualTae', { year: Number(selectedYear.value) - 1 }), key: 'actualTae' },
    { title: t('production.meterialTable.taePayStatus'), key: 'taePayStatus', sortable: false }
  ]);
};

const getTAE_Fees = async () => {
  getAll(selectedYear.value);
};

const isCurrentYear = () => {
  return selectedYear.value === currentYear.toString();
};

const addProduction = () => {
  router.push({ name: 'AddProductionPlan' });
};

onMounted(() => {
  getTAE_Fees();
});
</script>

<template>
  <v-container class="">
    <div class="d-sm-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-start mb-0 mt-2">{{ $t('production.head.taeStatus') }}</h3>
      <v-btn class="mt-2 mt-sm-0 mr-2 text-capitalize" color="primary" :to="{ name: 'ProductionPlan' }">{{
        $t('production.button.viewProductionUnits')
      }}</v-btn>
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
    <div v-if="taeStatusByWeight && taeStatusByWeight.length > 0">
      <div class="d-flex justify-space-between align-center mb-6">
        <h4 class="text-h4 text-center mb-0">{{ $t('production.head.taeWeight') }}</h4>
      </div>
      <div class="mb-3">
        <v-card class="pt-1">
          <v-card-text>
            <v-data-table :headers="weightHeaders" :items="taeStatusByWeight" item-key="id" hide-default-footer>
              <template v-slot:item.materialName="{ item }">
              {{ t(`common.packagingMaterial.${item.materialName}`) }}
            </template>
              <!-- action column -->
              <template v-slot:item.taePayStatus="{ item }">
                <span class="text-capitalize" :style="{ color: getStatusColor(item.taePayStatus) }">
                  {{ item.taePayStatus }}
                </span>
              </template>
              <template v-slot:item.taeStatus="{ item }">
                <span class="text-capitalize" :style="{ color: getStatusColor(item.taeStatus) }">
                    {{ t(`status.${item.taeStatus}`) }}
                </span>
              </template>
              <template v-slot:item.planWeight="{ item }">
                {{ formatNumberWithCommas(item.planWeight) }}
              </template>
              <template v-slot:item.actualWeight="{ item }">
                {{ formatNumberWithCommas(item.actualWeight) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </div>
      <div class="d-flex justify-space-between align-center mb-6 mt-10">
        <h4 class="text-h4 text-center mb-0">{{ $t('production.head.taeMt') }}</h4>
      </div>
      <div>
        <v-card class="pt-1">
          <v-card-text>
            <v-data-table :headers="mtHeaders" :items="taeStatus" item-key="id" hide-default-footer>
              <template v-slot:item.materialName="{ item }">
              {{ t(`common.packagingMaterial.${item.materialName}`) }}
            </template>
              <!-- action column -->
              <template v-slot:item.taePayStatus="{ item }">
                <span class="text-capitalize" :style="{ color: getStatusColor(item.taePayStatus) }">
                  {{ item.taePayStatus }}
                </span>
              </template>
              <template v-slot:item.taeStatus="{ item }">
                <span class="text-capitalize" :style="{ color: getStatusColor(item.taeStatus) }">
                 {{ t(`status.${item.taeStatus}`) }}
                </span>
              </template>
              <template v-slot:item.planTae="{ item }">
                {{ formatNumberWithCommas(item.planTae) }}
              </template>
              <template v-slot:item.actualTae="{ item }">
                {{ formatNumberWithCommas(item.actualTae) }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </div>
    </div>
    <v-card class="d-flex align-center flex-column pa-10" v-else>
      <div class="text-bold text-center">{{ $t('production.other.noProductionAdded') }}</div>
      <v-btn v-if="isCurrentYear()" color="primary" size="large" class="mt-4" @click="addProduction">Add Production</v-btn>
    </v-card>
  </v-container>
</template>
<style lang="scss" scoped>
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
