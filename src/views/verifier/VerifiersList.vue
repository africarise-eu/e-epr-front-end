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
import {formatDateTime} from '@/utils/date/dateFormat';
import { SearchOutlined } from '@ant-design/icons-vue';
import { ROLE } from '@/composables/role';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

interface ApiResponse {
  count: number;
  rows: VerifierListResponseDto[];
}
export interface VerifierListResponseDto {
    id: number,
    firstName: string,
    lastName: string,
    verifier: {
        id: number,
        userId: number,
        verifierId: string,
        firstLogin: string|null,
        lastLogin: string|null,
        totalTask: number|null,
        taskAvg: number|null,
        createdAt: string,
        updatedAt: string,
        deletedAt: string|null
    }
}
export interface VerifierTableDto {
    id: number,
    verifierName: string,
    verifierId: string,
    firstLogin: string|null,
    lastLogin: string|null,
    totalTask: number|null,
    taskAvg: number|null
}
const {t} = useI18n();
const router = useRouter();
const verifiersList = ref<VerifierTableDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user =  JSON.parse(localStorage.getItem('user')!);

const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.head.verifierName'), key: 'verifierName' },
  { title: t('verifier.head.verifierId'), key: 'verifierId' },
  { title: t('verifier.head.firstLogin'), key: 'firstLogin' },
  { title: t('verifier.head.lastLogin'), key: 'lastLogin', sortable: false },
  { title: t('verifier.head.tasksDone'), key: 'totalTask',align: 'end' },
  { title: t('verifier.head.avgTaskMonth'), key: 'taskAvg',align: 'end' },
]);

const isApprovedProduct =(item: any) => {
  return item.status === 'approved';
};

const getAll = async (search:string, limit:number, page:number) => {
  try {
    const { useAPI } = useApi();
    const payload = { search, limit, page };

    const result = await useAPI<ApiResponse>(VERIFIER.VERIFIER_LIST , 'GET', null, payload);
    if (result && result.data) {
      productCount.value = result.data.count;
      verifiersList.value = result.data.rows.map(verifier=>{
        return {
            id: verifier.id,
            verifierName: verifier.firstName + ' ' + verifier.lastName,
            verifierId: verifier.verifier.verifierId,
            firstLogin: verifier.verifier.firstLogin,
            lastLogin: verifier.verifier.lastLogin,
            totalTask: verifier.verifier.totalTask??0,
            taskAvg: verifier.verifier.taskAvg??0
        }
      });
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  } 
};
    

const handleSearchFilter = debounce(() => {
   filterStore.setSearch(search.value);
  getAll(search.value, itemsPerPage.value, currentPage.value);
}, 1000);


const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, itemsPerPage.value, currentPage.value);
};

const onRowClick = (event:Event, item:{item:VerifierTableDto})=>{
    router.push({name: 'VerifierTaskLog', params: {id: item.item.id}})
}
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('verifier.head.list'), href: `/verifiers` }
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
      <h3 class="text-h3 text-center mb-0">{{$t('verifier.head.list')}}</h3>
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
         <v-data-table :headers="headers" :items="verifiersList"  item-key="id" hide-default-footer @click:row="onRowClick">
            <template v-slot:item.firstLogin="{ item }">
                    <span v-if="item.firstLogin">{{ formatDateTime(new Date(item.firstLogin)) }}</span>
                    <span v-else>-</span>
            </template>
            <template v-slot:item.lastLogin="{ item }">
                <span v-if="item.lastLogin">{{ formatDateTime(new Date(item.lastLogin)) }}</span>
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
