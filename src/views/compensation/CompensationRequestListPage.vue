<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, reactive, inject, ref, type Ref } from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { useApi } from '@/composables/useApi';
import { COMPANY, COMPENSATION } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type compensationRequestDto from '@/composables/compensation/compensationRequest';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { formatDate } from '@/utils/date/dateFormat';
import Popover from '@/components/shared/Popover.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import {
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  FileDoneOutlined,
  CloseOutlined,
  FilePdfOutlined
} from '@ant-design/icons-vue';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import { mapApiResponseToCompensationRequestDto } from '@/composables/compensation/compensationRequest';
import type compensationDocumentDto from '@/composables/compensation/compensationDocument';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { formatNumberWithCommas } from '@/utils/commonMethods';
import type { CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';

interface ApiResponse {
  count: number;
  rows: compensationRequestDto[];
}
const { t } = useI18n();
const router = useRouter();
const compensationRequests = ref<compensationRequestDto[]>([]);
const documents = ref<compensationDocumentDto[]>([]);
const compReqCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const showDocumentModal = ref(false);
const modalWidth = ref('');
const search = ref('');
const snackbarStore = useSnackbarStore();
const selectedStatuses = ref<string[]>([]);
const filterStore = useFilterStore();

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
  { title: t('compensationRequest.tableHeaderList.requestedDate'), key: 'requestedDate' },
  { title: t('compensationRequest.tableHeaderList.deliveryToEdDate'), key: 'deliveryToEdDate' },
  { title: t('compensationRequest.tableHeaderList.material'), key: 'material' },
  { title: t('compensationRequest.tableHeaderList.deliveredKgs'), key: 'deliveredKgs',align: 'end' },
  { title: t('compensationRequest.tableHeaderList.edOrganisation'), key: 'edOrganisation' },
  // { title: t('compensationRequest.tableHeaderList.documents'), align: 'center', key: 'documents' },
  { title: t('compensationRequest.tableHeaderList.status'), key: 'status', sortable: false },
  { title: t('compensationRequest.tableHeaderList.actions'), align: 'center', key: 'actions', sortable: false }
]);
const documentHeaders = computed((): DataTableHeader[] => [
  { title: t('compensationRequest.tableHeaderList.documentUrl'), key: 'documentUrl' },
  { title: t('compensationRequest.tableHeaderList.description'), key: 'description' }
]);

const statuses = ref<string[]>(['Approved', 'Rejected', 'Pending','Improved']);

const isApproved = (item: any) => {
  return item.status === 'approved';
};

const getAll = async (search: string, statuses: string[], limit: number, page: number) => {
  try {
    const { useAPI } = useApi();
    const status = statuses.map((s) => s.toLowerCase());
    const payload = { search, status, limit, page };

    const result = await useAPI<ApiResponse>(COMPENSATION.GET, 'GET', null, payload);

    if (result && result.data) {
      compensationRequests.value = result.data.rows.map(mapApiResponseToCompensationRequestDto);
      compReqCount.value = result.data.count;
      showDocumentModal.value = false;
    }
  } catch (error) {
    console.error('Failed to get compensation request:', error);
  }
};

const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
}, 1000);

const handleStatusFilter = () => {
  filterStore.setSelectedStatuses(selectedStatuses.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const editCompensationRequest = (item: compensationRequestDto) => {
  router.push({ name: 'UpdateCompensation', params: { id: item.id.toString() } });
};

const viewCompensationRequest = (item: compensationRequestDto) => {
  router.push({ name: 'ViewCompensation', params: { id: item.id.toString() } });
};

const deleteCompensationRequest = async (item: compensationRequestDto) => {
  try {
    const { useAPI } = useApi();
    const result = await useAPI<compensationRequestDto>(`${COMPENSATION.DELETE}/${item.id}`, 'DELETE');
    snackbarStore.showMessage(result.message, 'success');
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
  } catch (error) {
    console.error('Failed to delete compensation request:', error);
  }
};
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

const handleDocumentPopup = (item: compensationRequestDto) => {
  documents.value = item.documents;
  showDocumentModal.value = true;
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('compensationRequest.head.compensation'), href: '/compensations' },
    { title: t('compensationRequest.head.list'), href: '' }
  ]);
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
  updateModalWidth();
  window.addEventListener('resize', updateModalWidth);
});

