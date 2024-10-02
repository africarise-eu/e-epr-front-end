<script setup lang="ts">
import { onMounted, computed, ref, type Ref} from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { type CompanyProfileFormProps, type CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import Popover from '@/components/shared/Popover.vue';
import {InfoCircleOutlined, PictureOutlined} from '@ant-design/icons-vue';
import { DefaultTheme } from '@/theme/LightTheme';
import { Status, STATUSENUM } from '@/composables/status';
import RejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { ROLE } from '@/composables/role';
import { getStatusColor } from '@/composables/status';
import { useSnackbarStore } from '@/stores/snackbar';
import type { CompanyDetailDto } from '@/views/company/ViewCompanyProfilePage.vue';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

const router=useRouter();
const route = useRoute();
const isSubmitting = ref(false);
const {t} = useI18n();
const snackbarStore = useSnackbarStore();
const isCompanyAdded = ref(false);
const companyVerifiedStatus = ref('');
const imageUrl: Ref<string> = ref(avatar);
const user =  JSON.parse(localStorage.getItem('user')!);
const showHistory = ref(false);
const logId = ref(0);
const companyId = route.params.id;
const regForm:Ref<CompanyDetailDto>= ref({
    companyName: '',
      type:[],
      registrationNumber:'',
      activityCode:'',
      address:'',
      city:{id:0, name:''},
      country:{id:1, name:'Mozambique'},
      companyPhoneNumber:'',
      website:'',
      bankAccount:'',
      isImageUpload:false,
      imagePath:'',
      logo: '',
      rejectedReason:''
});
const fetchCompanyProfile = async () => {
  isSubmitting.value = true;
  try {
    const { useAPI } = useApi();
    const result  = await useAPI<CompanyProfileResponseProps>(VERIFIER.COMPANY_LIST+`/${route.params.id}`, 'GET');
    isSubmitting.value=false;
    if(!result.error){
      if (result.data) {
        const user =  localStorage.getItem('user');
          let userJson = JSON.parse(user!);
          userJson.isProfileExist = true;
          userJson.isProfileVerified = result.data.status==="approved";
          localStorage.setItem('user', JSON.stringify(userJson));
        companyVerifiedStatus.value = result.data.status;
        isCompanyAdded.value = true;
        regForm.value.companyName = result.data.companyName ?? '';
        regForm.value.registrationNumber = result.data.registrationNumber??'';
        regForm.value.activityCode = result.data.activityCode??0;
        regForm.value.address = result.data.address??'';
        regForm.value.city = result.data.cities??{id:0, name:''};
        regForm.value.companyPhoneNumber = result.data.phoneNumber??'';
        regForm.value.website = result.data.website??'';
        regForm.value.bankAccount = result.data.bankAccount??'';
        regForm.value.type=[]
        result.data.isImporter? regForm.value.type.push('Importer'): null
        result.data.isProducer? regForm.value.type.push('Producer'): null
        regForm.value.rejectedReason = result.data.rejectedReason??'';
        if(result.data.logo){
          const image = await useAPI(FILE.GET_FILE, 'GET',undefined, {path: result.data.logo});
          if(!image.error){
            regForm.value.logo = (image.data??'') as string;
            imageUrl.value = (image.data??'') as string;
          }
        }
      }else{
        isCompanyAdded.value = false;
      }
    }
  } catch (error) {
    console.error( t('company.error.failedToFetch'), error);
    isSubmitting.value = false;
  } finally {
    isSubmitting.value = false;
  }
};
const formattedCompanyData = computed(() => {
  return {
    companyName: { key: 'companyName',label: t('company.label.companyName'), value: regForm.value.companyName },
    type: {key: 'type', label: t('company.label.type'), value: regForm.value.type.join(', ') },
    registrationNumber: {key: 'registrationNumber', label: t('company.label.registrationNumber'), value: regForm.value.registrationNumber },
    activityCode: {key: 'registrationNumber', label: t('company.label.activityCode'), value: regForm.value.activityCode },
    address: {key: 'address', label: t('company.label.address'), value: regForm.value.address },
    city: {key: 'city', label: t('company.label.city'), value: regForm.value.city.name??'-' },
    phoneNumber: { key: 'phoneNumber',label: t('company.label.companyPhoneNumber'), value: regForm.value.companyPhoneNumber },
    bankAccount: {key: 'bankAccount', label: t('company.label.bankAccount'), value: regForm.value.bankAccount },
    website: {key: 'website', label: t('company.label.website'), value: regForm.value.website },
    status: {key: 'status',label: t('company.label.status'), value: companyVerifiedStatus.value},
  };
});
const absoluteUrl = computed(() => {
  if (regForm.value.website.startsWith('http://') || regForm.value.website.startsWith('https://')) {
    return regForm.value.website
  }
  return `https://${regForm.value.website}`
})
const showStatusReason=ref(false);
const changeStatus = async (status:string) => {
    switch(status){
        case STATUSENUM.APPROVED:
            submitChangeStatus(status);
        break;
        case STATUSENUM.REJECTED:
            showStatusReason.value = !showStatusReason.value
        break;
        default:
            break;
    }
}
const submitRejectReason = (value:{reason:string}) => {
    if(value.reason){
        showStatusReason.value = !showStatusReason.value
        submitChangeStatus(STATUSENUM.REJECTED, value.reason);
    }
}
const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}
const submitChangeStatus = async (status:string, rejectedReason?:string) => {
    let payload={
        status,
        rejectedReason,
        id: route.params.id
    }
    const { useAPI } = useApi();
    const result  = await useAPI<CompanyProfileResponseProps>(VERIFIER.COMPANY_LIST, 'PATCH', payload);
    if(!result.error){
        snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
        fetchCompanyProfile();
    }
}
const showProducts = () => {
  router.push({path: `/companies/${route.params.id}/product`})
}

