<script setup lang="ts">
import { computed, onMounted, onUpdated, reactive, ref, inject, type Ref } from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { useApi } from '@/composables/useApi';
import { COMPANY, COMPENSATION, PRODUCT } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type compensationDto from '@/composables/compensation/compensation';
import { mapApiResponseToCompensationDto } from '@/composables/compensation/compensation';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import type TAE_Fee from '@/composables/product/TAE_fee';
import { calculateTotalTae } from '@/composables/services/taeCalculations';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';
import type { CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';

const { t } = useI18n();
interface ApiResponse {
  count: number;
  rows: compensationDto[];
}
const router = useRouter();
const compensations = ref<compensationDto[]>([]);
const compensationCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showFilterModal = ref(false);
const taeFees = ref<TAE_Fee[]>([]);

const fetchCompanyProfile = async (value: number) => {
  const { useAPI } = useApi();
  try {
    const result = await useAPI<CompanyProfileResponseProps>(COMPANY.COMPANY_PROFILE, 'GET');
    return result.data; // Return the data if available
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
};

const isCompanyProfile = ref(false);
const isCompanyVerified = ref(true);
const user = JSON.parse(localStorage.getItem('user')!);
const companiData = await fetchCompanyProfile(user.companyId);
const companyStatus = ref(companiData?.status ?? '');
if (companyStatus.value === undefined || companyStatus.value === null || companyStatus.value === '' || companyStatus.value === STATUSENUM.REJECTED) {
  isCompanyVerified.value = false;
}
isCompanyProfile.value = user.isProfileExist;

const headers = computed((): DataTableHeader[] => [
  { title: t('compensationRequest.tableHeader.material'), key: 'material' },
  { title: t('compensationRequest.tableHeader.requestedCompensationKgs'), key: 'requestedCompensationKgs',align: 'end' },
  { title: t('compensationRequest.tableHeader.compensationStatus'), key: 'compensationStatus' },
  { title: t('compensationRequest.tableHeader.actualTotalKgs'), key: 'actualTotalKgs',align: 'end' },
  { title: t('compensationRequest.tableHeader.actualTotalTae'), key: 'actualTotalTae' },
  { title: t('compensationRequest.tableHeader.actualTotalTaePaid'), key: 'actualTotalTaePaid' },
  { title: t('compensationRequest.tableHeader.compensationViable'), key: 'compensationViable' },
  { title: t('compensationRequest.tableHeader.repaymentStatus'), key: 'repaymentStatus', sortable: false }
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

const getAll = async (year: string, limit: number, page: number) => {
  try {
    const { useAPI } = useApi();
    const payload = { year, limit, page };

    const result = await useAPI<any>(COMPENSATION.GET_COMPENSATION, 'GET', null, payload);

    if (result && result.data) {
      compensations.value = result.data.rows.map(mapApiResponseToCompensationDto);
      compensationCount.value = result.data.count;
      setTaeTotal();
    }
  } catch (error) {
    console.error('Failed to get tae status:', error);
  }
};

const setTaeTotal = () => {
  compensations.value.forEach((comp: compensationDto) => {
    let selectedTaeFee = taeFees.value.filter((x: any) => x.id == comp.materialId)[0];
    if (selectedTaeFee) {
      const totalWeightGrms = comp.actualTotalKgs * 1000;
      comp.actualTotalTae = calculateTotalTae(totalWeightGrms, selectedTaeFee.taeFeeMtKg);
      comp.actualTotalTaePaid = comp.actualTotalTae; // to do after payment, for now assume paid

      const totalWeightGrmsForRequested = comp.requestedCompensationKgs * 1000;
      comp.compensationViable = '0'; // to do after payment, for now assume paid
    }
  });
};

const handleSearchFilter = debounce(() => {
  getAll(selectedYear.value, itemsPerPage.value, currentPage.value);
}, 1000);

const handleYearFilter = () => {
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

const totalRequestedCompensationKgs = computed(() => {
  return compensations.value.reduce((sum, item) => {
    const weight = Number(item.requestedCompensationKgs) || 0; // Convert to number and treat null or NaN as 0
    const result = sum + weight;
    return parseFloat(result.toFixed(2));
  }, 0);
});

const actualTotalKgs = computed(() => {
  return compensations.value.reduce((sum, item) => {
    const weight = Number(item.actualTotalKgs) || 0; // Convert to number and treat null or NaN as 0
    const result = sum + weight;
    return parseFloat(result.toFixed(2));
  }, 0);
});

const actualTotalTae = computed(() => {
  return compensations.value.reduce((sum, item) => {
    const weight = Number(item.actualTotalTae) || 0; // Convert to number and treat null or NaN as 0
    const result = sum + weight;
    return parseFloat(result.toFixed(2));
  }, 0);
});

const actualTotalTaePaid = computed(() => {
  return compensations.value.reduce((sum, item) => {
    const weight = Number(item.actualTotalTaePaid) || 0; // Convert to number and treat null or NaN as 0
    const result = sum + weight;
    return parseFloat(result.toFixed(2));
  }, 0);
});
const createCompany = async () => {
  router.push({ name: 'AddCompanyProfile' });
};
const compensationViableTotal = computed(() => {
  return compensations.value.reduce((sum, item) => {
    const weight = Number(item.compensationViable) || 0; // Convert to number and treat null or NaN as 0
    const result = sum + weight;
    return parseFloat(result.toFixed(2));
  }, 0);
});

const repaymentTotal = computed(() => {
  return '';
});

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('compensationRequest.head.compensation'), href: '' }
  ]);
  getTAE_Fees();
});
</script>

