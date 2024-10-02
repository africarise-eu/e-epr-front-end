<script setup lang="ts">
import { ref, reactive, defineProps, watch, computed, onMounted, onUnmounted, type PropType } from 'vue';
import { compensationRequestSchema } from '@/utils/validationRules';
import { useApi} from '@/composables/useApi';
import { useSnackbarStore } from '@/stores/snackbar';
import type {ErrorsDto} from '@/composables/formError';
import type compensationRequestDto from '@/composables/compensation/compensationRequest';
import type compensationDocumentDto from '@/composables/compensation/compensationDocument';
import type edOrganisationDdlDto from '@/composables/compensation/edOrganisationDdl'
import { DefaultTheme } from '@/theme/LightTheme';
import { useI18n } from "vue-i18n";
import { COMPENSATION, FILE, PRODUCT } from '@/composables/apiEndpoints';
import { useRouter } from 'vue-router';
import type TAE_Fee from '@/composables/product/TAE_fee';
import {formatDate} from '@/utils/date/dateFormat';
import ImageUpload from '@/components/shared/ImageUpload.vue'
import { CalendarOutlined } from '@ant-design/icons-vue';
import type{FileModel} from '@/composables/filemodel';
import {convertFileModelsToFiles} from '@/composables/services/fileServices';
import EndDestinationForm from "@/components/compensation/EndDestinationForm.vue";
import ModalPopup from '@/components/shared/ModalPopup.vue';
import type endDestinationDto from '@/composables/compensation/endDestination';

const props = defineProps({
  compensationRequestDetails: {
    type: Object as PropType<compensationRequestDto>,
    required: true
  }
});
const { t }= useI18n();
const router = useRouter();
const compensationRequest = reactive<compensationRequestDto>(props.compensationRequestDetails);
const errors = reactive<ErrorsDto>({});
const isSubmitting = ref(false);
const modalWidth = ref('');
const compensationRequestSchemas = compensationRequestSchema();
const snackbarStore = useSnackbarStore();
const formattedDate = computed(() =>  selectedDate.value ? formatDate(new Date(selectedDate.value))  : '');
const fieldsToExcludeFromValidation = ['id', 'material', 'edOrganisation', 'status', 'deliveryToEdDate', 'edType', 'requestedDate','createdAt', 'rejectedReason', 'edOrgStatus'];
const edOrganisations = ref<edOrganisationDdlDto[]>([]);
const dateMenu = ref<null | any>(null);
const isMenuOpen = ref(false);
const tae_fees = ref<TAE_Fee[]>([]);
const fileList = ref<FileModel[]>([]);
const previewVisible = ref<boolean>(false); 
const documentChanged = ref(false); 
const showEndDestinationModal = ref(false);
const previewImage = ref<string>(''); 
const fileDescriptions = reactive<{ [uid: string]: string }>({});
const selectedDate = ref<Date>(new Date(props.compensationRequestDetails.deliveryToEdDate || new Date()));
const newEndDestination = reactive<endDestinationDto>({
    id: 0,
    orgName: '',
    orgType: null,
    companyRegNo: '',
    companyId: 0,
    companyName: '',
    phone: '',
    email: '',
    contactPerson: '',
    address: '',
    cityName: '',
    city: null,
    countryName: '',
    country: 1,
    status: '',
    rejectedReason: '',
    createdAt:''
  });

const handleFileList = (newFileList: FileModel[]) => {
  fileList.value = newFileList;
  syncDescriptions(fileList.value); 
  documentChanged.value = true;
};

const syncDescriptions = (newFileList: FileModel[]) => {
   const validUids = new Set(newFileList.map(file => file.uid?.toString()));

  // Remove descriptions for UIDs not present in the new fileList
  Object.keys(fileDescriptions).forEach(uid => {
    if (!validUids.has(uid)) {
      delete fileDescriptions[uid];
    }
  });
};

