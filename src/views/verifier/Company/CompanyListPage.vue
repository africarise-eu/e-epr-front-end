<script setup lang="ts">
import { computed, inject, onMounted, ref} from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import {formatDate} from '@/utils/date/dateFormat';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import Popover from '@/components/shared/Popover.vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

interface ApiResponse {
  count: number;
  rows: CompanyListResponseDto[];
}
export interface CompanyListResponseDto {
    id: number,
    companyName: string,
    status: string,
    rejectedReason: string,
    userId: number,
    logo: null|string,
    createdAt: string,
    updatedAt: string
}
export interface CompanyTableDto {
    id: number,
    companyName: string,
    status: string,
    rejectedReason: string,
    userId: number,
    logo: null|string,
    updatedAt: string
}
const {t} = useI18n();
const router = useRouter();
const companyList = ref<CompanyTableDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const selectedStatuses = ref<string[]>([]);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user =  JSON.parse(localStorage.getItem('user')!);
const showHistory = ref(false);
  const logId = ref(0);
const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.head.date'), key: 'updatedAt' },
  { title: t('verifier.head.company'), key: 'companyName' },
  { title: t('verifier.head.verificationStatus'), align: 'start', key: 'status' },
  { title: t('verifier.head.actions'), align: 'start', key: 'actions', sortable: false },
]);

const statuses = ref<string[]>(['Approved', 'Rejected', 'Pending','Improved']);

const isApprovedProduct =(item: any) => {
  return item.status === 'approved';
};

const getAll = async (search:string, statuses: string[], limit:number, page:number) => {
  try {
    const { useAPI } = useApi();
    const status = statuses.map((s) => s.toLowerCase());
    const payload = { search, status, limit, page };

    const result = await useAPI<ApiResponse>(VERIFIER.COMPANY_LIST , 'GET', null, payload);
    if (result && result.data) {
      productCount.value = result.data.count;
      companyList.value = result.data.rows.map(company=>{
        return {
            id: company.id,
            companyName: company.companyName,
            status: company.status,
            userId: company.userId,
            logo: company.logo,
            rejectedReason: company.rejectedReason ?? '',
            updatedAt: company.updatedAt
        }
      });
    }else{
      productCount.value = 0;
      companyList.value = []
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
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

const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const viewCompanyClick= (item:CompanyTableDto)=>{
    router.push({path: `/companies/${item.id}`})
}

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: 'Companies', href: '/companies' },
  ]);
  const roleSelection = localStorage.getItem('user');
  if (roleSelection) {
    try {
      const user = JSON.parse(roleSelection);
      selectedRole.value = user.roleId;
      if(selectedRole.value !== ROLE.VERIFIER){
        router.push({name: 'Dashboard'})
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
});

</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6 ">
      <h3 class="text-h3 text-center mb-0">{{$t('verifier.head.companies')}}</h3>
    </div>
    <div class="d-flex justify-start align-start">
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('verifier.label.search')" max-width="300px">
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
         <v-data-table :headers="headers" :items="companyList"  item-key="id" hide-default-footer>
          <template v-slot:item.companyName="{ item }">
            <v-btn variant="plain" class="pa-0 ml-n1" color="primary" @click="viewCompanyClick(item)">{{ item.companyName }}</v-btn>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn class=" text-capitalize"  color="primary"
            @click="viewCompanyClick(item)">{{ $t('verifier.button.verify') }}</v-btn>
          </template>
            <template v-slot:item.updatedAt="{ item }">
                    <span v-if="item.updatedAt">{{ formatDate(new Date(item.updatedAt)) }}</span>
                    <span v-else>-</span>
            </template>
            <template v-slot:item.status="{ item }">
              <!-- @click="viewCompanyClick(item)" -->
                <v-btn variant="plain" class="pa-0 d-flex text-capitalize"  :style="{ color: getStatusColor(item.status) }">
                     {{ t(`status.${item.status}`) }}

                     <!-- <span v-if="item.status.toLowerCase() ===  STATUSENUM.REJECTED" class="ml-2">
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
                </v-btn>
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
    <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.COMPANY" />
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
.v-table{
  ::v-deep .v-table__wrapper table tbody tr td{
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
        
}
</style>