// Clean up event listener on unmount
onUnmounted(() => {
  window.removeEventListener('resize', updateModalWidth);
});

const createCompany = async () => {
  router.push({ name: 'AddCompanyProfile' });
};
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('compensationRequest.head.list') }}</h3>
      <div v-if="isCompanyProfile && isCompanyVerified">
        <v-btn class="mt-5 mr-2 text-capitalize" :to="{ name: 'Compensation' }">{{ $t('common.back') }}</v-btn>
        <v-btn class="mt-5 mr-2 text-capitalize" color="primary" :to="{ name: 'AddCompensation' }">{{
          $t('compensationRequest.button.add')
        }}</v-btn>
      </div>
    </div>
    <div class="d-flex justify-start align-start" v-if="isCompanyProfile && isCompanyVerified">
      <v-text-field
        variant="outlined"
        v-model="search"
        @input="handleSearchFilter()"
        :label="$t('compensationRequest.label.search')"
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
        :label="$t('compensationRequest.label.status')"
        :items="statuses"
        @update:modelValue="handleStatusFilter"
      ></v-select>
    </div>
    <v-card class="pt-1">
      <v-card-text>
        <v-data-table
          v-if="isCompanyProfile && isCompanyVerified"
          :headers="headers"
          :items="compensationRequests"
          item-key="id"
          hide-default-footer
        >
        <template v-slot:item.material="{ item }">
              {{ t(`common.packagingMaterial.${item.material}`) }}
          </template>
          <!-- action column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-icons">
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                    <div :class="{ 'icon-container': true, 'center-icon': isApproved(item) }">
                      <EyeOutlined @click="viewCompensationRequest(item)" class="icon px-3"></EyeOutlined>
                    </div>
                  </span>
                </template>
                <span>{{t('common.view')}}</span>
              </v-tooltip>
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                    <EditOutlined @click="editCompensationRequest(item)" v-if="!isApproved(item)" class="icon px-3"></EditOutlined>
                  </span>
                </template>
                <span>{{t('common.edit')}}</span>
              </v-tooltip>
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                    <CloseOutlined @click="deleteCompensationRequest(item)" v-if="!isApproved(item)" class="icon px-3"></CloseOutlined>
                  </span>
                </template>
                <span>{{t('common.delete')}}</span>
              </v-tooltip>
            </div>
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
          <template v-slot:item.status="{ item }">
            <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status) }">
              {{ t(`status.${item.status}`) }}
              <span v-if="item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                <Popover position="below" :key="item.id" :id="`status-${item.id}`">
                  <template v-slot:activator>
                    <InfoCircleOutlined />
                  </template>
                  <div>{{ item.rejectedReason }}</div>
                </Popover>
              </span>
            </span>
          </template>
          <template v-slot:item.deliveredKgs="{ item }">
            {{ formatNumberWithCommas(item.deliveredKgs) }}
         </template>
        </v-data-table>
        <NoProfileCreateCompany
          v-else-if="!isCompanyProfile"
          :description="$t('company.other.noCompanyDetails')"
          :submitButtonText="$t('company.button.createCompany')"
          @submit="createCompany"
        ></NoProfileCreateCompany>
        <v-list-item-title v-else-if="!isCompanyVerified" class="text-center my-8">{{ $t('import.other.notVerified') }}</v-list-item-title>
      </v-card-text>
    </v-card>
    <v-pagination
      v-if="isCompanyProfile && compReqCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(compReqCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
  <ModalPopup v-model="showDocumentModal" :max-width="modalWidth" :title="$t('compensationRequest.head.documents')">
    <v-data-table :headers="documentHeaders" :items="documents" item-key="id" hide-default-footer>
      <!-- action column -->
      <template v-slot:item.documentUrl="{ item }">
        <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
          <!-- <iframe v-if="item.documentName.endsWith('.pdf')" :src="item.documentUrl" frameborder="0" style="width: 100%"></iframe> -->
          <FilePdfOutlined  v-if="item.documentName.endsWith('.pdf')" />
          <img v-else-if="item.documentUrl" :src="item.documentUrl" alt="compensation document" />
          <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
        </v-avatar>
      </template>
    </v-data-table>
  </ModalPopup>
</template>
<style lang="scss" scoped>
/* Make v-avatar a square */
.square-avatar {
  border-radius: 0;
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
