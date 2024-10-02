<script setup lang="ts">
import { inject, onMounted, ref, watch, onUnmounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { formatDateTime } from '@/utils/date/dateFormat';
import { DefaultTheme } from '@/theme/LightTheme';
import { SearchOutlined, PictureOutlined, FileDoneOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { formatDate } from '@/utils/date/dateFormat';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import type productDto from '@/composables/product/product';
import type compensationRequestDto from '@/composables/compensation/compensationRequest';
import { mapApiResponseToCompensationRequestDto } from '@/composables/compensation/compensationRequestvarifier';
import type compensationDocumentDto from '@/composables/compensation/compensationDocument';
import Popover from '@/components/shared/Popover.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';
import { OBJECTTYPE } from '@/composables/logObjectTypes';
import LogHistory from '@/components/shared/LogHistory.vue';

interface ApiResponse {
  count: number;
  rows: compensationRequestDto[];
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const compensationRequests = ref<compensationRequestDto[]>([]);
const documents = ref<compensationDocumentDto[]>([]);
const compReqCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showDocumentModal = ref(false);
const selectedRole = ref<number>(0);
const selectedStatuses = ref<string[]>([]);
const modalWidth = ref('');
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user = JSON.parse(localStorage.getItem('user')!);
const selectedCompany = ref<number>();
  const showHistory = ref(false);
  const logId = ref(0);

const headers = computed((): DataTableHeader[] => [
  { title: t('import.label.company'), key: 'companyName' },
  { title: t('verifier.table.dateOfRequest'), key: 'requestedDate' },
  { title: t('verifier.table.dateOfDeliveryEndDestination'), key: 'deliveryToEdDate' },
  { title: t('verifier.table.material'), key: 'material' },
  { title: t('verifier.table.kg'), key: 'deliveredKgs',align: 'end' },
  { title: t('verifier.table.endDestinationOrganisation'), key: 'edOrganisation' },
  // { title: t('verifier.table.uploadedDocuments'), key: 'documents' },
  { title: t('verifier.table.edOrgStatus'), key: 'edOrgStatus' },
  { title: t('verifier.table.verificationStatus'), key: 'status' },
  { title: 'Actions', align: 'start', key: 'actions', sortable: false }
]);
const documentHeaders = computed((): DataTableHeader[] => [
  { title: 'Document', key: 'documentUrl' },
  { title: 'Description', key: 'description' }
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
    const payload = { search, status, limit, page, companyId };

    const result = await useAPI<ApiResponse>(VERIFIER.COMPENSATION, 'GET', null, payload);
    if (result && result.data) {
      compensationRequests.value = result.data.rows.map(mapApiResponseToCompensationRequestDto);
      compReqCount.value = result.data.count;
      showDocumentModal.value = false;
    } else {
      compReqCount.value = 0;
      compensationRequests.value = [];
    }
  } catch (error) {
    console.error(t('Error on while fetching compensation requests'), error);
  }
};

const viewCompensationRequest = (item: compensationRequestDto) => {
  router.push({ name: 'ViewVerifyCompensation', params: { id: item.id.toString() } });
};

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

const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}

const selectCompany = (selectedId?: number) => {
  const id = selectedId ? selectedId : selectedCompany.value;
  currentPage.value = 1;
  if (id === null) {
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, 0);
  } else {
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

const handleDocumentPopup = (item: compensationRequestDto) => {
  documents.value = item.documents;
  showDocumentModal.value = true;
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('verifier.head.compensation'), href: '' }
  ]);
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  await getCompanyList();
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

  updateModalWidth();
  window.addEventListener('resize', updateModalWidth);
});
const updateModalWidth = () => {
  const width = window.innerWidth;
  if (width < 600) {
    // Mobile view
    modalWidth.value = '100%';
  } else if (width < 960) {
    // Tablet view
    modalWidth.value = '60%';
  } else {
    // Desktop view
    modalWidth.value = '40%';
  }
};

onUnmounted(() => {
  window.removeEventListener('resize', updateModalWidth);
});
</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('verifier.head.compensation') }}</h3>
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
        <v-data-table :headers="headers" :items="compensationRequests" item-key="id" hide-default-footer>
          <template v-slot:item.material="{ item }">
              {{ t(`common.packagingMaterial.${item.material}`) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn
              class="text-capitalize"
              color="primary"
              :disabled="item.status === STATUSENUM.REJECTED || item.status === STATUSENUM.APPROVED"
              @click="viewCompensationRequest(item)"
              >{{ $t('verifier.button.verify') }}</v-btn
            >
          </template>
          <template v-slot:item.edOrgStatus="{ item }">
            <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.edOrgStatus) }">
               {{ t(`status.${item.edOrgStatus}`) }}
            </span>
          </template>
          <template v-slot:item.status="{ item }">
            <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status) }">
                {{ t(`status.${item.status}`) }}

              <!-- <span v-if="item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                <Popover position="below" :key="item.id" :id="`status-${item.id}`">
                  <template v-slot:activator>
                    <InfoCircleOutlined />
                  </template>
                  <div>item.rejectedReason</div>
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
          <template v-slot:item.requestedDate="{ item }">
            <span>{{ formatDate(new Date(item.requestedDate)) }}</span>
          </template>
          <template v-slot:item.deliveryToEdDate="{ item }">
            <span>{{ formatDate(new Date(item.deliveryToEdDate)) }}</span>
          </template>
          <template v-slot:item.documents="{ item }">
            <v-tooltip>
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                  <div class="icon-container center-icon">
                    <FileDoneOutlined @click="handleDocumentPopup(item)" class="icon px-3"></FileDoneOutlined>
                  </div>
                </span>
              </template>
              <span>Documents</span>
            </v-tooltip>
          </template>
          <template v-slot:item.deliveredKgs="{ item }">
            {{ formatNumberWithCommas(item.deliveredKgs) }}
          </template>
        </v-data-table>
      </v-card-text>
      
    </v-card>
    <v-pagination
      v-if="compReqCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(compReqCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
    <ModalPopup v-model="showDocumentModal" :max-width="modalWidth" :title="$t('compensationRequest.head.documents')">
      <v-data-table :headers="documentHeaders" :items="documents" item-key="id" hide-default-footer>
        <!-- action column -->
        <template v-slot:item.documentUrl="{ item }">
          <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
            <iframe v-if="item.documentName.endsWith('.pdf')" :src="item.documentUrl" frameborder="0" style="width: 100%"></iframe>
            <img v-else-if="item.documentUrl" :src="item.documentUrl" alt="compensation document" />
            <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
          </v-avatar>
        </template>
      </v-data-table>
    </ModalPopup>
    <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.COMPENSATION" />
  </ModalPopup>
  </v-container>
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