<template>
  <v-container class="">
    <div v-if="isCompanyVerified">
      <div class="d-flex justify-space-between align-center mb-6">
        <h3 class="text-h3 text-center mb-0">{{ $t('compensationRequest.head.compensation') }}</h3>
        <v-btn class="mt-5 mr-2 text-capitalize" color="primary" :to="{ name: 'CompensationList' }">{{
          $t('compensationRequest.button.compensationRequest')
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
      <v-card class="pt-1">
        <v-card-text>
          <v-data-table :headers="headers" :items="compensations" item-key="id" hide-default-footer>
            <template v-slot:item.material="{ item }">
              {{ t(`common.packagingMaterial.${item.material}`) }}
          </template>
            <!-- action column -->
            <template v-slot:item.repaymentStatus="{ item }">
              <span class="text-capitalize" :style="{ color: getStatusColor(item.repaymentStatus.toString()) }">
                {{ item.repaymentStatus }}
              </span>
            </template>
            <template v-slot:item.compensationStatus="{ item }">
              <span class="text-capitalize" :style="{ color: getStatusColor(item.compensationStatus.toString()) }">
                {{ t(`status.${item.compensationStatus}`) }}

              </span>
            </template>

            <template v-if="compensations.length > 0" v-slot:body.append>
              <tr>
                <td class="text-left font-weight-black" style="background: rgba(0, 0, 0, 0.025)">{{t('packingMaterial.table.total')}}</td>
                <td class="text-right font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ formatNumberWithCommas(totalRequestedCompensationKgs) }}</td>
                <td style="background: rgba(0, 0, 0, 0.025)"></td>
                <td class="text-right font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ formatNumberWithCommas(actualTotalKgs) }}</td>
                <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ formatNumberWithCommas(actualTotalTae) }}</td>
                <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ formatNumberWithCommas(actualTotalTaePaid) }}</td>
                <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ compensationViableTotal }}</td>
                <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ repaymentTotal }}</td>

                <!-- Add other summary cells as needed -->
              </tr>
            </template>
            <template v-slot:item.requestedCompensationKgs="{ item }">
              {{ formatNumberWithCommas(item.requestedCompensationKgs) }}
            </template>
            <template v-slot:item.actualTotalKgs="{ item }">
              {{ formatNumberWithCommas(item.actualTotalKgs) }}
            </template>
            <template v-slot:item.actualTotalTae="{ item }">
              {{ formatNumberWithCommas(item.actualTotalTae) }}
            </template>
            <template v-slot:item.actualTotalTaePaid="{ item }">
              {{ formatNumberWithCommas(item.actualTotalTaePaid) }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
      <v-pagination
       v-if="compensationCount > itemsPerPage"
        v-model="currentPage"
        :length="Math.ceil(compensationCount / itemsPerPage)"
        @update:model-value="handlePageChange"
        class="mt-4"
      ></v-pagination>
    </div>
    <div v-else>
      <div v-if="!isCompanyProfile">
        <NoProfileCreateCompany
          :description="$t('company.other.noCompanyDetails')"
          :submitButtonText="$t('company.button.createCompany')"
          @submit="createCompany"
        ></NoProfileCreateCompany>
      </div>
      <div v-else>
        <h3 class="text-h3 text-center mb-0">{{ $t('compensationRequest.head.compensation') }}</h3>
        <v-card class="pt-1">
          <v-list-item-title class="text-center py-8">{{ $t('compensationRequest.other.notVerified') }}</v-list-item-title>
        </v-card>
      </div>
    </div>
  </v-container>
</template>
<style lang="scss" scoped>
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
