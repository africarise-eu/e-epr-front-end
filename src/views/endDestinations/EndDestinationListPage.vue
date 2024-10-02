<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import {  COMPENSATION } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import {getStatusColor, STATUSENUM} from '@/composables/status';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { CloseOutlined, SearchOutlined, InfoCircleOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons-vue';
import Popover from '@/components/shared/Popover.vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';

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
const endDestCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();

const headers = computed((): DataTableHeader[] => [
  { title: t('endDestination.label.orgName'), key: 'orgName' },
  { title: t('endDestination.label.orgType'), key: 'orgType' },
  { title: t('endDestination.label.companyRegNo'), key: 'companyRegNo' },
  { title: t('endDestination.label.status'), key: 'status' },
  { title: t('verifier.table.actions'), align: 'center', key: 'actions', sortable: false },
]);


const isCompanyProfile = ref(false);
const user =  JSON.parse(localStorage.getItem('user')!);
isCompanyProfile.value = user.isProfileExist;

const isApprovedProduct =(item: any) => {
  return item.status === STATUSENUM.APPROVED;
};

const getAll = async (search: string, limit: number, page: number) => {
  try {
    const { useAPI } = useApi();
    let endpoint = `${COMPENSATION.GET_ENDDESTINATIONS}?search=${search}&limit=${limit}&page=${page}`;
    const result = await useAPI<{ totalCount: number, rows: endDestinationResponseDto[] }>(endpoint, 'GET');
    if (result && result.data) {
      endDestinationList.value = result.data.rows;
      endDestCount.value = result.data.totalCount;
    } else {
      endDestCount.value = 0;
      endDestinationList.value = [];
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  }
};


const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  currentPage.value = 1;
  getAll(search.value, itemsPerPage.value, currentPage.value);
}, 1000);

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, itemsPerPage.value, currentPage.value);
};


const editEndDestination=(item : endDestinationResponseDto)=>{
  router.push({ name: 'UpdateEndDestination', params: { id: item.id.toString() } });
}

const viewEndDestination=(item : endDestinationResponseDto)=>{
  router.push({ name: 'ViewEndDestination', params: { id: item.id.toString() } });
}

const deleteEndDestination= async(item : endDestinationResponseDto)=>{
    try {
    const { useAPI } = useApi();
    const result  = await useAPI<endDestinationResponseDto>(`${COMPENSATION.DELETE_ENDDESTINATIONS}/${item.id}`, 'DELETE');
    snackbarStore.showMessage(result.message, 'success')
    getAll(search.value, itemsPerPage.value, currentPage.value);
  } catch (error) {
    console.error('Failed to delete End destination:', error);
  } 
}

const createCompany = async () => {
  router.push({name: 'AddCompanyProfile'})
}

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('endDestination.head.list') , href: '' },
  ]);
  search.value = filterStore.search;
  getAll(search.value, itemsPerPage.value, currentPage.value);
});

</script>


<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('endDestination.head.list') }}</h3>
      <div v-if="isCompanyProfile">
        <v-btn class=" mt-5 mr-2 text-capitalize" color="primary"
        :to="{ name: 'AddEndDestination' }">{{ $t('endDestination.button.add') }}</v-btn>
      </div>
    </div>
    <div class="d-flex justify-start align-start" v-if="isCompanyProfile">
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('verifier.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
    </div>
    <v-card class="pt-1">
      <v-card-text>
        <v-data-table v-if="isCompanyProfile" :headers="headers" :items="endDestinationList" item-key="id" hide-default-footer>
          <template v-slot:item.actions="{ item }">
            <div class="action-icons">
                  <v-tooltip>
                    <template #activator="{ props }">
                      <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                          <div :class="{'icon-container': true, 'center-icon': isApprovedProduct(item)}">
                            <EyeOutlined @click="viewEndDestination(item)" class="icon px-3"></EyeOutlined>
                            </div>
                       </span>
                      </template>
                      <span>{{t('common.view')}}</span>
              </v-tooltip>
               <v-tooltip>
                    <template #activator="{ props }">
                      <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                         <EditOutlined @click="editEndDestination(item)" v-if="!isApprovedProduct(item)" class="icon px-3"></EditOutlined>
                       </span>
                      </template>
                      <span>{{t('common.edit')}}</span> 
               </v-tooltip>
               <v-tooltip>
                    <template #activator="{ props }">
                      <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                          <CloseOutlined @click="deleteEndDestination(item)" v-if="!isApprovedProduct(item)" class="icon px-3"></CloseOutlined>
                       </span>
                      </template>
                      <span>{{t('common.delete')}}</span> 
               </v-tooltip>
            </div>
          </template>
           <template v-slot:item.status="{ item }">
                        <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status ?? '') }">
                               {{ t(`status.${item.status}`) }}
                              <span v-if="item.status &&item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                                <Popover position="below" :key="item.id" :id="`status-${item.id}`">
                                  <template v-slot:activator>
                                    <InfoCircleOutlined />
                                  </template>
                                  <div>{{item.rejectedReason}}</div>
                                </Popover>
                              </span>
                  </span>
           </template>
        </v-data-table>
          <NoProfileCreateCompany v-else-if="!isCompanyProfile" :description="$t('company.other.noCompanyDetails')" 
          :submitButtonText="$t('company.button.createCompany')" @submit="createCompany"></NoProfileCreateCompany>
        
      </v-card-text>
    </v-card>
    <v-pagination v-if="isCompanyProfile && endDestCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(endDestCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
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

.ant-modal-mask {
  z-index: 3000 !important;
}
.v-overlay{
  z-index: 1000 !important;
}
icon-container {
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


/* Button customizations */
a-button {
  margin-left: 10px;
}

</style>
