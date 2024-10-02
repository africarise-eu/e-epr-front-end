<script setup lang="ts">
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { DefaultTheme } from '@/theme/LightTheme';
import { computed, inject, onMounted, ref } from 'vue';
import {CloseOutlined,  InfoCircleOutlined, PictureOutlined} from '@ant-design/icons-vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE, PRODUCTION, VERIFIER } from '@/composables/apiEndpoints';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import RejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import Popover from '@/components/shared/Popover.vue';
import {ROLE} from '@/composables/role';
import {STATUSENUM} from '@/composables/status';
import ConfirmationPopup, { type ConfirmationPopupProps } from '@/components/shared/ConfirmationPopup.vue';
import type { productionDetailPreviousDto, ProductionResponseDto } from '@/views/production/ViewProductionPlan.vue';
import { useI18n } from 'vue-i18n';
import { getStatusColor } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';

const { t } = useI18n();
const snackbarStore = useSnackbarStore();
const selectedRole = ref<string>('');
const router = useRouter();
const confirmDialogData= ref<ConfirmationPopupProps>({
  title: 'Confirmation',
  message: 'Are you sure you want to proceed?',
  confirmButtonText: 'Confirm',
  cancelButtonText:'Cancel',
  show: false,
  type:"submit"
})
const production = ref<ProductionResponseDto>();
const productionProductList = ref<productionDetailPreviousDto[]>([]);
const isLoading = ref(false);
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear.toString());
const isCompanyProfile = ref(false);
const user =  JSON.parse(localStorage.getItem('user')!);
const route = useRoute();
const productionId:string = route.params.id as string;
const selectedCompanyName = ref<string>('');
isCompanyProfile.value = user.isProfileExist;
const rejectReasonModelValue = ref<{type:string, item:any, name:string}>({
    type: 'plan',
    item: {},
    name: ''
})

const headers = ref<DataTableHeader[]>( [
  { title: 'Product', key: 'productName' },
  { title: 'Article No.', key: 'internalArticleCode' },
  { title: 'Product Status', key: 'status', sortable: false },
  { title: `Plan ${selectedYear.value}`, key: 'plan' },
  {title: 'Plan Status', key: 'planStatus', sortable: false, align: 'center'},
  { title: `Actuals ${Number(selectedYear.value) - 1}`, key: 'actuals' },
  {title: 'Actual Status', key: 'actualsStatus', sortable: false, align: 'center'},
]);
const getAll = async (id:string) => {
  try {
    const { useAPI } = useApi();

    const result = await useAPI<ProductionResponseDto>(VERIFIER.PRODUCTION_DETAIL+`/${id}`, 'GET');

   if (result && result.data) {
        production.value = result.data;
        productionProductList.value = [];
        result.data.productionProduct.map(async (item: any)=>{
            let imageUrl = '';
            if(item.product.image){
                const image = await useAPI(FILE.GET_FILE, 'GET',undefined, {path: item.product.image});
                if(!image.error){
                    imageUrl = (image.data??'') as string;
                }
            }
            productionProductList.value.push({
                productId: item.productId,
                actualImageUrl: imageUrl,
                productName: item.product.productName,
                productStatusReason: item.product.rejectedReason,
                internalArticleCode: item.product.internalArticleCode,
                status: item.product.status,
                plan: item.plan,
                planStatus: item.planVerification,
                actuals: item.actual,
                actualsStatus: item.actualStatus,
                actualsStatusReason: item.actualRejectedReason,
                planStatusReason: item.planRejectReason,
                previousYearPlan: item.previousYearPlan
            })
        })
    }else{
        productionProductList.value = [];
    }
  } catch (error) {
    console.error('Failed to get tae status:', error);
  } 
};

const handleConfirm = () => {
  confirmDialogData.value.show = false;
  switch (confirmDialogData.value.type) {
    case 'back':
      router.push({ name: 'VerifyProductionPlanList'});
      break;
    default:
      break;
  }
};
const handleCancel = () => {
  confirmDialogData.value.show = false;
  return;
};