const synchronizeDocuments = () => {
  const fileListUids = new Set(fileList.value.map(file => file.uid || ''));

  // Create a new array for filtered documents
  const filteredDocuments = compensationRequest.documents.filter(doc => fileListUids.has(doc.id));
  
  // Update the documents array
  compensationRequest.documents = filteredDocuments;
  fileList.value.forEach(file => {
    if (file.uid && file.url) {
    const existingDocIndex = filteredDocuments.findIndex(doc => doc.id === file.uid) ?? -1;

    if (existingDocIndex > -1) {      
        const documentData = {
          id: file.uid, 
          documentUrl: file.url,
          description: fileDescriptions[file.uid as string] || '' 
        };
          // Update existing document
          compensationRequest.documents[existingDocIndex] = {
            ...compensationRequest.documents[existingDocIndex],
            ...documentData
          };
    } else {
       
     const newDocumentData = {
      id: '0', // or some logic to set the ID
      documentName: '',
      documentUrl: '', // Set URL if needed
      description: fileDescriptions[file.uid as string] || '' // Use description from fileDescriptions or default to empty
     };
      // Add new document
      compensationRequest.documents.push(newDocumentData);
    }
    }
  });
};

const validate = () => {
  const fieldsToValidate = { ...compensationRequest } as { [key: string]: any };
  fieldsToExcludeFromValidation.forEach(field => delete fieldsToValidate[field]);
  const { error } = compensationRequestSchemas.validate(fieldsToValidate, { abortEarly: false });
  if (error) {
    error.details.forEach((detail : any) => {
      const path = detail.path[0] as string;
      (errors as ErrorsDto)[path] = detail.message;
    });
    return false;
  }
  return true;
};

const getTAE_Fees = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<Array<TAE_Fee>>(PRODUCT.TAE_FEES, 'GET', {});
  if(!result.error)
  {
   tae_fees.value = result.data;
  }
  else{
    console.error("Error on getting tae fees")
  }
}; 

// submit method
const submitForm = async () => {
  isSubmitting.value= true;
  if( validate()) {
    let imageUploadResult = null;
    if(documentChanged.value)
     {
      imageUploadResult = await imageUpload(fileList.value);
      if(imageUploadResult)
       {
        // sync documentUrl
          const zeroIdDocs = compensationRequest.documents.filter(doc => doc.id === '0');
          const remainingDocs = compensationRequest.documents.filter(doc => doc.id !== '0');
          // Ensure we only update as many documents as we have URLs
          const maxUpdateCount = Math.min(zeroIdDocs.length, imageUploadResult.length);

          for (let i = 0; i < maxUpdateCount; i++) {
            zeroIdDocs[i].documentUrl = imageUploadResult[i].url;
          }
          compensationRequest.documents = [...remainingDocs, ...zeroIdDocs];
      }
    }
    const { useAPI } = useApi();

    try {
      let result;
      compensationRequest.deliveryToEdDate = selectedDate.value.toISOString();

      if (!isUpdateForm.value) {
        result = await useAPI<string>(COMPENSATION.ADD, 'POST', compensationRequest);
      } else {
        result = await useAPI<string>(`${COMPENSATION.UPDATE}/${compensationRequest.id}`, 'PUT', compensationRequest); // Assuming PUT for updates
      }
      snackbarStore.showMessage(result.message, 'success')
      isSubmitting.value=false;
      router.push({ name: 'CompensationList'});

    } catch (error :any) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }
}

const imageUpload = async (fileModels: FileModel[]) => {
  const { useAPI } = useApi();
   // Filter fileModels to include only those where isNew is true
  const newFiles = fileModels.filter(file => file.isNew);
  let files = await convertFileModelsToFiles(newFiles);

  const formData = new FormData();
  files.forEach(file => {
  formData.append('files', file); // Append each file to the FormData instance
});
  // Add custom headers if needed
  const customHeaders = { 'Path': 'compensation_documents', 'Content-Type': 'multipart/form-data' };

  try {
    const result = await useAPI<any[]>(FILE.UPLOAD_MULTIPLE, 'POST', formData, {}, {}, customHeaders);
    return result.data ?? [];
  } catch (error: any) {
    snackbarStore.showMessage('Failed to upload image', 'error');
  } 
};

const isUpdateForm = computed(() => {
  return compensationRequest.id !== 0; // or any other condition based on shipment.id change
});

const clearErrorByField = (field: any) => {
  if ((errors as ErrorsDto)[field]) {
    (errors as ErrorsDto)[field] = '';
  }
};

const clearAllErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key as keyof ErrorsDto] = '';
  });
};

const handleEndDestination = async(edId: number) => {
  await fetchEdOrganisations();
  compensationRequest.edOrganisationId = edId;
  clearErrorByField('edOrganisationId');
  showEndDestinationModal.value = false;
};

