<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { CloseOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import Popover from '@/components/shared/Popover.vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

interface ApiResponse {
  count: number;
  rows: endDestinationResponseDto[];
}

interface endDestinationResponseDto {
  id: number;
  companyId: number;
  userId: number;
  city: number;
  country: number;
  orgType: string;
  orgName: string;
  companyRegNo: string;
  phone: string;
  email: string;
  contactPerson: string;
  address: string;
  status: string;
  rejectedReason: string;
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const endDestinationList = ref<endDestinationResponseDto[]>([]);
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
const currentYear = new Date().getFullYear();
const showHistory = ref(false);
const logId = ref(0);

// Dialog-related state
const selectedEndDestination = ref<endDestinationResponseDto | null>(null);
const dialogVisible = ref(false);
const rejectModalVisible = ref(false); // State to handle reject modal visibility
const rejectReason = ref('');

const headers = computed((): DataTableHeader[] => [
  { title: t('endDestination.label.orgName'), key: 'orgName' },
  { title: t('endDestination.label.orgType'), key: 'orgType' },
  { title: t('endDestination.label.companyRegNo'), key: 'companyRegNo' },
  { title: t('endDestination.label.status'), key: 'status' },
  { title: t('verifier.table.actions'), align: 'start', key: 'actions', sortable: false }
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

const getAll = async (search: string, statuses: string[], limit: number, page: number, id?: number) => {
  try {
    const { useAPI } = useApi();
    const status = statuses.map((s) => s.toLowerCase());
    const payload = { status };
    let endpoint = `${VERIFIER.END_DESTINATION_LIST}?search=${search}&limit=${limit}&page=${page}`;
    if (id) {
      endpoint += `&companyId=${id}`;
    }
    const result = await useAPI<{ count: number; rows: endDestinationResponseDto[] }>(endpoint, 'GET', null, payload);
    if (result && result.data) {
      endDestinationList.value = result.data.rows;
      productCount.value = result.data.count;
    } else {
      productCount.value = 0;
      endDestinationList.value = [];
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  }
};

const viewEndDestination = (item: endDestinationResponseDto) => {
  router.push({ name: 'ViewEndDestination', params: { id: item.id.toString() } });
};

const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
}, 1000);

const handleStatusFilter = () => {
  filterStore.setSelectedStatuses(selectedStatuses.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const selectCompany = (selectedId?: number) => {
  const id = selectedId ? selectedId : selectedCompany.value;
  filterStore.setSelectedCompany(id as number);
  currentPage.value = 1;
  let selected = companyDropdownList.value.find((item: companyListDropdownDto) => item.id === id);
  if (selected) {
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, id);
  }
};
const showLogHistory = (productId: number) => {
  showHistory.value = !showHistory.value;
  logId.value = productId;
};
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: 'End Destination', href: `/verify/end-destination` }
  ]);
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  await getCompanyList();
  // if (route.params.companyId) {
  //   selectedCompany.value = Number(route.params.companyId);
  //   isFromCompany.value = true;
  //   selectCompany(selectedCompany.value);
  // }
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, 0);
  if (filterStore.companyId !== 0) {
    selectedCompany.value = filterStore.companyId;
    selectCompany(selectedCompany.value);
  }
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

watch(
  async () => route.params,
  async () => {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: 'End Destination', href: `/verify/end-destination` }
    ]);
    search.value = filterStore.search;
    if (route.params.companyId) {
      // selectedCompany.value = Number(route.params.companyId);
      isFromCompany.value = true;
      // selectCompany(selectedCompany.value);
    } else {
      selectedCompany.value = undefined;
      isFromCompany.value = false;
    }
  }
);
</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('verifier.head.endDestination') }}</h3>
    </div>
    <div class="d-flex justify-start align-start">
      <!-- <v-autocomplete
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
      ></v-autocomplete> -->
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
        <v-data-table :headers="headers" :items="endDestinationList" item-key="id" hide-default-footer>
          <template v-slot:item.actions="{ item }">
            <v-btn
              class="text-capitalize"
              color="primary"
              :disabled="item.status === STATUSENUM.REJECTED || item.status === STATUSENUM.APPROVED"
              @click="viewEndDestination(item)"
              >{{ $t('verifier.button.verify') }}</v-btn
            >
          </template>
          <template v-slot:item.status="{ item }">
            <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status ?? '') }">
            {{ t(`status.${item.status}`) }}
              <!-- <span v-if="item.status &&item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
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
                      <InfoCircleOutlined @click="showLogHistory(item.id)" />
                    </div>
                  </span>
                </template>
                <span> {{ t('logHistory.buttnText') }}</span>
              </v-tooltip>
            </span>
          </template>
        </v-data-table>
      </v-card-text>
      <!-- <v-card-text class="text-center" v-else>
        <span class="font-weight-bold">{{ $t('verifier.error.selectCompany') }}</span>
      </v-card-text> -->
    </v-card>
    <v-pagination
      v-if="productCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(productCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
    <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
      <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.END_DESTINATION" />
    </ModalPopup>
  </v-container>
</template>

<style lang="scss" scoped>
/* Align close button on the right */
.v-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon {
  font-size: 20px;
  cursor: pointer;
}

.v-card-actions {
  justify-content: flex-end;
}
.ant-modal {
  z-index: 3000 !important;
}

.icon {
  font-size: 15px; /* Adjust size if needed */
  color: #000; /* Default color */
  transition: color 0.3s; /* Smooth transition */
}

/* Hover effect for the icon */
.icon:hover {
  color: blue; /* Hover color */
}


.ant-modal-mask {
  z-index: 3000 !important;
}
.v-overlay {
  z-index: 1000 !important;
}

/* Button customizations */
a-button {
  margin-left: 10px;
}
</style>