const showStatusReason=ref(false);
const changeActualStatus = async (item:productionDetailPreviousDto, status:string) => {
    switch(status){
        case STATUSENUM.APPROVED:
            submitActualStatus(item, status);
        break;
        case STATUSENUM.REJECTED:
            rejectReasonModelValue.value ={
                item: item,
                type: 'actual',
                name: 'Actual '+item.productName
            }
            showStatusReason.value = !showStatusReason.value
        break;
        default:
            break;
    }
}
const changePlanStatus = async (item:productionDetailPreviousDto, status:string) => {
    switch(status){
        case STATUSENUM.APPROVED:
            submitPlanStatus(item,status);
        break;
        case STATUSENUM.REJECTED:
            rejectReasonModelValue.value ={
                item: item,
                type: 'plan',
                name: 'Plan '+item.productName
            }
            showStatusReason.value = !showStatusReason.value
        break;
        default:
            break;
    }
}
const submitRejectReason = (value:{reason:string}) => {
    if(value.reason){
        showStatusReason.value = !showStatusReason.value
        switch (rejectReasonModelValue.value.type) {
            case 'plan':
                submitPlanStatus(rejectReasonModelValue.value.item, STATUSENUM.REJECTED, value.reason);
            break;
            case 'actual':
                submitActualStatus(rejectReasonModelValue.value.item, STATUSENUM.REJECTED, value.reason);
            break;
            default:
                break;
        }
    }
}
const submitPlanStatus = async (item:productionDetailPreviousDto, status:string, rejectedReason?:string) => {
    let payload={
        planVerification: status,
        companyId: selectedCompany.value,
        productId: item.productId,
        planRejectReason: rejectedReason,
    }
    const { useAPI } = useApi();
    const result  = await useAPI(VERIFIER.PRODUCTION, 'PATCH', payload);
    if(!result.error){
        snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
        getAll(productionId);
    }
}
const submitActualStatus = async (item:productionDetailPreviousDto, status:string, rejectedReason?:string) => {
    let payload={
        companyId: selectedCompany.value,
        actualStatus: status,
        productId: item.productId,
        actualRejectedReason: rejectedReason
    }
    const { useAPI } = useApi();
    const result  = await useAPI(VERIFIER.PRODUCTION, 'PATCH', payload);
    if(!result.error){
        snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
        getAll(productionId);
    }
}
const changeStatus = async (item:productionDetailPreviousDto) => {
    router.push({path: `/verify/products/${item.productId}`})
}
const companyDropdownList = ref<companyListDropdownDto[]>([]);
const getCompanyList = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<{count: number, rows: companyListResponseDto[]}>(COMPANY.LIST_COMPANY, 'GET');
  if(!result.error){
    companyDropdownList.value= result.data.rows.map((company)=>{return {id:company.id, name: company.companyName}})
  }

}
const selectCompany = (selectedId?: number)=>{
    const id = selectedId ? selectedId : selectedCompany.value;
    let selected = companyDropdownList.value.find((item: companyListDropdownDto)=>item.id === id);
    if(selected){
        selectedCompanyName.value = selected.name;
        getAll(productionId);
        updateBreadcrumb?.([
            { title: '', href: '' },
            { title: 'Production Plan', href: `/verify/productionplan/${route.params.companyId}` },
            { title: selectedCompanyName.value, href: `/verify/productionplan/${route.params.companyId}/${productionId}` },
        ]);
    }
}
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
const selectedCompany = ref<number>();
onMounted(async () => {
    updateBreadcrumb?.([
        { title: '', href: '' },
        { title: 'Production Plan', href: `/verify/productionplan/:${route.params.companyId}` },
    ]);
  await getCompanyList();
  if(route.params.companyId){
    selectedCompany.value = Number(route.params.companyId);
    selectCompany(selectedCompany.value)
;  }
  const roleSelection = localStorage.getItem('user');
  if (roleSelection) {
    try {
      const user = JSON.parse(roleSelection);
      selectedRole.value = user.roleId;
      if(Number(selectedRole.value) !== ROLE.VERIFIER){
        router.push({name: 'Dashboard'})
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
});
</script>

<template>
<div>
    <div class="d-sm-flex justify-space-between align-center mb-6 pt-5">
        <h3 class="text-h3 text-start mb-xs-2 mb-sm-0">{{$t('production.head.productionPlan')}}</h3>
    </div>
    <v-card >
        <v-data-table v-if="isCompanyProfile&&production&&productionProductList.length>0" :headers="headers" :items="productionProductList"  item-key="id" hide-default-footer>
        <!-- action column -->
         <template v-slot:item.productName="{ item }">
                 <div class="d-flex align-center">
                   <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
                     <img v-if="item.actualImageUrl" :src="item.actualImageUrl" alt="Product Image">
                      <PictureOutlined v-else class="icon-avatar-size" > </PictureOutlined>
                   </v-avatar>
                   <span>{{ item.productName }}</span>
                 </div>
         </template>
         <template v-slot:item.status="{ item }">
            <span v-if="item.status?.toLowerCase()===STATUSENUM.PENDING && user.roleId === ROLE.VERIFIER" class="d-flex justify-center py-3">
                <v-btn :color="'#52C41A'" size="small" class="d-flex pt-1 text-capitalize" rounded="pill" @click="changeStatus(item)">Verify</v-btn>
            </span>
            <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.status) }">
                {{ item.status }}
                <span v-if="item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                <Popover position="below" id="status">
                    <template v-slot:activator>
                    <InfoCircleOutlined />
                    </template>
                    <div>{{item.productStatusReason}}</div>
                </Popover>
                </span>
            </span>
         </template>
         <template v-slot:item.planStatus="{ item }">
            <span v-if="item.planStatus?.toLowerCase()===STATUSENUM.PENDING && user.roleId === ROLE.VERIFIER" class="d-flex justify-center py-3">
                <v-btn :color="'#52C41A'" size="small" class="d-flex pt-1 text-capitalize" rounded="pill" @click="changePlanStatus(item, STATUSENUM.APPROVED)">Accept</v-btn>
                <v-btn :color="'#ff4d4f'" size="small" class="text-capitalize ml-2" rounded="pill" @click="changePlanStatus(item, STATUSENUM.REJECTED)">Reject</v-btn>
            </span>
            <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.planStatus) }">
                {{ item.planStatus }}
                <span v-if="item.planStatus.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                <Popover position="below" id="planStatus">
                    <template v-slot:activator>
                    <InfoCircleOutlined />
                    </template>
                    <div>{{item.planStatusReason}}</div>
                </Popover>
                </span>
            </span>
         </template>
         <template v-slot:item.actualsStatus="{ item }">
            <span v-if="item.actualsStatus?.toLowerCase()===STATUSENUM.PENDING && user.roleId === ROLE.VERIFIER" class="d-flex justify-center py-3">
                <v-btn :color="'#52C41A'" size="small" class="d-flex pt-1 text-capitalize" rounded="pill" @click="changeActualStatus(item, STATUSENUM.APPROVED)">Accept</v-btn>
                <v-btn :color="'#ff4d4f'" size="small" class="text-capitalize ml-2" rounded="pill" @click="changeActualStatus(item, STATUSENUM.REJECTED)">Reject</v-btn>
            </span>
            <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.actualsStatus) }">
                {{ item.actualsStatus }}
                <span v-if="item.actualsStatus.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                <Popover position="below" id="actualsStatus">
                    <template v-slot:activator>
                    <InfoCircleOutlined />
                    </template>
                    <div>{{item.actualsStatusReason}}</div>
                </Popover>
                </span>
            </span>
         </template>
        </v-data-table>
    </v-card>
</div>
<ConfirmationPopup
v-model:show="confirmDialogData.show"
:title="confirmDialogData.title"
:message="confirmDialogData.message"
:confirmButtonText="confirmDialogData.confirmButtonText"
:cancelButtonText="confirmDialogData.cancelButtonText"
@confirm="handleConfirm"
@cancel="handleCancel"
/>
<ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')">
  <RejectReasonForm @submit="submitRejectReason"/>
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
