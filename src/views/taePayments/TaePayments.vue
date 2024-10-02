<script setup lang="ts">
import { onMounted, ref, computed, inject } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, TAEPAYMENT } from '@/composables/apiEndpoints';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import type taePaymentDto from '@/composables/verifier/taePayments';
import { DefaultTheme } from '@/theme/LightTheme';
import { debounce } from 'lodash';
import { useI18n } from 'vue-i18n';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { formatDate } from '@/utils/date/dateFormat';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import { MailOutlined } from '@ant-design/icons-vue';
import type { CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
import { router } from '@/router';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';

const { t } = useI18n();
const taePayments = ref<taePaymentDto[]>([]);
const paymentsCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedCompany = ref<number>();

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

const headers: DataTableHeader[] = [
  { title: t('verifier.taePayments.companyName'), key: 'companyName' },
  { title: t('verifier.taePayments.paymentType'), key: 'paymentType' },
  { title: t('verifier.taePayments.createdAt'), key: 'createdAt' },
  { title: t('verifier.taePayments.total_value'), key: 'total_value' },
  { title: t('verifier.taePayments.paystatus'), key: 'payStatus' }
];

const getTaePayments = async (companyId: number, limit: number, page: number) => {
  const { useAPI } = useApi();
  const payload = { companyId, limit, page };
  const result = await useAPI<Array<taePaymentDto>>(TAEPAYMENT.GET, 'GET', null, payload);
  if (!result.error) {
    taePayments.value = result.data;
  } else {
    console.log('Error on fetching tae fees');
  }
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await getTaePayments(selectedCompany.value ?? 0, itemsPerPage.value, currentPage.value);
};

const totalTaeValue = computed(() => {
  return taePayments.value.reduce((sum, item) => {
    const weight = Number(item.total_value) || 0; // Convert to number and treat null or NaN as 0
    
    if (item.paymentType === 'compensation') {
      sum -= weight; // Subtract if paymentType is compensation
    } else {
      sum += weight; // Add if it's not compensation
    }

    return parseFloat(sum.toFixed(2)); // Ensure precision after each operation
  }, 0);
});
const createCompany = async () => {
  router.push({ name: 'AddCompanyProfile' });
};
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('taePayments.head.taePayments'), href: '' }
  ]);
  const roleNameSelection = localStorage.getItem('user');
  if (roleNameSelection) {
    try {
      const user = JSON.parse(roleNameSelection);
      selectedCompany.value = user.companyId;
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
  await getTaePayments(selectedCompany.value ?? 0, itemsPerPage.value, currentPage.value);
});
</script>

<template>
  <v-container class="">
    <div v-if="isCompanyVerified">
      <div class="d-flex justify-space-between align-center mb-6">
        <h3 class="text-h3 text-center mb-0">{{ $t('taePayments.head.taePayments') }}</h3>
      </div>
      <v-card class="pt-1">
        <v-card-text v-if="selectedCompany">
          <v-data-table :headers="headers" :items="taePayments" hide-default-footer>
            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(new Date(item.createdAt)) }}
            </template>
            <template v-slot:item.payStatus="{ item }">
              <span class="text-capitalize" :style="{ color: getStatusColor(item.payStatus) }">
                {{ item.payStatus }}
              </span>
            </template>
            <template v-slot:item.total_value="{ item }">
              {{ formatNumberWithCommas(parseFloat(item.total_value.toFixed(2))) }}
            </template>
            <template v-if="taePayments.length > 0" v-slot:body.append>
              <tr>
                <td class="text-left font-weight-black" style="background: rgba(0, 0, 0, 0.025)">{{t('packingMaterial.table.total')}}</td>
                <td style="background: rgba(0, 0, 0, 0.025)"></td>
                <td style="background: rgba(0, 0, 0, 0.025)"></td>
                <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ formatNumberWithCommas(totalTaeValue) }}</td>
                <td style="background: rgba(0, 0, 0, 0.025)"></td>

                <!-- Add other summary cells as needed -->
              </tr>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-text class="text-center" v-else>
          <span class="font-weight-bold">{{ $t('verifier.error.selectCompany') }}</span>
        </v-card-text>
      </v-card>
      <v-pagination
        v-if="paymentsCount > itemsPerPage"
        v-model="currentPage"
        :length="Math.ceil(paymentsCount / itemsPerPage)"
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
        <div class="d-flex justify-space-between align-center mb-6">
        <h3 class="text-h3 text-center mb-0">{{ $t('taePayments.head.taePayments') }}</h3>
      </div>
        <v-card class="pt-1">
          <v-list-item-title class="text-center py-8">{{ $t('taePayments.other.notVerified') }}</v-list-item-title>
        </v-card>
      </div>
    </div>
  </v-container>
</template>
<style lang="scss" scoped>
.action-icons {
  display: flex;
  justify-content: center;
}
.action-icons-disabled {
  pointer-events: none; /* Prevents interaction */
  opacity: 0.5; /* Makes it look disabled */
}
</style>
