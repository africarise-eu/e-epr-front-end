<script setup lang="ts">
import { onMounted, ref, computed, inject } from 'vue';
import { useApi } from '@/composables/useApi';
import { VERIFIER, COMPANY } from '@/composables/apiEndpoints';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import type taePaymentDto from '@/composables/verifier/taePayments';
import { DefaultTheme } from '@/theme/LightTheme';
import { debounce } from 'lodash';
import { useI18n } from 'vue-i18n';
import { getStatusColor } from '@/composables/status';
import { formatDate } from '@/utils/date/dateFormat';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import { MailOutlined } from '@ant-design/icons-vue';
import { number } from 'joi';

const { t } = useI18n();
const taePayments = ref<taePaymentDto[]>([]);
const paymentsCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(2);
const search = ref('');
const selectedCompany = ref<number>();

const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.taePayments.companyName'), key: 'companyName' },
  { title: t('verifier.taePayments.paymentType'), key: 'paymentType' },
  { title: t('verifier.taePayments.createdAt'), key: 'createdAt' },
  { title: t('verifier.taePayments.total_value'), key: 'total_value' },
  { title: t('verifier.taePayments.paystatus'), key: 'payStatus' },
  { title: t('verifier.taePayments.pendingTAE'), key: 'pendingTAE' },
  { title: t('verifier.taePayments.deadline'), key: 'deadline' },
  { title: t('verifier.taePayments.remindOwner'), key: 'remindOwner' }
]);

const companyDropdownList = ref<companyListDropdownDto[]>([]);
const getCompanyList = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<{ count: number; rows: companyListResponseDto[] }>(COMPANY.LIST_COMPANY, 'GET');
  if (!result.error) {
    companyDropdownList.value = result.data.rows.map((company) => {
      return { id: company.id, name: company.companyName };
    });
  }
};
const getTaePayments = async (search: string, limit: number, page: number, companyId?: number) => {
  const { useAPI } = useApi();
  const payload = { search, companyId, limit, page };
  const result = await useAPI<Array<taePaymentDto>>(VERIFIER.PAYMENTS, 'GET', null, payload);
  if (!result.error) {
    taePayments.value = result.data;
  } else {
    console.log('Error on fetching tae fees');
  }
};

const selectCompany = async (selectedId?: number) => {
  await getTaePayments(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
};
const handleSearchFilter = debounce(async () => {
  await getTaePayments(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
}, 1000);

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await getTaePayments(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
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

function formatNumberWithCommas(value: number): string {
    if (typeof value === 'number') {
      // Convert the number to a string with two decimal places and then add commas
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else if (typeof value === 'string') {
      // Parse the string to a float, then format it
      let number = parseFloat(value);
      if (!isNaN(number)) {
        return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
    }
    // Return a default value or throw an error if the value is not a number or a string
    return 'Invalid input';
}

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('taePayments.head.taePayments'), href: '' }
  ]);
  await getCompanyList();
  //await getTaePayments(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
});
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('taePayments.head.taePayments') }}</h3>
    </div>
    <div class="d-flex justify-start align-start">
      <v-autocomplete
        v-model="selectedCompany"
        variant="outlined"
        max-width="300px"
        class="mr-2"
        color="primary"
        clearable
        :placeholder="$t('authentication.placeholder.company')"
        :items="companyDropdownList"
        item-value="id"
        item-title="name"
        @update:model-value="selectCompany()"
      ></v-autocomplete>
      <!-- <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('compensationRequest.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field> -->
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
            {{ formatNumberWithCommas(item.total_value) }}
          </template>
          <template v-slot:item.deadline="{ item }"> Nil </template>
          <template v-slot:item.remindOwner="{ item }">
            <div class="action-icons action-icons-disabled">
              <MailOutlined />
            </div>
          </template>
          <template v-if="taePayments.length > 0" v-slot:body.append>
            <tr>
              <td class="text-left font-weight-black" style="background: rgba(0, 0, 0, 0.025)">{{t('packingMaterial.table.total')}}</td>
              <td style="background: rgba(0, 0, 0, 0.025)"></td>
              <td style="background: rgba(0, 0, 0, 0.025)"></td>
              <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">{{ formatNumberWithCommas(totalTaeValue) }}</td>
              <td style="background: rgba(0, 0, 0, 0.025)"></td>
              <td class="text-left font-weight-bold" style="background: rgba(0, 0, 0, 0.025)">0</td>
              <td style="background: rgba(0, 0, 0, 0.025)"></td>
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
    <!-- <v-pagination
      v-model="currentPage"
      :length="Math.ceil(paymentsCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination> -->
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
