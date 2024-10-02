<script setup lang="ts">
import type productDto from '@/composables/product/product';
import { mapApiResponseToProductDto, initializedProduct } from '@/composables/product/product';
import { onMounted, ref, computed, inject  } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, PRODUCT, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRoute } from 'vue-router';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import { PictureOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';
import Popover from '@/components/shared/Popover.vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import type { companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import RejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import LogHistory from '@/components/shared/LogHistory.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import type packingMaterialDto from '@/composables/product/packingMaterial';
import { useSnackbarStore } from '@/stores/snackbar';

const route = useRoute();

const {t} = useI18n();
const productId =  ref(route.params.id);
const showHistory = ref(false);
const companyId = ref(route.params.companyId);
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
const user =  JSON.parse(localStorage.getItem('user')!);
const snackbarStore = useSnackbarStore();
const rejectReasonModelValue = ref<{type:string, item:any, name:string}>({
    type: 'product',
    item: {},
    name: ''
})
const companyName = ref('')
const headers = computed<DataTableHeader[]>(() => [
  { title:  t('packingMaterial.table.material'), align: 'start', sortable: false, key: 'material' },
  { title:  t('packingMaterial.table.weight'), align: 'end', key: 'weight', sortable: false, },
  { title: t('packingMaterial.table.TAE_KG'), align: 'start', key: 'TAE_KG', sortable: false, },
  { title: t('packingMaterial.table.TAE_Total'), align: 'start', key: 'TAE_Total', sortable: false, },
  { title: t('packingMaterial.table.verification'), align: 'center', key: 'verification', sortable: false }
]);
const product = initializedProduct;
const fetchCompany = async () => {
    try {
    const { useAPI } = useApi();
        const companyList = await useAPI<{count: number, rows: companyListResponseDto[]}>(COMPANY.LIST_COMPANY, 'GET');
        if(!companyList.error){
            const companyListFormatted= companyList.data.rows.map((company)=>{return {id:company.id, name: company.companyName}})
            companyName.value = companyListFormatted.find((company)=>{return company.id == Number(companyId.value)})?.name || '';
        }
  } catch (error) {
    console.error( t('verifier.error.failedToFetchCompany'), error);
  } 
}
const fetchById = async () => {
  try {
    const { useAPI } = useApi();
    const result  = await useAPI<productDto>(`${PRODUCT.GETBYID}/${productId.value}`, 'GET');
    Object.assign(product, mapApiResponseToProductDto(result.data));
    if(companyId.value){
        updateBreadcrumb?.([
            { title: '', href: '' },
            { title: 'Companies', href: '/companies' },
            { title: companyName.value, href: `/companies/${companyId.value}` },
            { title: 'Products', href: `/companies/${companyId.value}/product` },
            { title: result.data.productName, href: `/companies/${companyId.value}/product/${productId.value}` },
        ]);
    }else{
        updateBreadcrumb?.([
            { title: '', href: '' },
            { title: 'Products', href: `/verify/products` },
            { title: result.data.productName, href: `/verify/products/${productId.value}` },
        ]);
    }
  } catch (error) {
    console.error( ('product.error.failedGetByProductId'), error);
  } 
};

const formattedProductData = computed(() => {
  return {
    productName: { label: t('product.label.productName'), value: product.productName },
    productCategory: { label: t('product.label.productCategory'), value: product.productCategory },
    production: { label: t('product.label.production'), value: product.production },
    manufacturerCompany: { label: t('product.label.manufacturerCompany'), value: product.manufacturerCompany },
    countryOfManufacture: { label: t('product.label.countryOfManufacture'), value: product.countries.name },
    brandName: { label: t('product.label.brandName'), value: product.brandName },
    productModelTypeVolume: { label: t('product.label.productModelTypeVolume'), value: product.productModelTypeVolume },
    barcode: { label: t('product.label.barcode'), value: product.barcode },
    internalArticleCode: { label: t('product.label.internalArticleCode'), value: product.internalArticleCode },
    packingMaterials: {
      label: t('product.label.packingMaterials'),
      value: product.packingMaterials.map(pm => pm.material).join(', ')
    },
    status: { label: t('product.label.status'), value: product.status },
  };
});

const totalWeight = computed(() => {
  const sum = product.packingMaterials.reduce((total: any, material: any) => total + material.weight, 0);
  return  parseFloat(sum.toFixed(2))
});

const totalTAE_KG = computed(() => {
  const sum = product.packingMaterials.reduce((total: any, material: any) => total + material.TAE_KG, 0);
  return  parseFloat(sum.toFixed(2))
});

const totalTAE_Total = computed(() => {
  const sum = product.packingMaterials.reduce((total: any, material: any) => total + material.TAE_Total, 0);
  return  parseFloat(sum.toFixed(2))
});

const showStatusReason=ref(false);

const changeStatus = async (status:string) => {
    switch(status){
        case STATUSENUM.APPROVED:
            submitChangeStatus(status);
        break;
        case STATUSENUM.REJECTED:
            rejectReasonModelValue.value ={
                item: product,
                type: 'product',
                name: product.productName
            }
            showStatusReason.value = !showStatusReason.value
        break;
        default:
            break;
    }
}
const changeMaterialStatus = async (item:packingMaterialDto, status:string) => {
    switch(status){
        case STATUSENUM.APPROVED:
        submitMaterialStatus(item, status);
        break;
        case STATUSENUM.REJECTED:
            rejectReasonModelValue.value ={
                item: item,
                type: 'material',
                name: item.material
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
            case 'product':
                submitChangeStatus(STATUSENUM.REJECTED, value.reason);
            break;
            case 'material':
                submitMaterialStatus(rejectReasonModelValue.value.item, STATUSENUM.REJECTED, value.reason);
            break;
            default:
                break;
        }
        // submitChangeStatus(STATUSENUM.REJECTED, value.reason);
    }
}
const submitChangeStatus = async (status:string, rejectedReason?:string) => {
    let payload={
        status,
        rejectedReason,
        id: route.params.id
    }
    const { useAPI } = useApi();
    const result  = await useAPI(VERIFIER.PRODUCT_LIST, 'PATCH', payload);
    if(!result.error){
        snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
        fetchById();
    }
}
const submitMaterialStatus = async (item:packingMaterialDto, status:string, rejectedReason?:string) => {
    let payload={
        status,
        rejectedReason,
        id: item.id
    }
    const { useAPI } = useApi();
    const result  = await useAPI(VERIFIER.MATERIAL, 'PATCH', payload);
    if(!result.error){
        snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
        fetchById();
    }
}
onMounted(async() => {
    if(companyId.value){
        await fetchCompany();
    }
  fetchById();
});

</script>

<template>
  <div class="d-flex justify-space-between align-center mb-6 pt-5">
    <h3 class="text-h3 text-center mb-0">{{ $t('product.head.viewProduct') }}</h3>
    <div>
    <v-btn class="mt-5 mr-2 text-capitalize"  variant="outlined" :to="`/verify/products`" >
        {{$t('common.back')}}</v-btn></div>
  </div>
  <v-card class="pt-1">
    <v-card-text>
         <v-row>            
        <v-col cols="6" sm="4" md="4" lg="3">
          <v-img v-if="product.actualImageUrl" :src="product.actualImageUrl"  class="icon-size"></v-img>
          <PictureOutlined v-else class="icon-size" style="color: grey;"> </PictureOutlined>
        </v-col>
        <v-col cols="12" sm="8" md="8" lg="9">
      <v-list>
        <v-list-item class="d-grid " v-for="(value, key) in formattedProductData" :key="key">
          <v-row class="pb-8">
            <v-col cols="12" sm="12" md="4" lg="4" class="pb-0 pt-2">
              <v-list-item-content>
                <v-list-item-title v-if="value.label===t('company.label.status') && value.value?.toLowerCase() === STATUSENUM.REJECTED" class="pt-1 font-weight-bold">{{ value.label }}</v-list-item-title>
                <v-list-item-title v-else-if="value.label===t('company.label.status') && value.value?.toLowerCase() === STATUSENUM.PENDING" class="font-weight-bold py-3">{{ value.label }}</v-list-item-title>
                <v-list-item-title v-else class="font-weight-bold">{{ value.label }}</v-list-item-title>
              </v-list-item-content>
            </v-col>
            <v-col cols="12" sm="12" md="8" lg="8" class="py-0 pt-2">
              <v-list-item-content class="align-end">
                <v-list-item-title v-if="value.label===t('company.label.status')">
                  
              <div class="d-flex ">
                    <span v-if="(value.value?.toLowerCase()===STATUSENUM.PENDING || value.value?.toLowerCase()===STATUSENUM.IMPROVED) && user.roleId === ROLE.VERIFIER" class="d-flex py-3">
                        <a-button :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }" @click="changeStatus(STATUSENUM.APPROVED)">{{ t('verifier.button.approve') }}</a-button>
                        <a-button :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545',marginLeft: '5px' }" @click="changeStatus(STATUSENUM.REJECTED)">{{ t('verifier.button.reject') }}</a-button>
                    </span>
                    <span v-else class="pt-1 d-flex text-capitalize" :style="{ color: getStatusColor(value.value?value.value?.toString()??'':'') }">{{ t(`status.${value.value}`) }}

                    </span>
                     <span style="display: flex; align-items: center; justify-content: center;">
                        <v-tooltip>
                            <template #activator="{ props }">
                              <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                <div class="ml-2 mt-1 icon">
                                   <InfoCircleOutlined @click="showHistory = !showHistory"  />
                                </div>
                              </span>
                            </template>
                             <span> {{ t('logHistory.buttnText') }}</span>
                       </v-tooltip> 
                     </span>
              </div>
                </v-list-item-title>
                 <v-list-item-title v-else-if="value.label === 'Photo'">
                  <v-img :src="value.value.toString()" max-width="400" max-height="400"></v-img>
                </v-list-item-title>
                <v-list-item-title v-else class="text-capitalize">{{ value.value }}</v-list-item-title>
              </v-list-item-content>
            </v-col>
          </v-row>
        </v-list-item>
      </v-list>
    </v-col>
    </v-row>
      <v-row>
        <v-col>
             <h4 class="font-weight-bold">{{ t('product.label.packingMaterials') }}</h4>
         <v-data-table :headers="headers" :items="product.packingMaterials" density="compact" item-key="id" hide-default-footer>
          <template v-slot:item.material="{ item }">
              {{ t(`common.packagingMaterial.${item.material}`) }}
          </template>
            <!-- Custom Summary Row -->
            <template v-slot:item.verification="{ item }">
              <div class="d-flex justify-center">
                <span v-if="(item.verification?.toLowerCase()===STATUSENUM.PENDING || item.verification?.toLowerCase()===STATUSENUM.IMPROVED)  && user.roleId === ROLE.VERIFIER" class="d-flex justify-center py-3">
                    <a-button :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }" @click="changeMaterialStatus(item,STATUSENUM.APPROVED)">{{ t('verifier.button.approve') }}</a-button>
                    <a-button :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545' , marginLeft: '5px' }" @click="changeMaterialStatus(item,STATUSENUM.REJECTED)">{{ t('verifier.button.reject') }}</a-button>
                </span>
                <span v-else class=" justify-center text-capitalize" :style="{ color: getStatusColor(item.verification?item.verification?.toString()??'':'') }"> {{ t(`status.${item.verification}`) }}

                </span>
                <span style="display: flex; align-items: center; justify-content: center;">
                <v-tooltip>
                            <template #activator="{ props }">
                              <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                <div class="ml-2 icon">
                                   <InfoCircleOutlined @click="showHistory = !showHistory"  />
                                </div>
                              </span>
                            </template>
                             <span> {{ t('logHistory.buttnText') }}</span>
                </v-tooltip> 
                </span>
              </div>
            </template>
            <template v-if="product.packingMaterials.length > 0" v-slot:body.append>
                <tr>
                    <td class="text-right font-weight-black">{{t('packingMaterial.table.total')}}</td>
                    <td class="text-right font-weight-bold">{{ totalWeight }}</td>
                    <td class="text-left font-weight-bold">{{ totalTAE_KG }}</td>
                    <td class="text-left font-weight-bold">{{ totalTAE_Total }}</td>
                    <!-- Add other summary cells as needed -->
                </tr>
            </template>
        </v-data-table>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')+' '+rejectReasonModelValue.name">
    <RejectReasonForm @submit="submitRejectReason"/>
  </ModalPopup>
   <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="product.id" :objectTypeId="OBJECTTYPE.PRODUCT" />
  </ModalPopup>
</template>
<style scoped>
.font-weight-black {
  font-weight: 900;
}

.icon-size {
  font-size: 300px; 
  width: 400px;  /* Set the width to match v-img max-width */
  height: 400px; /* Set the height to match v-img max-height */
}
/* Hover effect for the icon */
.icon:hover {
  color: blue; /* Hover color */
}
</style>
