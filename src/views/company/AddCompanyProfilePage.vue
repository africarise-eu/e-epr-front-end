<script setup lang="ts">
import { inject, onMounted, reactive, ref, type Ref} from 'vue';
import AddIcon from '@/assets/images/users/plus.png';
import { companyProfileSchema } from '@/utils/validations/companyValidationRules';
import CompanyProfileForm, { type CompanyProfileFormProps, type CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
import { useApi } from '@/composables/useApi';
import { useSnackbarStore } from '@/stores/snackbar';
import { COMPANY, FILE } from '@/composables/apiEndpoints';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

const companyProfileSchemas = companyProfileSchema();
const router=useRouter();
const {t} = useI18n();
const isSubmitting = ref(false);
const snackbarStore = useSnackbarStore();
const regForm:Ref<CompanyProfileFormProps>= ref({
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
      logo: '',
      isImageUpload:false,
      imagePath: ''
});
const errors: ErrorsDto = reactive({});

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
        regForm.value= formValue
        const { useAPI } = useApi();
        const payload:any={
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
        else
        {
          payload['logo']= '';
        }
        const result = await useAPI(COMPANY.COMPANY_PROFILE, 'POST', payload);
        isSubmitting.value=false
        if(!result.error){
          snackbarStore.showMessage(result.message, 'success');
          const user =  localStorage.getItem('user');
          let userJson = JSON.parse(user!);
          userJson.isProfileExist = true;
          localStorage.setItem('user', JSON.stringify(userJson));
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
  regForm.value=formValue
}

const updateFormData = (newData: CompanyProfileFormProps) => {
  regForm.value = newData;
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('company.head.addCompanyProfile'), href: `company/profile/add` },
  ]);
});

</script>

<template>
  <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('company.head.addCompanyProfile')}}</h3>
  </div>
  
  <v-card class="pt-1 pa-8">
  <company-profile-form :form-values="regForm" :submitButtonText="$t('company.button.createCompany')" @submit="submitForm" @clear="clearForm" @update:formValues="updateFormData"></company-profile-form>
  </v-card>
</template>
<style lang="scss">

</style>
