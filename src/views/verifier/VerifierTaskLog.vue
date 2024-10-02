<script setup lang="ts">
import { computed, inject, onMounted, ref} from 'vue';
import { useApi } from '@/composables/useApi';
import { VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import {formatDateTime,formatDate} from '@/utils/date/dateFormat';
import { SearchOutlined } from '@ant-design/icons-vue';
import { getStatusColor } from '@/composables/status';
import { ROLE } from '@/composables/role';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

interface ApiResponse {
  count: number;
  rows: VerifierLogListResponseDto[];
}
export interface VerifierLogListResponseDto {
        id: number,
        companyId: number,
        userId:number,
        objectType: string,
        objectName: number,
        fromStatus: string,
        toStatus: string,
        comment: string,
        createdAt: string,
        company:{
          companyName: string
        }
        
}

// export interface VerifierTableDto {
//     id: number,
//     verifierName: string,
//     verifierId: string,
//     firstLogin: string|null,
//     lastLogin: string|null,
//     totalTask: number|null,
//     taskAvg: number|null
// }
const {t} = useI18n();
const router = useRouter();
const verifiersLogList = ref<VerifierLogListResponseDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user =  JSON.parse(localStorage.getItem('user')!);
const userId=ref<number>(0);

const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.head.date'), key: 'createdAt' },
  { title: t('verifier.head.company'), key: 'company.companyName' },
  { title: t('verifier.head.objectType'), key: 'objectType' },
  { title: t('verifier.head.objectName'), key: 'objectName', sortable: false },
  { title: t('verifier.head.status'), key: 'toStatus' },
  { title: t('verifier.head.comment'), key: 'comment' },
]);

const isApprovedProduct =(item: any) => {
  return item.status === 'approved';
};
const objectType = {
    COMPANY: 0,
    PRODUCT: 1,
    COMPENSATION: 2,
    END_DESTINATION: 3,
    IMPORT: 4,
    PRODUCTION: 5
};
const getObjectTypeText = (objectTypeNumber: number) => {
  switch (objectTypeNumber) {
    case objectType.COMPANY:
      return 'Company';
    case objectType.PRODUCT:
      return 'Product';
    case objectType.COMPENSATION:
      return 'Compensation';
    case objectType.END_DESTINATION:
      return 'End Destination';
    case objectType.IMPORT:
      return 'Import';
    case objectType.PRODUCTION:
      return 'Production Plan';
    default:
      return 'Unknown';
  }
};
const getAll = async (search:string, limit:number, page:number) => {
  try {
    const { useAPI } = useApi();
    const userId = router.currentRoute.value.params.id;
    const url = `${VERIFIER.VERIFIER_LOG_LIST}/${userId}?limit=${limit}&page=${page}`;
    const result = await useAPI<ApiResponse>(url, 'GET', null);
    if (result && result.data) {
      productCount.value = result.data.count;
      verifiersLogList.value = result.data.rows.map(verifier => {
  return {
    id: verifier.id,
    companyId: verifier.companyId,
    userId: verifier.userId,
    objectType: getObjectTypeText(Number(verifier.objectType)),
    objectName: verifier.objectName,
    fromStatus: verifier.fromStatus,
    toStatus: verifier.toStatus,
    comment: verifier.comment,
    createdAt: formatDate(new Date(verifier.createdAt)),
    company: { companyName: verifier.company.companyName } 
  }
})
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  } 
};
    
function capitalizeFirstLetter(text:String|undefined) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
const handleSearchFilter = debounce(() => {
   filterStore.setSearch(search.value);
  getAll(search.value, itemsPerPage.value, currentPage.value);
}, 1000);


const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, itemsPerPage.value, currentPage.value);
};

// const onRowClick = (event:Event, item:{item:VerifierTableDto})=>{
// }
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  userId.value = Number(router.currentRoute.value.params.id);
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('verifier.head.list'), href: `/verifiers` },
    { title: t('verifier.head.taskLog'), href: `/verifiers/${userId}` }
  ]);
  search.value = filterStore.search;
  getAll(search.value, itemsPerPage.value, currentPage.value);
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
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6 ">
      <h3 class="text-h3 text-center mb-0">{{$t('verifier.head.taskLog')}}</h3>
    </div>
    <div class="d-flex justify-start align-start">
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('verifier.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
    </div>
    <v-card class="pt-1">
      <v-card-text>   
         <v-data-table :headers="headers" :items="verifiersLogList"  item-key="id" hide-default-footer >
            <template v-slot:item.toStatus="{ item }">
                    <span v-if="item.toStatus" :style="{ color: getStatusColor(item.toStatus) }">{{ capitalizeFirstLetter(item.toStatus) }}</span>
                    <span v-else>-</span>
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