onMounted(() => {
  fetchCompanyProfile();
});



</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 pt-5">
      <h3 class="text-h3 text-center mb-0">{{$t('verifier.head.company')}}</h3>
      <div>
      <v-btn class="text-capitalize mr-2"  :to="'/companies'" >{{ $t('common.back') }}</v-btn>
      <v-btn class="text-capitalize" color="primary" @click="showProducts">{{$t('verifier.button.showProducts')}}</v-btn>
      </div>
    </div>
    
  <v-card class="pt-1" v-if="isCompanyAdded">
    <v-card-text>
      <v-row>            
        <v-col cols="6" sm="4" md="4" lg="3">
          <v-img v-if="imageUrl" :src="imageUrl"  class="icon-size"></v-img>
          <PictureOutlined v-else class="icon-size" style="color: grey;"> </PictureOutlined>
        </v-col>
        <v-col cols="12" sm="8" md="8" lg="9">
          <v-list>
            <v-list-item class="d-grid " v-for="(value, key) in formattedCompanyData" :key="key">
              <v-row class="pb-8">
                <v-col cols="12" sm="12" md="4" lg="4" class="pb-0 pt-2">
                  <v-list-item-content>
                    <v-list-item-title v-if="value.label=== t('company.label.status')  && value.value?.toLowerCase() === STATUSENUM.REJECTED" class="pt-1 font-weight-bold">{{ value.label }}</v-list-item-title>
                    <v-list-item-title v-else-if="value.label===t('company.label.status') && value.value?.toLowerCase() === STATUSENUM.PENDING" class="font-weight-bold py-3">{{ value.label }}</v-list-item-title>
                    <v-list-item-title v-else class="font-weight-bold">{{ value.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
                <v-col cols="12" sm="12" md="8" lg="8" class="py-0 pt-2">
                  <v-list-item-content class="align-end">
                    <v-list-item-title v-if="value.label===t('company.label.status')">
                      <span v-if="(value.value?.toLowerCase()===STATUSENUM.PENDING || value.value?.toLowerCase()===STATUSENUM.IMPROVED) && user.roleId === ROLE.VERIFIER" class="d-flex py-3">
                        <a-button :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }" @click="changeStatus(STATUSENUM.APPROVED)">{{ t('verifier.button.approve') }}</a-button>
                        <a-button :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545' , marginLeft: '5px' }" @click="changeStatus(STATUSENUM.REJECTED)">{{ t('verifier.button.reject') }}</a-button>
                      </span>
                      <span v-else class="text-capitalize d-flex pt-1" :style="{ color: getStatusColor(value.value?value.value?.toString()??'':'') }"> {{ t(`status.${value.value}`) }}

                      
                        <!-- <span v-if="value.value?.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                            <Popover position="below" id="item">
                                <template v-slot:activator>
                                    <InfoCircleOutlined />
                                </template>
                                <div>{{regForm.rejectedReason}}</div>
                            </Popover>
                        </span> -->
                        <v-tooltip>
                            <template #activator="{ props }">
                              <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                <div class="ml-2 icon">
                                   <InfoCircleOutlined @click="showLogHistory(companyId ? Number(companyId) : 0)"  />
                                </div>
                              </span>
                            </template>
                             <span> {{ t('logHistory.buttnText') }}</span>
                       </v-tooltip> 
                      </span>
                    </v-list-item-title>
                    <v-list-item-title v-else-if="value.label === 'Photo'">
                      <v-img :src="value.value?.toString()" max-width="400" max-height="400"></v-img>
                    </v-list-item-title>
                    <a target="_blank" v-else-if="value.label=== t('company.label.website')" style="fontSize:16px" :href="absoluteUrl" color="primary" rel="noopener noreferrer">{{ value.value }}</a>
                    <v-list-item-title v-else class="text-capitalize">{{ value.value }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')">
    <RejectReasonForm @submit="submitRejectReason"/>
  </ModalPopup>
  <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.COMPANY" />
  </ModalPopup>
</template>
<style lang="scss" scoped>
.maximum-content{
  flex: 1 1 auto;
}
</style>