const fetchEdOrganisations= async () => {
  try {
     const { useAPI } = useApi();
      const result = await useAPI<Array<edOrganisationDdlDto>>(COMPENSATION.GET_ED_ORG, 'GET', {});
      if(!result.error)
      {
        edOrganisations.value = result.data;
      }
      else{
          console.error("Error on getting tae fees")
      }
  } catch (error) {
    console.error('Failed to fetch e-d organisations:', error);
  }
};
const handleWeight = (item: compensationRequestDto)=>{ 
   if (item.deliveredKgs === null || isNaN(item.deliveredKgs) || item.deliveredKgs < 0) {
    item.deliveredKgs = 0; // Reset the field if the value is invalid
  }
  
  clearErrorByField('deliveredKgs')
}

const updateModalWidth = () => {
  const width = window.innerWidth;
  if (width < 600) { // Mobile view
    modalWidth.value = '100%';
  } else if (width < 960) { // Tablet view
    modalWidth.value = '60%';
  } else { // Desktop view
    modalWidth.value = '40%';
  }
};

const setFileList = (documents: compensationDocumentDto[]) => {

  if (documents.length > 0) {
    fileList.value = props.compensationRequestDetails.documents.map(doc => ({
      uid: doc.id,
      name: doc.documentName,
      status: 'done',
      url: doc.documentUrl,
      isNew: false
    }));

    // Initialize fileDescriptions
    props.compensationRequestDetails.documents.forEach(doc => {
      fileDescriptions[doc.id as string] = doc.description || '';
    });
  }
}

watch(() => props.compensationRequestDetails.deliveryToEdDate, (newValue :any) => {
  selectedDate.value = newValue ? new Date(newValue) : new Date();
}, { immediate: true });

watch(selectedDate, () => {
    isMenuOpen.value = false;
});

watch(() => compensationRequest.edOrganisationId, (newId) => {
  const selectedOrganisation = edOrganisations.value.find(org => org.id === newId);
  if (selectedOrganisation) {
    compensationRequest.edType = selectedOrganisation.orgType;
  } else {
    compensationRequest.edType = ''; // Clear type if no matching organisation
  }
});

watch(() => props.compensationRequestDetails, (newValue) => {
  if (newValue && newValue.documents.length > 0) {
    setFileList(newValue.documents);
  } else {
    fileList.value = [];
     Object.keys(fileDescriptions).forEach(key => {
        delete fileDescriptions[key];
      });
  }
}, { immediate: true });

watch([fileList, fileDescriptions], synchronizeDocuments, { deep: true });

onMounted(async() => {
  await fetchEdOrganisations();
  await getTAE_Fees();
  updateModalWidth();
  window.addEventListener('resize', updateModalWidth);

  if (props.compensationRequestDetails && props.compensationRequestDetails.documents) {
    setFileList(props.compensationRequestDetails.documents);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateModalWidth);
});

</script>

