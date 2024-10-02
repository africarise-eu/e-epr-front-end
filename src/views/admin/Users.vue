<script setup lang="ts">
import { computed, onMounted, onUnmounted, onUpdated, reactive, inject, ref, type Ref} from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { useApi } from '@/composables/useApi';
import { ADMIN, COMPANY } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type usersDto from '@/composables/admin/users';
import { DefaultTheme } from '@/theme/LightTheme';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import { EditOutlined, SearchOutlined } from '@ant-design/icons-vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

interface ApiResponse {
  count: number;
  rows: usersDto[];
}
const users = ref<usersDto[]>([]);
const usersCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const search = ref('');
const {t} = useI18n();
const snackbarStore = useSnackbarStore();
const selectedStatuses = ref<string[]>([]);
const filterStore = useFilterStore();

const headers = computed((): DataTableHeader[] => [
  { title: t('admin.label.userName'), key: 'fullName' },
  { title: t('admin.label.email'), key: 'email' },
  { title: t('admin.label.role'), key: 'roleName' },
  { title: t('admin.label.company'), key: 'companyName'},
  { title: t('admin.label.status'), key: 'isActive', sortable: false },
  { title: t('admin.label.actions'), align: 'center', key: 'actions', sortable: false },
]);

const statuses = ref([
  { label: "Blocked", value: false },
  { label: "Active", value: true },
]);

const mapUserData = (data: usersDto[]): usersDto[] => {
  return data.map(user => ({
    ...user,
    fullName: `${user.firstName} ${user.lastName}`
  }));
};

const getUsers = async (search:string, statuses:string[], limit:number, page:number) => {
  try {
    const { useAPI } = useApi();
    const booleanStatuses: boolean[] = statuses.map(Boolean);
    const status = booleanStatuses.includes(true) && booleanStatuses.includes(false) ? null : booleanStatuses[0];

    const payload = { search, status, limit, page };
    const result  = await useAPI<{count: number, rows:usersDto[]}>(ADMIN.USERS, 'GET',null,payload);
    if(!result.error){   
          users.value = mapUserData(result.data.rows);
          usersCount.value = result.data.count;
    }
  } catch (error) {
    console.error( 'Error on when fetching users', error);
  }
};

const handleSearchFilter = debounce(() => {
   filterStore.setSearch(search.value);
  currentPage.value = 1;
  getUsers(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
}, 1000);

const handleStatusFilter = () => {
   filterStore.setSelectedStatuses(selectedStatuses.value);
  currentPage.value = 1;
   getUsers(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getUsers(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};


const blockOrUnblockUser= async(item : usersDto, status: boolean)=>{
    try {
    const { useAPI } = useApi();
    const payload = { status: status };
    const result  = await useAPI<any>(`${ADMIN.USER_ACTIVATION}/${item.userId}`, 'PATCH', payload);
    if(!result.error){      
    snackbarStore.showMessage(result.message, 'success')
    getUsers(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
  } 
}

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('users.head.users'), href: '' },
  ]); 
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  getUsers(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
});

</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6 ">
      <h3 class="text-h3 text-center mb-0">{{$t('users.head.users')}}</h3>
    </div>
    <div class="d-flex justify-start align-start" >
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('compensationRequest.label.search')" max-width="300px">
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
            :label="$t('users.label.status')"
            :items="statuses"
            item-value="value"
            item-title="label"
            @update:modelValue="handleStatusFilter"
        ></v-select>
    </div>
    <v-card class="pt-1">
      <v-card-text>   
         <v-data-table :headers="headers" :items="users"  item-key="id" hide-default-footer>
         <!-- action column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-icons">
                 <v-btn v-if="!item.isActive" class="py-2" variant="outlined" @click="blockOrUnblockUser(item, true)">Unblock</v-btn>
                 <v-btn v-else color="primary" class="py-2" variant="flat" @click="blockOrUnblockUser(item, false)">Block</v-btn>
            </div>
          </template>
          <template v-slot:item.isActive="{ item }">
             <span class="d-flex text-capitalize" :style="{ color: item.isActive? DefaultTheme.colors.success : DefaultTheme.colors.error }">
                    {{item.isActive ? 'Active' : 'Blocked'}}
             </span>
            </template>
          </v-data-table> 
      </v-card-text>
    </v-card>
      <v-pagination
      v-if="usersCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(usersCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
</template>
<style lang="scss" scoped>
/* Make v-avatar a square */

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
