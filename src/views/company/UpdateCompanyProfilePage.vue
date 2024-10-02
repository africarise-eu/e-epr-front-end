<script setup lang="ts">
import { onMounted, reactive, ref, type Ref} from 'vue';
import AddIcon from '@/assets/images/users/plus.png';
import { companyProfileSchema } from '@/utils/validations/companyValidationRules';
import CompanyProfileForm, { type CompanyProfileFormProps, type CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useSnackbarStore } from '@/stores/snackbar';
import { useRouter } from 'vue-router';
const router=useRouter();
const snackbarStore = useSnackbarStore();
const companyProfileSchemas = companyProfileSchema();
const isSubmitting = ref(false);
const isLoading = ref(true);
const {t} = useI18n();
const initialImagePath = ref({value:'', path:''});
const regForm:Ref<CompanyProfileFormProps>= ref({
    companyName: '',
    logo: '',
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
    imagePath:''
});
const errors: ErrorsDto = reactive({});
const fetchInitialData = async () => {
  isSubmitting.value = true;
  isLoading.value = true;
  try {
    const { useAPI } = useApi();
    const result  = await useAPI<CompanyProfileResponseProps>(COMPANY.COMPANY_PROFILE, 'GET');
    isSubmitting.value=false;
    if(!result.error){
      regForm.value.companyName = result.data.companyName ?? '';
      // regForm.value.person = result.data.person??'';
      regForm.value.registrationNumber = result.data.registrationNumber??'';
      regForm.value.activityCode = result.data.activityCode??0;
      regForm.value.address = result.data.address??'';
      regForm.value.country = result.data.countries??{id:1, name:'Mozambique'};
      regForm.value.city = result.data.cities??{};
      regForm.value.companyPhoneNumber = result.data.phoneNumber??'';
      regForm.value.website = result.data.website??'';
      regForm.value.bankAccount = result.data.bankAccount??'';
      regForm.value.type=[];
      result.data.isImporter? regForm.value.type.push('Importer'): null;
      result.data.isProducer? regForm.value.type.push('Producer'): null;
      initialImagePath.value.value = result.data.logo??'';
      if(result.data.logo){
        const image = await useAPI<string>(FILE.GET_FILE, 'GET',undefined, {path: result.data.logo});
        if(!image.error){
          regForm.value.logo = image.data??'';
          regForm.value.imagePath = image.data??'';
          initialImagePath.value.path = image.data??'';
        }
      }
      isLoading.value = false;
    }
  } catch (error) {
    isLoading.value = false;
    console.error( t('company.error.failedToFetch'), error);
    isSubmitting.value = false;
  } finally {
    isLoading.value = false;
    isSubmitting.value = false;
  }
};

onMounted(() => {
  fetchInitialData();
});
const validate = (formValue: CompanyProfileFormProps) => {
  const {error} = companyProfileSchemas.validate(formValue, {abortEarly: false})
  if(error){
    error.details.forEach((detail: ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}
const submitForm = async (formValue: CompanyProfileFormProps) => {
  isSubmitting.value=true;
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate(formValue)) {
    try {
        regForm.value= formValue;
        const { useAPI } = useApi();
        const payload={
          companyName: regForm.value.companyName,
          isProducer: regForm.value.type.includes('Producer'),
          isImporter: regForm.value.type.includes('Importer'),
          registrationNumber: regForm.value.registrationNumber,
          activityCode: regForm.value.activityCode,
          address: regForm.value.address,
          country: regForm.value.country.id,
          city: regForm.value.city.id,
          phoneNumber: regForm.value.companyPhoneNumber,
          bankAccount: regForm.value.bankAccount,
          website: regForm.value.website,
          logo: regForm.value.logo === initialImagePath.value.path ? initialImagePath.value.value : regForm.value.logo
        }
        let profileResult=null;
        if(regForm.value.isImageUpload){
          const formData = new FormData();
          formData.append('file', regForm.value.logo);
          const customHeaders = { 'Path': 'companyprofile', 'Content-Type': 'multipart/form-data' };
          profileResult = await useAPI<string>(FILE.UPLOAD, 'POST', formData, undefined, undefined, customHeaders);
          if(!profileResult.error){
            payload['logo']=profileResult.data
          }else{
            throw new Error(profileResult.message);
          }
          // return;
        }
        const result = await useAPI(COMPANY.COMPANY_PROFILE, 'PATCH', payload);
        isSubmitting.value=false
        if(!result.error){
          snackbarStore.showMessage(result.message, 'success');
          isSubmitting.value=false
          router.push({name: 'ViewCompanyProfile'})
        }
    } catch (error) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }

}

const clearForm = (formValue: CompanyProfileFormProps) => {
  regForm.value=formValue;
}

const updateFormData = (newData: CompanyProfileFormProps) => {
  regForm.value = newData;
};

</script>

<template>
  <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('company.head.editCompanyProfile')}}</h3>
  </div>
  <v-card class="pt-1 pa-8" v-if="!isLoading">
  <company-profile-form :form-values="regForm" :submitButtonText="$t('company.button.updateCompany')" @submit="submitForm" @clear="clearForm" @update:formValues="updateFormData"></company-profile-form>
  </v-card>
</template>
<style lang="scss">
</style>
