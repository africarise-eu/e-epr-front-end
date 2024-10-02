<script setup lang="ts">
import ModalPopup from '@/components/shared/ModalPopup.vue';
import SelectProducts from '@/components/shared/SelectProducts.vue'
import type { DataTableHeader } from '@/composables/dataTableHeader';
import type productDto from '@/composables/product/product';
import { DefaultTheme } from '@/theme/LightTheme';
import { computed, defineEmits, defineProps, onMounted, ref, watch, type PropType } from 'vue';
import {CloseOutlined,  InfoCircleOutlined} from '@ant-design/icons-vue/lib/icons';
import { useSnackbarStore } from '@/stores/snackbar';
import { required } from 'joi';
import { productionDraftSchema, productionSchema } from '@/utils/validationRules';
import { useI18n } from 'vue-i18n';
import Popover from '@/components/shared/Popover.vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import {ROLE} from '@/composables/role';
import ConfirmationPopup, { type ConfirmationPopupProps } from '@/components/shared/ConfirmationPopup.vue';
import { useRouter } from 'vue-router';

export interface productionDto {
    isDraft: boolean,
    productionDetails: productionDetailDto[]
}
export interface productionDetailDto {
    productId: number,
    actualImageUrl: string,
    productName: string,
    internalArticleCode: string,
    status: string,
    plan: number,
    planStatus: string,
    actuals: number,
    actualsStatus: string
}
const props = defineProps<{
  productionDetail: productionDetailDto[],
  draftLoading:boolean,
  submitLoading:boolean
  title: string,
  isDraft:boolean
}>();
const router = useRouter();
const {t} = useI18n();
const snackbarStore=useSnackbarStore();
const showSelectProductModal = ref(false);
const confirmDialogData= ref<ConfirmationPopupProps>({
  title: 'Confirmation',
  message: 'Are you sure you want to proceed?',
  confirmButtonText: 'Confirm',
  cancelButtonText:'Cancel',
  show: false,
  type:"submit"
})
const selectedProducts = ref<any[]>([]);
const excludeProducts = ref<number[]>([]);
const production = ref([] as productionDetailDto[]);
const approvedProductions = ref([] as productionDetailDto[]);
const productionPlanSchema = productionSchema();
const productionPlanDraftSchema = productionDraftSchema();
const selectedRoleId = ref<number>(0);
production.value = props.productionDetail;
const emits = defineEmits(['submit', 'saveDraft']);
const currentYear= ref(new Date().getFullYear());
const isAllApproved=ref(false);
const headers = computed((): DataTableHeader[] => [
  { title: t('production.table.product'), key: 'productName' },
  { title: t('production.table.internalArticleCode'), key: 'internalArticleCode' },
  { title: t('production.table.status'), key: 'status', sortable: false },
  { title: t('production.table.plan', { year: currentYear.value }), key: 'plan' },
  { title: t('production.table.planStatus'), key: 'planStatus', sortable: false },
  { title: t('production.table.actuals', { year: currentYear.value - 1 }), key: 'actuals' },
  { title: t('production.table.actualsStatus'), key: 'actualsStatus', sortable: false },
  { title: t('production.table.actions'), align: 'center', key: 'actions', sortable: false },
]);


const handleSelectedProducts = (selectedProductItems: productDto[]) => {
    showSelectProductModal.value = false;
  const selectedProductIds = new Set(selectedProductItems.map(product => product.id));
  excludeProducts.value.forEach(id => selectedProductIds.add(id));

  selectedProductItems.forEach(product => {
    const exists = production.value.some((p: productionDetailDto) => p.productId === product.id);
    if (!exists) {
      const newItem = {
        productId: product.id,
        productName: product.productName,
        internalArticleCode: product.internalArticleCode,
        actualImageUrl: product.actualImageUrl,
        status: product.status,
        plan: 0,
        planStatus: 'pending',
        actuals: 0,
        actualsStatus: 'pending'
      };
      production.value.push(newItem);
    }
  });

  production.value.splice(0, production.value.length, ...production.value.filter((p: productionDetailDto) => selectedProductIds.has(p.productId)));
};
const deleteProduct = (product: productionDetailDto) => {
      const index = production.value.findIndex((p: productionDetailDto) => p.productId === product.productId);
      if (index !== -1) {
        production.value.splice(index, 1);
      }
}