<template>
  <v-form @submit.prevent="submitForm" class="addcompensationForm">
    <div class="d-flex justify-end align-center mb-9">
     <v-label class="mr-2">{{isUpdateForm? 'Requested date':'Today'}} :</v-label> <b>{{formatDate(isUpdateForm ? new Date(compensationRequest.requestedDate) : new Date())}}</b>
  </div>
    <v-row>
      <v-col cols="12" class="py-0">
            <v-row>
               <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('compensationRequest.label.deliveryToEdDate') }}*</v-label>
                <v-menu v-model= "isMenuOpen" :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                          <v-text-field 
                          :placeholder="$t('compensationRequest.placeholder.deliveryToEdDate')"
                          hide-details="auto"
                          required
                          variant="outlined"
                          class="mt-2"
                          color="primary"
                          :model-value="formattedDate" v-bind="props"
                          :error-messages="errors.deliveryToEdDate ? [errors.deliveryToEdDate] : []"
                          readonly >
                            <template v-slot:prepend-inner>
                              <CalendarOutlined />
                            </template>
                          </v-text-field>
                    </template>
                    <v-date-picker v-model="selectedDate"  hide-header color="primary">
                    </v-date-picker>
                </v-menu>
               </div>
               </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                    <v-label>{{ $t('compensationRequest.label.material')}}*</v-label>
                   <v-autocomplete
                        v-model="compensationRequest.materialId"
                        variant="outlined"
                        class="mt-2"
                        color="primary"
                        clearable
                        :placeholder="$t('compensationRequest.placeholder.material')"
                        :items="tae_fees"
                        item-value="id"
                         :item-title="(item: any) => $t(`common.packagingMaterial.${item.material}`)"
                        :error-messages="errors.materialId ? [errors.materialId] : []"  
                        @update:modelValue="clearErrorByField('materialId')"
                        ></v-autocomplete>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('compensationRequest.label.deliveredKgs') }}*</v-label>
                   <v-text-field
                    hide-details="auto"
                    required
                    v-model="compensationRequest.deliveredKgs"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    type="number"
                    :error-messages="errors.deliveredKgs ? [errors.deliveredKgs] : []"  
                    :placeholder="$t('compensationRequest.placeholder.deliveredKgs')"
                    @input="handleWeight(compensationRequest)"
                ></v-text-field>
                </div>
              </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('compensationRequest.label.edOrganisation') }}*</v-label>
                  <v-autocomplete
                    :items="edOrganisations"
                    v-model="compensationRequest.edOrganisationId"
                    :error-messages="errors.edOrganisationId ? [errors.edOrganisationId] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"                    
                    clearable
                    item-value="id"
                    item-title="orgName"
                    :placeholder="$t('compensationRequest.placeholder.edOrganisation')"
                    @update:modelValue="clearErrorByField('edOrganisationId')"
                  >
                  <template v-slot:append>        
                    <v-btn 
                      @click="showEndDestinationModal = !showEndDestinationModal" 
                      color="primary" variant="flat" 
                    >
                      {{ $t('compensationRequest.head.addDestination') }}
                    </v-btn>              
                    </template>
                    </v-autocomplete>
             </div>
               </v-col>
            </v-row>
             <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('compensationRequest.label.edType') }}*</v-label>
                   <v-text-field
                    hide-details="auto"
                    required
                    v-model="compensationRequest.edType"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    readonly
                    :placeholder="$t('compensationRequest.placeholder.edType')"
                    @input="clearErrorByField('edType')"
                ></v-text-field>
                </div>
              </v-col>
             </v-row>
        </v-col>
    </v-row>
    <v-row>
              <v-col>
                 <div class="mb-6">
                  <v-label>{{ $t('compensationRequest.head.documents')}}*</v-label>
                  <span class="pl-2" v-if="errors.documents" :style="{ color: DefaultTheme.colors?.error, fontSize: '12px' }">{{
                    errors.documents }}</span>
                  </div>
                  <v-row>
                    <v-col cols="lg-4 sm-4" >
                      <div class="mb-6">
                      <ImageUpload :fileList="fileList" :handle-file-list="handleFileList" />
                      </div>
                    </v-col>
                    <v-col cols="lg-6 sm-8">
                      <div class="mt-13">
                        <v-row v-for="file in fileList" :key="file.uid" style="height: 86px;">
                          <v-col class="pa-0" style="padding-bottom: 10px !important">
                            <v-textarea
                              v-model="fileDescriptions[file.uid ?? '']"
                              placeholder="Description" maxlength="200" rows="2" variant="outlined" color="primary" style="height: 97px" />
                            </v-col>
                         </v-row>
                      </div>
                    </v-col>
                    
                  </v-row>
              </v-col>
            </v-row>
    <v-divider class="my-4"></v-divider>
      <div class="d-flex align-center justify-center mt-4 mb-7 mb-sm-0">
        <v-btn  class="mt-5 mr-2" variant="outlined" :to="'/compensation/requests'" size="large" >
        {{ $t('common.cancel')}}</v-btn>
          <v-btn :loading="isSubmitting" color="primary" class="mt-5" variant="flat" size="large" type="submit">
        {{ !isUpdateForm ? $t('compensationRequest.button.submit') : $t('compensationRequest.button.update') }}</v-btn>
      </div>
 </v-form>
  <ModalPopup v-model="showEndDestinationModal"  :max-width="modalWidth" :title="$t('compensationRequest.head.addDestination')">    
     <EndDestinationForm :isFromCompensationForm="true" :endDestinationDetails="newEndDestination" :handle-end-destination="handleEndDestination" />
  </ModalPopup>
 </template>