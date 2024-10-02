<script setup lang="ts">
import { ref, reactive, defineProps, watch, computed, onMounted, type PropType } from 'vue';
import { importSchema } from '@/utils/validationRules';
import { useApi} from '@/composables/useApi';
import { useSnackbarStore } from '@/stores/snackbar';
import type {ErrorsDto} from '@/composables/formError';
import type importShipmentDto from '@/composables/imports/importShipment';
import ImportShipmentProducts from "@/components/imports/ImportShipmentProducts.vue";
import { DefaultTheme } from '@/theme/LightTheme';
import { useI18n } from "vue-i18n";
import { debounce } from 'lodash';
import { IMPORT } from '@/composables/apiEndpoints';
import { useRouter } from 'vue-router';
import type importShipmentProductDto from '@/composables/imports/importShipmentProduct';
import { CalendarOutlined } from '@ant-design/icons-vue';
import { getCountries, getPorts } from '@/composables/services/commonServices';
import type {Country} from '@/composables/country';
import type {Port} from '@/composables/port';
import {formatDate} from '@/utils/date/dateFormat';

const props = defineProps({
  importShipmentDetails: {
    type: Object as PropType<importShipmentDto>,
    required: true
  }
});

const router = useRouter();
const importShipment = reactive(props.importShipmentDetails);
const errors = reactive<ErrorsDto>({});
const isSubmitting = ref(false);
const importSchemas = importSchema();
const snackbarStore = useSnackbarStore();
const formattedDate = computed(() =>  selectedDate.value ? formatDate(selectedDate.value)  : '');
const fieldsToExcludeFromValidation = ['id', 'etaDate', 'status', 'productUnits', 'payStatus', 'countries','arrivalPorts','taeValue', 'rejectedReason'];
const countries = ref<Country[]>([]);
const ports = ref<Port[]>([]);
const dateMenu = ref<null | any>(null);
const isMenuOpen = ref(false);
const selectedDate = ref<Date>(new Date(props.importShipmentDetails.etaDate || new Date()));

const validate = () => {
  const fieldsToValidate = { ...importShipment } as { [key: string]: any };
  fieldsToExcludeFromValidation.forEach(field => delete fieldsToValidate[field]);
  const { error } = importSchemas.validate(fieldsToValidate, { abortEarly: false });
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
      importShipment.etaDate = selectedDate.value.toISOString();
      const taeTotal = importShipment.products.reduce((sum, item) => sum + item.taeTotalValue, 0);
      importShipment.taeValue =  parseFloat(taeTotal.toFixed(2));
      importShipment.productUnits =  importShipment.products.reduce((sum, item) => sum + item.units, 0) || 0;
      if (!isUpdateForm.value) {
        result = await useAPI<string>(IMPORT.ADD, 'POST', importShipment);
      } else {
        result = await useAPI<string>(IMPORT.UPDATE, 'PATCH', importShipment); // Assuming PUT for updates
      }
      snackbarStore.showMessage(result.message, 'success')
      isSubmitting.value=false;
      router.push({ name: 'ImportShipmentList'});

    } catch (error :any) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }
}