const addProducts= () =>{
  selectedProducts.value = production.value.map((product: productionDetailDto) => product.productId);
  excludeProducts.value = production.value
    .filter((product: productionDetailDto) => 
      product.planStatus.toLowerCase() === STATUSENUM.APPROVED|| 
      product.actualsStatus.toLowerCase() === STATUSENUM.APPROVED
    )
    .map((product: productionDetailDto) => product.productId);
  showSelectProductModal.value = !showSelectProductModal.value;
}
const errors = ref<Record<number, Record<string, string[]>>>({});
const getErrorMessages = (index: number, field: string): string[] => {
  return errors.value[index]?.[field] || [];
};
const clearError = (index: number, field: string) => {
  if (errors.value[index]?.[field]) {
    errors.value[index][field] = [];
  }
}
const validateData = () => {
    let formattedProduction = production.value.map((product: productionDetailDto) => {
        return {
            plan: product.plan,
            actuals: product.actuals
        }
    })
  const { error } = productionPlanSchema.validate(formattedProduction, { abortEarly: false });
    errors.value = {};

  if (error) {
    error.details.forEach((detail: { path: any; message: any; }) => {
      const path = detail.path;
      const [index, field] = path;
      if (!errors.value[Number(index)]) {
        errors.value[Number(index)] = {};
      }
      if (!errors.value[Number(index)][field]) {
        errors.value[Number(index)][field] = [];
      }
      errors.value[Number(index)][field].push(detail.message);
    });
    return false;
  } else {
    errors.value={}
    return true;
  }
};
const validateDraftData = () => { 
    let formattedProduction = production.value.map((product: productionDetailDto) => {
        return {
            plan: product.plan,
            actuals: product.actuals
        }
    })
  const { error } = productionPlanDraftSchema.validate(formattedProduction, { abortEarly: false });
  if (error) {
    error.details.forEach((detail: { path: any; message: any; }) => {
      const path = detail.path;
      const [index, field] = path;
      if (!errors.value[Number(index)]) {
        errors.value[Number(index)] = {};
      }
      if (!errors.value[Number(index)][field]) {
        errors.value[Number(index)][field] = [];
      }
      errors.value[Number(index)][field].push(detail.message);
    }); 
    return false;
  } else {
    errors.value={}
    return true;
  }
};
const handleConfirm = () => {
  confirmDialogData.value.show = false;
  switch (confirmDialogData.value.type) {
    case 'submit':
      submitFOrApprovalConfirmed();
      break;
    case 'back':
      router.push({ name: 'ProductionPlan'});
      break;
    default:
      break;
  }
};

const handleCancel = () => {
  confirmDialogData.value.show = false;
  return;
};

