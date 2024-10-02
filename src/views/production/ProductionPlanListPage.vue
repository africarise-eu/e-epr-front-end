<script setup lang="ts">
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { DefaultTheme } from '@/theme/LightTheme';
import { computed, inject, onMounted, ref } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, PRODUCTION } from '@/composables/apiEndpoints';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {getStatusColor, STATUSENUM} from '@/composables/status';
import { EditOutlined,  EyeOutlined, PictureOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { useSnackbarStore } from '@/stores/snackbar';
import Popover from '@/components/shared/Popover.vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import type { CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
export interface ProductionPlanListDto{
    id: number,
    title: string,
    description: string,
    companyId: number,
    userId: number,
    planYear: number,
    previousYear: number,
    isDraft: boolean,
    status: string,
    createdAt: string,
    updatedAt: string
}

const {t} = useI18n();
const snackbarStore=useSnackbarStore();
const router = useRouter();
const productionPlanList= ref<ProductionPlanListDto[]>([])
const isLoading = ref(false);

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
const companiData=await fetchCompanyProfile(user.companyId);
const companyStatus = ref(companiData?.status);
if (companyStatus.value === null || companyStatus.value === '' || companyStatus.value === STATUSENUM.REJECTED) {
  isCompanyVerified.value=false;
}
isCompanyProfile.value = user.isProfileExist;

const headers = computed((): DataTableHeader[] => [
  { title: t('production.table.title'), key: 'title' },
  { title: t('production.table.description'), key: 'description' },
  { title: t('production.table.status'), key: 'status', sortable: false },
  { title: t('production.table.planYear'), key: 'planYear' },
  {title: t('production.table.previousYear'), key: 'previousYear'},
  { title: t('production.table.actions'), align: 'center', key: 'actions', sortable: false }
]);

const isApprovedProduct =(item: ProductionPlanListDto) => {
  return item.status === 'approved';
};

 const getProductionPlanList = async () => {
    isLoading.value = true;
    try{
        const {useAPI} = useApi();
        const result = await useAPI<{count:number, rows:ProductionPlanListDto[]}>(PRODUCTION.PRODUCTION_PLAN, 'GET');
        isLoading.value = false;
        if(!result.error){
            productionPlanList.value = result.data.rows;
            productionPlanList.value.forEach((item:ProductionPlanListDto)=>{
              item.description = result.data.rows[0].description??'-'
            })
        }
    }catch (error){
        isLoading.value = false;
        console.error(error);
    }
 }
 const editProduction=(item : ProductionPlanListDto)=>{
  router.push({ name: 'UpdateProductionPlan', params: { id: item.id.toString() } });
}
const deleteProduction = async(item : ProductionPlanListDto)=>{
  isLoading.value = true;
    try{
        const {useAPI} = useApi();
        await useAPI(PRODUCTION.PRODUCTION_PLAN+`/${item.id}`, 'Delete');
        snackbarStore.showMessage('Production plan deleted successfully', 'success');
        getProductionPlanList();
        isLoading.value = false;
    }catch (error){
        isLoading.value = false;
        console.error(error);
    }
}

const addProduction=()=>{
  router.push({ name: 'AddProductionPlan' });
}
const viewProduction=()=>{
  router.push({ name: 'ProductionPlan'});
}
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('production.head.productionPlan'), href: `/production` }
  ]);
    getProductionPlanList();
})
</script>

<template >
   <div v-if="isCompanyVerified">
    <div  class="d-flex justify-space-between align-center mb-6 pt-5">
        <h3 class="text-h3 text-center mb-0">{{$t('production.head.productionPlan')}}</h3>
        <div>
          <v-btn color="primary" :loading="isLoading" class="mr-2 mt-4" :to="{ name: 'ProductionTaeStatus' }">View TAE & Status</v-btn>
          <v-btn color="primary" :loading="isLoading" class="mt-4" @click="addProduction">Add Production</v-btn>
        </div>
      </div>
    <v-card >
        <v-data-table v-if="productionPlanList.length>0" :headers="headers" :items="productionPlanList"  item-key="id" hide-default-footer>
        <!-- action column -->
         <template v-slot:item.actions="{ item }">
           <div class="action-icons d-flex justify-center">
            <v-tooltip>
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                    <div :class="{'icon-container': true, 'center-icon': isApprovedProduct(item)}">
                      <EyeOutlined @click="viewProduction()" class="icon px-3"></EyeOutlined>
                    </div>
                 </span>
              </template>
              <span>{{t('common.view')}}</span>
            </v-tooltip>
            <v-tooltip>
              <template #activator="{ props }">
                <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                  <EditOutlined @click="editProduction(item)" v-if="!isApprovedProduct(item)" class="icon px-3"></EditOutlined>
                </span>
              </template>
              <span>{{t('common.edit')}}</span> 
            </v-tooltip>
            <v-tooltip>
                  <template #activator="{ props }">
                    <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                        <CloseOutlined @click="deleteProduction(item)" v-if="!isApprovedProduct(item)" class="icon px-3"></CloseOutlined>
                    </span>
                    </template>
                    <span>{{t('common.delete')}}</span> 
            </v-tooltip>
           </div>
         </template>
         <template v-slot:item.status="{ item }">
                       <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status) }">
                             {{ item.status }}
                             <span v-if="item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                               <Popover position="below" :key="item.id" :id="`status-${item.id}`">
                                 <template v-slot:activator>
                                   <InfoCircleOutlined />
                                 </template>
                                 <div>Internal article code is invalid</div>
                               </Popover>
                             </span>
                 </span>
         </template>
        </v-data-table>
        <div class="d-flex align-center flex-column pa-10" v-else>
            <div class="text-bold text-center">{{$t('production.other.noProductionAdded')}}</div>
            <v-btn color="primary" size="large" :loading="isLoading" class="mt-4 " @click="addProduction">Add Production</v-btn>
        </div>
    </v-card>
  </div>
  <div v-else>
    <v-list-item-title class="text-center py-8">{{$t('product.other.notVerified')}}</v-list-item-title>
  </div>
</template>

<style lang="scss" scoped>
.v-table{
  ::v-deep .v-table__wrapper table tbody tr td{
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
        
}
</style>
