<script setup lang="ts">
import { ref, reactive, computed, defineProps, watch, onMounted, type PropType } from 'vue';
import { endDestinationSchema } from '@/utils/validationRules';
import { useApi} from '@/composables/useApi';
import { useSnackbarStore } from '@/stores/snackbar';
import type {ErrorsDto} from '@/composables/formError';
import type endDestinationDto from '@/composables/compensation/endDestination';
import { useI18n } from "vue-i18n";
import { useRouter } from 'vue-router';
import { COMPENSATION, COMMON } from '@/composables/apiEndpoints';
import {formatDate} from '@/utils/date/dateFormat';
import { getCountries, getCities } from '@/composables/services/commonServices';
import type {Country} from '@/composables/country';
import type {City} from '@/composables/city';

const props = defineProps({
   endDestinationDetails: {
    type: Object as PropType<endDestinationDto>,
    required: true
  },
  handleEndDestination: {
    type: Function as PropType<(edId: number) => void>,
    required: false
  },
  isFromCompensationForm: {
    type: Boolean,
    required: false,
    default: false
  }
});

const { t }= useI18n();
const router = useRouter();
const endDestination = reactive<endDestinationDto>(props.endDestinationDetails);
const isFromCompensationForm = ref(props.isFromCompensationForm);
const errors = reactive<ErrorsDto>({});
const isSubmitting = ref(false);
const countries = ref<Country[]>([]);
const cities = ref<City[]>([]);
const fullName = ref('');
const companyName = ref('');
const endDestinationSchemas = endDestinationSchema();
const snackbarStore = useSnackbarStore();
const fieldsToExcludeFromValidation = ['id', 'status', 'companyId','companyName', 'createdAt', 'countryName', 'cityName', 'rejectedReason', 'city'];
const edTypes = ['Recycler', 'Landfill', 'Exporter', 'Processor', 'Waste-to-energy', ' Factory (cement, glass, steel)', 'Other']



const validate = () => {
  const fieldsToValidate = { ...endDestination } as { [key: string]: any };
  fieldsToExcludeFromValidation.forEach(field => delete fieldsToValidate[field]);
  const { error } = endDestinationSchemas.validate(fieldsToValidate, { abortEarly: false });
  if (error) {
    error.details.forEach((detail : any) => {
      const path = detail.path[0] as string;
      (errors as ErrorsDto)[path] = detail.message;
    });
    return false;
  }
  return true;
};

// submit method
const submitForm = async () => {
  isSubmitting.value= true;
  if( validate()) {
    const { useAPI } = useApi();

    try {
    let result;
    if (!isUpdateForm.value) {
      result = await useAPI<endDestinationDto>(COMPENSATION.ADD_ED_ORG, 'POST', endDestination);
    } else{
      result = await useAPI<endDestinationDto>(`${COMPENSATION.UPDATE_ENDDESTINATIONS}/${endDestination.id}`, 'PUT', endDestination);
    }
    if(!result.error)
    {
        snackbarStore.showMessage(result.message, 'success')
        isSubmitting.value=false;
        if(isFromCompensationForm.value){
          if (props.handleEndDestination) {
            props.handleEndDestination(result.data.id);  
          }        
        }
        else{
          router.push({ name: 'EndDestinations'});
        }
    }
    else{
        snackbarStore.showMessage(result.message, 'error')
    } 
    } catch (error :any) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }
}


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

const fetchCities = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<{count: number, rows: City[]}>(COMMON.GET_CITIES+'/'+endDestination.country, 'GET');
  if(!result.error){
    endDestination.city = null;
    cities.value= result.data.rows.map((c)=>{return {id:c.id, name: c.name}})
    cities.value = sortedItems(cities.value)
  }
}

const fetchCountries = async () => {
  try {
    const fetchedCountries = await getCountries();
    countries.value = fetchedCountries || [];
  } catch (error) {
    console.error('Failed to fetch countries:', error);
  }
};

const isUpdateForm = computed(() => {
  return endDestination.id !== 0; // or any other condition based on shipment.id change
});

watch(() => endDestination.country, (newCountryId) => {
  if (newCountryId !== null && newCountryId !== undefined) {
    fetchCities();
  } else {
    cities.value = []; // Clear cities if no country is selected
  }
}, { immediate: true });