const saveDraft = () => { 
    if(production.value.length == 0){
        snackbarStore.showMessage(t('production.error.addProductToSaveDraft'), 'error');
        return;
    }else if(!validateDraftData()){
        snackbarStore.showMessage(t('production.error.validValues'), 'error');
        return;
    }
  emits('submit', {isDraft:true,productionDetails:production.value});
};
const submitFOrApproval=()=>{

  const allApproved = production.value.every(product => 
    product.actualsStatus.toLowerCase() === STATUSENUM.APPROVED &&
    product.planStatus.toLowerCase() === STATUSENUM.APPROVED
  );

  if (allApproved) {
    // Show a message indicating that all products are already approved
    snackbarStore.showMessage(t('production.error.allProductsApproved'), 'info');
    return;
  }

    if(production.value.length == 0){
        snackbarStore.showMessage(t('production.error.addProductToSubmit'), 'error');
        return;
    }else if(!validateData()){
        snackbarStore.showMessage(t('production.error.validValues'), 'error');
        return;
    }
  confirmDialogData.value = {
    title: 'Submit For Approval',
    message: 'Are you sure you want to submit?',
    confirmButtonText: 'Confirm',
    cancelButtonText:'Cancel',
    show: true,
    type:"submit"
  }
}
const submitFOrApprovalConfirmed = () => {
    if(production.value.length == 0){
        snackbarStore.showMessage(t('production.error.addProductToSubmit'), 'error');
        return;
    }else if(!validateData()){
        snackbarStore.showMessage(t('production.error.validValues'), 'error');
        return;
    }
//   emits('submit', {isDraft:false,productionDetails:production.value});
  emits('submit', { isDraft: false, productionDetails: production.value });
};
const goBack = () => {
  confirmDialogData.value = {
    title: 'Back',
    message: 'You might lose any changes. Are you sure you want to go back?',
    confirmButtonText: 'Confirm',
    cancelButtonText:'Cancel',
    show: true,
    type:"back"
  }
}
onMounted(() => {
    const roleNameSelection = localStorage.getItem('user');
  if (roleNameSelection) {
    try {
      const user = JSON.parse(roleNameSelection);
      selectedRoleId.value = user.roleId;
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
})
watch(() => props.productionDetail, (newDetails: productionDetailDto[]) => {
  production.value = newDetails;
}, { immediate: true });
</script>

<template>
    <div class="d-sm-flex justify-sm-space-between align-center mb-6 pt-5">
        <h3 class="text-h3 text-start mb-xs-2 mb-sm-0">{{title}}</h3>
        <div class="d-flex justify-start">
          <v-btn class="mr-2 text-capitalize" variant="outlined" @click="goBack">{{ $t('common.back') }}</v-btn>
          <v-btn elevation="2" min-width="40px" color="primary" @click="addProducts" >{{$t('production.button.selectProduct')}}</v-btn>
        </div>
      </div>
    <v-card >
        <v-data-table v-if="production.length>0" :headers="headers" :items="production"  item-key="id" hide-default-footer>
        <!-- action column -->
         <template v-slot:item.actions="{ item }">
           <div  v-if="(item.planStatus.toLowerCase() === STATUSENUM.APPROVED || item.actualsStatus.toLowerCase() === STATUSENUM.APPROVED)"  class="action-icons">
           </div>
            <div v-else  class="action-icons">
              <v-tooltip>
                   <template #activator="{ props }">
                     <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                         <CloseOutlined @click="deleteProduct(item)" class="icon px-3"></CloseOutlined>
                      </span>
                     </template>
                     <span>{{ t('common.delete') }}</span>
              </v-tooltip>
           </div>
         </template>
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
                       <span class="d-flex text-capitalize" v-if="selectedRoleId === ROLE.VERIFIER">  
                           <v-btn color="success" size="small" class="mr-2" >Approve</v-btn>
                           <v-btn color="error" size="small" >Reject</v-btn>
                       </span>
                       <span class="text-capitalize d-flex" v-else :style="{ color: getStatusColor(item.status) }">
                             {{ t(`status.${item.status}`) }}
                       <!-- <v-tooltip > -->
                          <span v-if="item.status.toLowerCase() === 'rejected'" class="ml-2">
                            <Popover position="below" :key="item.productId" :id="`status-${item.productId}`">
                              <template v-slot:activator>
                                <InfoCircleOutlined />
                              </template>
                              <div>Internal article code is invalid</div>
                            </Popover>
                          </span>
                 </span>
         </template>
         <template v-slot:item.planStatus="{ item }">
                       <span class="text-capitalize" v-if="selectedRoleId === ROLE.VERIFIER">  
                           <v-btn color="success" size="small" class="mr-2" >Approve</v-btn>
                           <v-btn color="error" size="small" >Reject</v-btn>
                       </span>
                       <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.planStatus) }">
                              {{ t(`status.${item.planStatus}`) }}
                             <span v-if="item.planStatus.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                               <Popover position="below" :key="item.productId" :id="`planStatus-${item.productId}`">
                                 <template v-slot:activator>
                                   <InfoCircleOutlined />
                                 </template>
                                 <div>Plan provided is not feasible</div>
                               </Popover>
                             </span>
                 </span>
         </template>
         <template v-slot:item.actualsStatus="{ item }">
                       <span class="text-capitalize" v-if="selectedRoleId === ROLE.VERIFIER">  
                           <v-btn color="success" size="small" class="mr-2" >Approve</v-btn>
                           <v-btn color="error" size="small" >Reject</v-btn>
                       </span>
                       <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.actualsStatus) }">
                              {{ t(`status.${item.actualsStatus}`) }}
                             <span v-if="item.actualsStatus.toLowerCase() === 'rejected'" class="ml-2">
                               <Popover position="below" :key="item.productId" :id="`actualStatus-${item.productId}`">
                                 <template v-slot:activator>
                                   <InfoCircleOutlined />
                                 </template>
                                 <div>Actual production provided seems to be wrong</div>
                               </Popover>
                             </span>
                 </span>
         </template>
         <template v-slot:item.plan="{ item, index }">
            <v-text-field
              v-model="item.plan"
               variant="outlined"
                type="number"    
                dense
                hide-details
                :min="0"
               :error-messages="getErrorMessages(index, 'plan')"
               @input="clearError(index, 'plan')"
               :disabled="item.planStatus === STATUSENUM.APPROVED"
               style="width: 150px;"
            ></v-text-field>
          </template>
          <template v-slot:item.actuals="{ item, index }">
             <v-text-field
               v-model="item.actuals"
               variant="outlined"
               dense
                type="number"  
                :min="0"  
               hide-details
                :error-messages="getErrorMessages(index, 'actuals')"
               @input="clearError(index, 'actuals')"
               :disabled="item.actualsStatus === STATUSENUM.APPROVED"
               style="width: 150px;"
             ></v-text-field>
           </template>
        </v-data-table>
        <div class="d-flex align-center flex-column pa-10" v-else>
            <div class="text-bold text-center">{{$t('production.other.noProductSelected')}}</div>
            <v-btn elevation="2" color="primary" @click="addProducts" size="large" class="mt-5">{{$t('production.button.selectProduct')}}</v-btn>
        </div>
    </v-card>
    <div class="d-flex flex-sm-row-reverse mt-8">
        <v-btn color="primary" :loading="submitLoading" :disabled="draftLoading" @click="submitFOrApproval">{{$t('production.button.submitForApproval')}}</v-btn>
        <v-btn variant="outlined" v-if="isDraft" :loading="draftLoading" :disabled="submitLoading" class="mr-4" @click="saveDraft">{{$t('production.button.saveDraft')}}</v-btn>
    </div>
  
<ModalPopup v-model="showSelectProductModal" max-width="60%" :title="$t('production.head.selectProducts')">
    <SelectProducts :excludeProducts="excludeProducts" :selectedProducts = selectedProducts :handle-selected-products="handleSelectedProducts" :isProduction="true"></SelectProducts>
</ModalPopup>
<!-- ConfirmationDialog Component -->
<ConfirmationPopup
v-model:show="confirmDialogData.show"
:title="confirmDialogData.title"
:message="confirmDialogData.message"
:confirmButtonText="confirmDialogData.confirmButtonText"
:cancelButtonText="confirmDialogData.cancelButtonText"
@confirm="handleConfirm"
@cancel="handleCancel"
/>
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