const isUpdateForm = computed(() => {
  return importShipment.id !== 0; // or any other condition based on shipment.id change
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

const handleProducts = (productItems: importShipmentProductDto[]) => {
  importShipment.products = productItems;
}

const fetchCountries = async () => {
  try {
    const fetchedCountries = await getCountries();
    countries.value = fetchedCountries || [];
  } catch (error) {
    console.error('Failed to fetch countries:', error);
  }
};

const fetchPorts = async () => {
  try { 
    const fetchedPorts = await getPorts();
    ports.value = fetchedPorts || [];
  } catch (error) {
    console.error('Failed to fetch ports:', error);
  }
};


// const handleCities = async() => {
//   cities.value = await getCities(importShipment.fromCountry);
//   clearErrorByField('fromCountry')
// }

// Watch for changes in props.importShipmentDetails.etaDate
watch(() => props.importShipmentDetails.etaDate, (newValue :any) => {
  selectedDate.value = newValue ? new Date(newValue) : new Date();
}, { immediate: true });

watch(selectedDate, () => {
    isMenuOpen.value = false;
});

watch(importShipment.products, () => {
  if(importShipment.products.length > 0)
  {
     clearErrorByField('products');
     importShipment.products.forEach((product:any) => {
        product.units = product.units ? Math.max(product.units, 1) : 1;
        product.taeTotalValue = product.taeTotalValue * product.units;
     });
     importShipment.productUnits =  importShipment.products.reduce((sum, item) => sum + item.units, 0) || 0;
  }
});

onMounted(async () => {
  await fetchCountries();
  await fetchPorts();
});
</script>

<template>
  <v-form @submit.prevent="submitForm" class="mt-7 addProductForm">
    <v-row>
      <v-col cols="12" class="py-0">
            <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('import.label.cdNo') }}*</v-label>
                <v-text-field
                    hide-details="auto"
                    required
                    v-model="importShipment.cdNo"
                    :error-messages="errors.cdNo ? [errors.cdNo] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    maxlength="50"
                    :placeholder="$t('import.placeholder.cdNo')"
                    @input="clearErrorByField('cdNo')"
                ></v-text-field>
                </div>
              </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('import.label.etaDate') }}*</v-label>
                <v-menu v-model= "isMenuOpen" :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                          <v-text-field :placeholder="$t('import.placeholder.etaDate')"
                          hide-details="auto"
                          required
                          variant="outlined"
                          class="mt-2"
                          color="primary"
                          :model-value="formattedDate" v-bind="props"
                          :error-messages="errors.etaDate ? [errors.etaDate] : []"
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
            </v-row>
            <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('import.label.arrivalPort') }}*</v-label>
                   <v-select
                    :items="ports"
                    v-model="importShipment.arrivalPort"
                    :error-messages="errors.arrivalPort ? [errors.arrivalPort] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    item-value="id"
                    item-title="portname"
                    :placeholder="$t('import.placeholder.arrivalPort')"
                    @input="clearErrorByField('arrivalPort')"
                  ></v-select>
                </div>
              </v-col>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('import.label.countryId') }}*</v-label>
                  <v-select
                    :items="countries"
                    v-model="importShipment.countryId"
                    :error-messages="errors.countryId ? [errors.countryId] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    item-value="id"
                    item-title="name"
                    :placeholder="$t('import.placeholder.countryId')"
                    @input="clearErrorByField('countryId')"
                  ></v-select>
             </div>
               </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" sm="6" class="py-0">
                <div class="mb-6">
                <v-label>{{ $t('import.label.fromPort') }}*</v-label>
                <v-text-field
                    hide-details="auto"
                    required
                    v-model="importShipment.fromPort"
                    :error-messages="errors.fromPort ? [errors.fromPort] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    maxlength="50"
                    :placeholder="$t('import.placeholder.fromPort')"
                    @input="clearErrorByField('fromPort')"
                ></v-text-field>
                </div>
              </v-col>
            </v-row>
        </v-col>
    </v-row>
    <v-divider class="my-4"></v-divider>
     <ImportShipmentProducts :product-list="importShipment.products" :handle-products="handleProducts"
      :error-message ="errors.products ? errors.products : ''" />
      <div class="d-flex align-center justify-center mt-4 mb-7 mb-sm-0">
        <v-btn :loading="isSubmitting" class="mt-5 mr-2" variant="outlined" :to="'/imports'" size="large" >
        {{ $t('common.cancel')}}</v-btn>
          <v-btn :loading="isSubmitting" color="primary" class="mt-5" variant="flat" size="large" type="submit">
        {{ !isUpdateForm ? $t('import.button.submit') : $t('import.button.update') }}</v-btn>
      </div>
 </v-form>
 </template>