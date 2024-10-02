<script setup lang="ts">
import { defineEmits, defineProps, onMounted, reactive, ref, watch, type PropType, type Ref} from 'vue';
import AddIcon from '@/assets/images/users/plus.png';
import { companyProfileSchema } from '@/utils/validations/companyValidationRules';
import { DefaultTheme } from '@/theme/LightTheme';
import { VTextarea } from 'vuetify/components/VTextarea';
import { useApi } from '@/composables/useApi';
import {  PlusOutlined, EditOutlined  } from '@ant-design/icons-vue';
import { COMMON, COMPANY } from '@/composables/apiEndpoints';
import { useSnackbarStore } from '@/stores/snackbar';
import type { FileModel } from '@/composables/filemodel';
import { useI18n } from 'vue-i18n';
import { Modal } from 'ant-design-vue';


export interface CompanyProfileResponseProps {
  companyName: string,
  isProducer: boolean,
  isImporter: boolean,
  registrationNumber: string,
  activityCode: string,
  address: string,
  countries: cityListResponseDto,
  cities: cityListResponseDto,
  phoneNumber: string,
  bankAccount: string,
  website:string,
  status: string,
  logo: string,
  rejectedReason: string
}
export interface CompanyProfileFormProps {
    companyName: string;
    logo: File |string;
    type: string[];
    registrationNumber: string;
    activityCode?: string;
    address: string;
    city: cityListResponseDto;
    country: cityListResponseDto;
    companyPhoneNumber: string;
    website: string;
    bankAccount: string;
    isImageUpload:boolean;
    imagePath:string;
}
interface ErrorDetail {
  message: string;
  path: (string | number)[];
}

interface Errors {
  [key: string]: string;
}
export interface cityListResponseDto{
  id: number,
  name: string
}
const { t } = useI18n();
const companyProfileSchemas = companyProfileSchema();
const isSubmitting = ref(false);
const fileInput = ref();
const theme = reactive(DefaultTheme);
const selectedCityId = ref();
const snackbarStore = useSnackbarStore();
const fileList = ref<FileModel[]>([]);
const emit = defineEmits(['submit', 'clear', 'update:formValues'])
const showPreview = ref(false);
const previewImage = ref<string>(''); 
const isUploading = ref(false);

const prop = defineProps({
  submitButtonText: {
    type: String,
    required: true,
    default: '',
  },
  formValues: {
    type: Object as PropType<CompanyProfileFormProps>,
    required: true,
    default:() => ({
        companyName: '',
        logo: '',
        person:'',
        type:[],
        registrationNumber:'',
        activityCode:'',
        address:'',
        city:{},
        country:{id:1, name:'Mozambique'},
        companyPhoneNumber:'',
        website:'',
        bankAccount:'',
        isImageUpload:false,
        imagePath:''
    }),
  },
})

const cityList = ref<cityListResponseDto[]>([]);
const regForm = reactive({...prop.formValues});
const errors: Errors = reactive({});
regForm.imagePath = (prop.formValues.logo??AddIcon) as string;