onMounted(async () => {
  const roleNameSelection = localStorage.getItem('user');
  if (roleNameSelection) {
    try {
      const user = JSON.parse(roleNameSelection);
      endDestination.companyId = user.companyId;
      companyName.value = user.companyName;
      fullName.value = `${user.firstName} ${user.lastName}`;
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
  await fetchCountries();

});

</script>

<template>
<v-card class="pa-8 mt-3">
  <v-form @submit.prevent="submitForm" class="endDestinationForm">
    <div class="d-flex justify-end align-center mb-9">
       <v-label>{{isUpdateForm? $t('endDestination.label.createdAt'):$t('endDestination.label.today')}} :</v-label> <b>{{formatDate(isUpdateForm ? new Date(endDestination.createdAt) : new Date())}}</b>
    </div>
    <v-row class="pt-5">
      <v-col cols="12" class="py-0">
        <v-row>
               <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">                  
                <v-label>Requestor</v-label>
                      <v-text-field
                    hide-details="auto"
                    required
                    v-model="fullName"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    readonly
                    disabled
                    placeholder="Requestor"
                ></v-text-field>
                </div>
               </v-col>
               <v-col cols="12" sm="6" class="py-0">
                 <div class="mb-6">                  
                    <v-label>Company</v-label>
                      <v-text-field
                    hide-details="auto"
                    required
                    v-model="companyName"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    readonly
                    disabled
                    placeholder="Company"
                   ></v-text-field>
                </div>
               </v-col>
        </v-row>
            <v-row>
               <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.orgType') }}*</v-label>
                 <v-autocomplete
                        v-model="endDestination.orgType"
                        variant="outlined"
                        class="mt-2"
                        color="primary"
                        clearable
                        hide-details="auto"
                        :placeholder="$t('endDestination.placeholder.orgType')"
                        :items="edTypes"
                        :error-messages="errors.orgType ? [errors.orgType] : []"  
                        @update:modelValue="clearErrorByField('orgType')"
                        ></v-autocomplete>
               </div>
               </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                    <v-label>{{ $t('endDestination.label.orgName') }}*</v-label>
                     <v-text-field
                    hide-details="auto"
                    required
                    v-model="endDestination.orgName"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    :error-messages="errors.orgName ? [errors.orgName] : []"  
                    :placeholder="$t('endDestination.placeholder.orgName')"
                     @input="clearErrorByField('orgName')"
                ></v-text-field>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.companyRegNo') }}*</v-label>
                   <v-text-field
                    hide-details="auto"
                    required
                    v-model="endDestination.companyRegNo"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    :error-messages="errors.companyRegNo ? [errors.companyRegNo] : []"  
                    :placeholder="$t('endDestination.placeholder.companyRegNo')"
                     @input="clearErrorByField('companyRegNo')"
                ></v-text-field>
                </div>
              </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.phone') }}*</v-label>
                <v-text-field
                  v-model="endDestination.phone"
                  :error-messages="errors.phone"
                  :placeholder="$t('endDestination.placeholder.phone')"
                  class="mt-2"
                  required
                  hide-details="auto"
                  variant="outlined"
                  maxlength="12"
                  color="primary"
                  @input="clearErrorByField('phone')"
              >
              <template v-slot:prepend-inner>
                  <span class="prefix-text">+{{ '260' }}</span>
                </template>
              </v-text-field>
             </div>
               </v-col>
            </v-row>
             <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.email') }}*</v-label>
                 <v-text-field
                    hide-details="auto"
                    required
                    v-model="endDestination.email"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    :error-messages="errors.email ? [errors.email] : []"  
                    :placeholder="$t('endDestination.placeholder.email')"
                     @input="clearErrorByField('email')"
                ></v-text-field>
                </div>
              </v-col>
               <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.contactPerson') }}*</v-label>
                 <v-text-field
                    hide-details="auto"
                    required
                    v-model="endDestination.contactPerson"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    :error-messages="errors.companyRegNo ? [errors.contactPerson] : []"  
                    :placeholder="$t('endDestination.placeholder.contactPerson')"
                     @input="clearErrorByField('contactPerson')"
                ></v-text-field>
                </div>
              </v-col>
             </v-row>
              <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.address') }}*</v-label>
                 <v-textarea
                  v-model="endDestination.address"
                  :error-messages="errors.address"
                  :placeholder="$t('endDestination.placeholder.address')"
                  class="mt-2" 
                  row-height="15em" rows="6"
                  required
                  maxlength="255"
                  hide-details="auto"
                  variant="outlined"
                  color="primary"
                  @input="clearErrorByField('address')"
              ></v-textarea>
                </div>
              </v-col>
               <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('endDestination.label.country') }}*</v-label>
                  <v-autocomplete
                    :items="countries"
                    v-model="endDestination.country"
                    :error-messages="errors.country ? [errors.country] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    item-value="id"
                    item-title="name"
                    :placeholder="$t('endDestination.placeholder.country')"
                    @update:modelValue="clearErrorByField('country')"
                  ></v-autocomplete>
                </div>
              </v-col>
             </v-row>
             <v-row>
                   <v-col cols="12" sm="6" class="py-0">
                  <div class="mb-6">
                  <v-label>{{ $t('endDestination.label.city') }}</v-label>         
                    <v-autocomplete
                          v-model="endDestination.city"
                          variant="outlined"
                          class="mt-2"
                          color="primary"
                          clearable
                          :placeholder="$t('endDestination.placeholder.city')"
                          :items="cities"
                          item-value="id"
                          item-title="name"
                          :error-messages="errors.city"
                          @update:modelValue="clearErrorByField('city')"
                      ></v-autocomplete>
                  </div>
              </v-col>
             </v-row>
        </v-col>
    </v-row>
    
    <v-divider class="my-4"></v-divider>
      <div class="d-flex align-center justify-center mt-4 mb-7 mb-sm-0">
        <v-btn v-if="!isFromCompensationForm"  class="mt-5 mr-2" variant="outlined" :to="'/end-destinations'" size="large" >
        {{ $t('common.cancel')}}</v-btn>
          <v-btn :loading="isSubmitting" color="primary" class="mt-5" variant="flat" size="large" type="submit">
        {{ !isUpdateForm ? $t('endDestination.button.save') : $t('endDestination.button.update')}}</v-btn>
      </div>
 </v-form>
</v-card>
 </template>