<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { formatDateTime } from '@/utils/date/dateFormat';
import { SearchOutlined } from '@ant-design/icons-vue';
import { getStatusColor, STATUSENUM, Status } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import type importShipmentDto from '@/composables/imports/importShipment';
import Popover from '@/components/shared/Popover.vue';
import { InfoCircleOutlined } from '@ant-design/icons-vue';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import { formatDate } from '@/utils/date/dateFormat';
import { formatNumberWithCommas } from '@/utils/commonMethods';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

interface ApiResponse {
  count: number;
  rows: importShipmentDto[];
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const imports = ref<importShipmentDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const selectedStatuses = ref<string[]>([]);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user = JSON.parse(localStorage.getItem('user')!);
const isFromCompany = ref(false);
const selectedCompany = ref<number>();
const showHistory = ref(false);
const logId = ref(0);

const headers = computed((): DataTableHeader[] => [
{ title: t('import.label.company'), key: 'Company.companyName' },
{ title: t('import.label.cdNo'), key: 'cdNo' },
  { title: t('import.label.etaDate'), key: 'etaDate' },
  { title: t('import.label.productUnits'), key: 'productUnits',align: 'end' },
  { title: t('import.label.status'), key: 'status', sortable: false },
  { title: t('import.label.taeValue'), key: 'taeValue' },
  { title: t('import.label.payStatus'), key: 'payStatus' },
  { title: t('import.label.actions'), align: 'center', key: 'actions', sortable: false }
]);

const statuses = ref<string[]>(['Approved', 'Rejected', 'Pending','Improved']);

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
const getAll = async (search: string, statuses: string[], limit: number, page: number, companyId?: number) => {
  try {
    const { useAPI } = useApi();
    const status = statuses.map((s) => s.toLowerCase());
    const payload = { search, status, limit, page };
    const result = await useAPI<ApiResponse>(`${VERIFIER.IMPORTS}/${companyId}`, 'GET', null, payload);
    if (result && result.data) {
      if (result && result.data) {
        imports.value = result.data.rows;
        productCount.value = result.data.count;
      }
    } else {
      productCount.value = 0;
      imports.value = [];
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  }
};

const viewImportClick = (item: importShipmentDto) => {
  router.push({ name: 'ViewImportShipment', params: { id: item.id.toString() } });
};
const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}
const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value ?? 0);
}, 1000);

const handleStatusFilter = () => {
  filterStore.setSelectedStatuses(selectedStatuses.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value ?? 0);
};
const selectCompany = (selectedId?: number) => {  
  const id = selectedId ? selectedId : selectedCompany.value;
  currentPage.value = 1;
   if (id === null) {
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, 0);
   }
   else{
  filterStore.setSelectedCompany(id as number);
  let selected = companyDropdownList.value.find((item: companyListDropdownDto) => item.id === id);
  if (selected) {
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, id);
  }
}
};
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value ?? 0);
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('verifier.head.imports'), href: '' }
  ]);
  search.value = filterStore.search;
  await getCompanyList();
  // if (filterStore.companyId !== 0) {
  //   selectedCompany.value = filterStore.companyId;
  //   selectCompany(selectedCompany.value);
  // }
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, 0);
  const roleSelection = localStorage.getItem('user');
  if (roleSelection) {
    try {
      const user = JSON.parse(roleSelection);
      selectedRole.value = user.roleId;
      if (selectedRole.value !== ROLE.VERIFIER) {
        router.push({ name: 'Dashboard' });
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
});
</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('verifier.head.imports') }}</h3>
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
      <v-text-field
        variant="outlined"
        v-model="search"
        @input="handleSearchFilter()"
        :label="$t('verifier.label.search')"
        max-width="300px"
      >
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
        <v-select
        v-model="selectedStatuses"
        density="compact"
        max-width="371px"
        class="ml-4"
        variant="outlined"
        color="primary"
        multiple
        chips
        clearable
        closable-chips
        :label="$t('product.label.status')"
        :items="statuses"
        :item-value="(item: string) => item"
        :item-title="(item: string) => $t(`status.${item.toLowerCase()}`)"
        @update:modelValue="handleStatusFilter"
      ></v-select>
    </div>
    <v-card class="pt-1">
      <v-card-text>
        <v-data-table :headers="headers" :items="imports" item-key="id" hide-default-footer>
          <template v-slot:item.etaDate="{ item }">
            <span>{{ formatDate(new Date(item.etaDate)) }}</span>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              class="text-capitalize"
              color="primary"
              :disabled="item.status === STATUSENUM.APPROVED"
              @click="viewImportClick(item)"
              >{{ $t('verifier.button.verify') }}</v-btn
            >
          </template>
          <template v-slot:item.status="{ item }">
            <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status) }">
                {{ t(`status.${item.status}`) }}
              <!-- <span v-if="item.status.toLowerCase() === STATUSENUM.NOTYETCLEARED.toLowerCase()" class="ml-2">
                <Popover position="below" :key="item.id" :id="`status-${item.id}`">
                  <template v-slot:activator>
                    <InfoCircleOutlined />
                  </template>
                  <div>{{item.rejectedReason}}</div>
                </Popover>
              </span> -->
              <v-tooltip>
                            <template #activator="{ props }">
                              <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                <div class="ml-2 icon">
                                   <InfoCircleOutlined @click="showLogHistory(item.id)"  />
                                </div>
                              </span>
                            </template>
                             <span> {{ t('logHistory.buttnText') }}</span>
                       </v-tooltip> 
            </span>
          </template>
          <template v-slot:item.payStatus="{ item }">
            <span class="text-capitalize" :style="{ color: getStatusColor(item.payStatus) }">
              {{ item.payStatus }}
            </span>
          </template>
          <template v-slot:item.productUnits="{ item }">
            {{ formatNumberWithCommas(item.productUnits ?? 0) }}
          </template>
          <template v-slot:item.taeValue="{ item }">
            {{ formatNumberWithCommas(item.taeValue ?? 0) }}
          </template>
        </v-data-table>
      </v-card-text>
     
    </v-card>
    <v-pagination
      v-if="productCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(productCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
  <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.IMPORT" />
  </ModalPopup>
</template>
<style lang="scss" scoped>
/* Make v-avatar a square */
.square-avatar {
  border-radius: 5;
  width: 36px;
  height: 36px;
}

.square-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.icon-avatar-size {
  font-size: 36px; /* Adjust size to match avatar */
  width: 36px;
  height: 36px;
}
.icon-container {
  display: inline-flex;
  align-items: center;
}

/* Default icon color */
.icon {
  font-size: 15px; /* Adjust size if needed */
  color: #000; /* Default color */
  transition: color 0.3s; /* Smooth transition */
}

/* Hover effect for the icon */
.icon:hover {
  color: blue; /* Hover color */
}

.action-icons {
  display: flex;
  justify-content: center;
}

.action-icons .icon {
  margin: 0 4px; /* Adjust spacing between icons if needed */
}
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