const getCityList = async () => {
  const { useAPI } = useApi();
  const getCountry = await useAPI<{count: number, rows: cityListResponseDto[]}>(COMMON.GET_COUNTRIES, 'GET', null,{search: regForm.country.name});
  // return;
  const result = await useAPI<{count: number, rows: cityListResponseDto[]}>(COMMON.GET_CITIES+'/'+regForm.country.id, 'GET');
  if(!result.error){
    cityList.value= result.data.rows.map((c)=>{return {id:c.id, name: c.name}})
    cityList.value = sortedItems(cityList.value)
    selectedCityId.value = regForm.city.id!=0?regForm.city.id:null;
  }

}
const sortedItems = ((items:{id:number, name:string}[]) => {
  return [...items].sort((a, b) => {
    const priorityNames = ['Maputo', 'Matola']
    const aIsPriority = priorityNames.includes(a.name);
    const bIsPriority = priorityNames.includes(b.name);

    if (aIsPriority && bIsPriority) {
      return a.name.localeCompare(b.name);
    }
    if (aIsPriority) {
      return -1;
    }
    if (bIsPriority) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
});
const selectCity = (city:number) => {
  let selectedCity = cityList.value.find((c: cityListResponseDto)=>{return c.id===city}) ?? { id: 0, name: '' };
  regForm.city = selectedCity;
  errors.city = '';
}
const triggerFileInput = () => {
    if(fileInput.value instanceof HTMLInputElement){
        fileInput.value.click();
    }
};
const beforeUpload = (file: File) => {
  errors['logo'] = '';
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    console.error('product.error.invalidImageType');
    snackbarStore.showMessage(t('imageUpload.info.isJpgOrPng'), 'error');
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    console.error('product.error.imageTooLarge');
    snackbarStore.showMessage(t('imageUpload.info.isLt5M'), 'error');
  }
  return isJpgOrPng && isLt5M;
};

// const onFileChange = (event:Event) => {
//   const file = (event.target as HTMLInputElement).files?.[0];
//   if (file && beforeUpload(file)) {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       regForm.imagePath = e.target?.result as string;
//     };
//     regForm.logo = file;
//     regForm.isImageUpload=true;
//     emit('update:formValues', regForm);
//     reader.readAsDataURL(file);
//   }
// };
const handleChange = async (options: any) => {  
  isUploading.value = true;
  const { file, onSuccess, onError } = options;
  const objectURL = URL.createObjectURL(file);
  fileList.value = [{
    uid: file.uid,
    name: file.name,
    status: 'done',
    url: objectURL,
    isNew: true // URL for preview
  }];
  regForm.imagePath = file;
  regForm.logo = file;
  regForm.isImageUpload=true;
  onSuccess(null, file);
  errors.image = '';
  isUploading.value = false;
};
const handleRemove = () => {
  fileList.value = [];
  regForm.imagePath = '';
  regForm.logo  = '';
  regForm.isImageUpload=false;
};

const handlePreview = (file :any) => {
  showPreview.value = true;
  previewImage.value =  file.url;
};

const handleCancel = () => {
  showPreview.value = false;
};
const validate = () => {
  const {error} = companyProfileSchemas.validate(regForm, {abortEarly: false})
  if(error){
    error.details.forEach((detail: ErrorDetail)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  // if( regForm.imagePath === ''){
  //   errors['logo'] = t('company.validation.logo.required');
  //   return false;
  // }
  return true
}
const submitForm = async () => {
  isSubmitting.value=true
  if( validate()) {
    try {

      // if (regForm.logo instanceof File) {
      //   const uploadedImageUrl = URL.createObjectURL(regForm.logo); // Implement this function to upload the image
      //   if (uploadedImageUrl) {
      //     regForm.logo = uploadedImageUrl; // Update the logo field with the URL or string
      //   } else {
      //     throw new Error("Image upload failed");
      //   }
      // }


        emit('submit', regForm);
        isSubmitting.value=false
    } catch (error) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }

}

const clearForm = () => {
  regForm.companyName= ''
  regForm.logo= ''
  regForm.type=[]
  regForm.registrationNumber=''
  regForm.activityCode=undefined
  regForm.address=''
  regForm.city={id:0,name:''}
  regForm.companyPhoneNumber=''
  regForm.website=''
  regForm.bankAccount=''
  regForm.imagePath = ''
  emit('clear', regForm);
}
const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = ''
  }
}
onMounted(() => {
  getCityList();
  if(regForm.logo){
    fileList.value = [{
      uid: '-1', 
      name: 'product-image',
      status: 'done', 
      url: regForm.logo as string,
      isNew: true
    }];
  }
})

watch(regForm, (newData: CompanyProfileFormProps) => {
  emit('update:formValues', newData);
}, { deep: true });
</script>
<template>
    <v-form @submit.prevent="submitForm" class="d-flex flex-column mt-8 form-container" >
      <v-row class="ms-0">
        <v-col cols="12" md="6">
          <div class="fieldContainer">
            <v-label>{{$t('company.label.companyName')}}*</v-label>
            <v-text-field
                v-model="regForm.companyName"
                :error-messages="errors.companyName"
                :placeholder="$t('company.placeholder.companyName')"
                class="mt-2"
                required
                hide-details="auto"
                variant="outlined"
                color="primary"
                @input="clearError('companyName')"
            ></v-text-field>
          </div>
          <div class="fieldContainer">
          <v-label>{{$t('company.label.type')}}*</v-label>
          <div  class="d-flex justify-start align-center mt-2">          
              <v-checkbox color="primary"
              class="ml-n2 mr-4"
              v-model="regForm.type"
              hide-details :label="$t('company.placeholder.importer')" value="Importer"
              @change="clearError('type')"></v-checkbox>
              <v-checkbox color="primary"
              v-model="regForm.type"
              hide-details :label="$t('company.placeholder.producer')" value="Producer" @change="clearError('type')"></v-checkbox>
          </div>
          <span v-if="errors.type" class="error mt-1" color="error" :style="{ color: theme.colors?.error, fontSize:'12px' }">{{ errors.type }}</span>

          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="mb-6 px-3" v-if="true">
              <v-label class="mb-4">{{$t('company.label.logo')}}</v-label>
              <!-- <div class="profile-image-upload mt-4">
                  <v-avatar class="profile-avatar elevation-3" size="100" @click="triggerFileInput">
                  <img :src="regForm.imagePath?regForm.imagePath:''" alt="Logo" width="100%"/>
                  </v-avatar>
                  <input type="file" ref="fileInput" @change="onFileChange" style="display: none" />
              </div> -->
              <a-upload list-type="picture-card"
               :before-upload="beforeUpload"
               :file-list="fileList"
               :custom-request="handleChange"
               :on-Preview="handlePreview"
               :on-remove="handleRemove"
               :disabled="isSubmitting"                
               :multiple="false">
                 <div v-if="fileList.length < 1">
                  <PlusOutlined  />                  
                  <div style="margin-top: 8px">{{ isUploading ? 'Uploading...' : 'Upload' }}</div>
                </div>
              </a-upload>
              <Modal :open="showPreview" :footer="null"  :onCancel=handleCancel>
                <img alt="example" style="width: 100%" :src=previewImage />
              </Modal>
              <span v-if="errors.logo" class="error mt-1" color="error" :style="{ color: theme.colors?.error, fontSize:'12px' }">{{ errors.logo }}</span>
          </div>
          
        </v-col>
      </v-row>
      <!-- <v-row class="ms-0">
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.companyName')}}*</v-label>
              <v-text-field
                  v-model="regForm.companyName"
                  :error-messages="errors.companyName"
                  :placeholder="$t('company.placeholder.companyName')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('companyName')"
              ></v-text-field>
              </div>
          </v-col>
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.type')}}*</v-label>
              <div  class="d-flex justify-start align-center mt-2">
                 v-model="regForm.type"
                  label="type"
                  @input="clearError('type')" 
              
                  <v-checkbox color="primary"
                  class="ml-n2 mr-4"
                  v-model="regForm.type"
                  hide-details :label="$t('company.placeholder.importer')" value="Importer"></v-checkbox>
                  <v-checkbox color="primary"
                  v-model="regForm.type"
                  hide-details :label="$t('company.placeholder.producer')" value="Producer"></v-checkbox>
              </div>
              <span v-if="errors.type" class="error mt-1" color="error" :style="{ color: theme.colors?.error, fontSize:'12px' }">{{ errors.type }}</span>
    
              </div>
          </v-col>
      </v-row> -->
      <v-row class="ms-0">
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.registrationNumber')}}*</v-label>
              <v-text-field
                  v-model="regForm.registrationNumber"
                  :error-messages="errors.registrationNumber"
                  :placeholder="$t('company.placeholder.registrationNumber')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('registrationNumber')"
              ></v-text-field>
              </div>
          </v-col>
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.activityCode')}}*</v-label>
              <v-text-field
                  v-model="regForm.activityCode"
                  :error-messages="errors.activityCode"
                  :placeholder="$t('company.placeholder.activityCode')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('activityCode')"
              ></v-text-field>
              </div>
          </v-col>
      </v-row>
      <v-row class="ms-0">
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.address')}}*</v-label>
              <v-textarea
                  v-model="regForm.address"
                  :error-messages="errors.address"
                  :placeholder="$t('company.placeholder.address')"
                  class="mt-2" 
                  row-height="15em" rows="6"
                  required
                  hide-details="auto"
                  variant="outlined"
                  maxlength="255"
                  color="primary"
                  @input="clearError('address')"
              ></v-textarea>
              </div>
          </v-col>
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.city')}}*</v-label>
              <!-- <v-text-field
                  v-model="regForm.city"
                  :error-messages="errors.city"
                  :placeholder="$t('company.placeholder.city')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('city')"
              ></v-text-field> -->
              <v-autocomplete
              v-model="selectedCityId"
              variant="outlined"
              class="mt-2"
              color="primary"
              clearable
              :placeholder="$t('company.placeholder.city')"
              :items="cityList"
              item-value="id"
              item-title="name"
              :error-messages="errors.city"
              @input="clearError('city.name')"
              @update:modelValue="selectCity"
            ></v-autocomplete>
              </div>
              <div class="fieldContainer">
              <v-label>{{$t('company.label.country')}}*</v-label>
              <v-text-field
                  v-model="regForm.country.name"
                  :error-messages="errors.country"
                  :placeholder="$t('company.placeholder.country')"
                  class="mt-2"
                  required
                  disabled
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('country')"
              ></v-text-field>
              </div>
          </v-col>
      </v-row>    
      <v-row class="ms-0">
        <v-col cols="12" md="6">
          <div class="fieldContainer">
            <v-label>{{$t('company.label.website')}}*</v-label>
            <v-text-field
                v-model="regForm.website"
                :error-messages="errors.website"
                :placeholder="$t('company.placeholder.website')"
                class="mt-2"
                required
                hide-details="auto"
                variant="outlined"
                color="primary"
                @input="clearError('website')"
            ></v-text-field>
          </div>
        </v-col>
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.companyPhoneNumber')}}*</v-label>
              <v-text-field
                  v-model="regForm.companyPhoneNumber"
                  :error-messages="errors.companyPhoneNumber"
                  :placeholder="$t('company.placeholder.companyPhoneNumber')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('companyPhoneNumber')"
              >
              <template v-slot:prepend-inner>
                  <span class="prefix-text">+{{ '285' }}</span>
                </template>
              </v-text-field>
              </div>
          </v-col>
      </v-row>
      <v-row class="ms-0">
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.bankAccount')}}</v-label>
              <v-text-field
                  v-model="regForm.bankAccount"
                  :error-messages="errors.bankAccount"
                  :placeholder="$t('company.placeholder.bankAccount')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('bankAccount')"
              ></v-text-field>
              </div>
          </v-col>
      </v-row>
      <!-- <v-row class="ms-0">
          <v-col cols="12" md="6">
              <div class="fieldContainer">
              <v-label>{{$t('company.label.person')}}*</v-label>
              <v-text-field
                  v-model="regForm.person"
                  :error-messages="errors.person"
                  :placeholder="$t('company.placeholder.person')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearError('person')"
              ></v-text-field>
              </div>
          </v-col>
      </v-row> -->
      <div class="d-flex align-center justify-end mt-4 mb-7 mb-sm-0">
        <v-btn :loading="isSubmitting" class="mt-5 mr-2" variant="outlined" :to="'/company/profile'" size="large" @click="clearForm">
        {{$t('common.cancel')}}</v-btn
      >
        <v-btn :loading="isSubmitting" color="primary" class="mt-5" variant="flat" size="large" type="submit">
        {{submitButtonText}}</v-btn
      >
      </div>
      
    </v-form>
  </template>
  <style lang="scss">
  .form-container {
    .v-text-field .v-field--active input {
      font-weight: 500;
    }
    .prefix-text{
      font-size: 14px;
      font-weight: 500;
      color: rgb(var(--v-theme-secondary));
      margin-right: 5px;
    }
  }
  @media (min-width: 768px) {
      .fieldContainer {
          margin-bottom: 24px;
      }
  }
  </style>
  