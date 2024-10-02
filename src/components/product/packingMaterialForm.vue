<script setup lang="ts">
import { PRODUCT } from '@/composables/apiEndpoints';
import { useApi} from '@/composables/useApi';
import type packingMaterialDto from '@/composables/product/packingMaterial';
import type TAE_Fee from '@/composables/product/TAE_fee';
import { computed, defineProps, reactive, watch,  type PropType } from 'vue';
import type {ErrorsDto} from '@/composables/formError';
import {calculateTotalTae} from '@/composables/services/taeCalculations';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  packingMaterial: {
    type: Object as PropType<packingMaterialDto>,
    required: true
  },
   packingMaterials: {
    type: Object as PropType<packingMaterialDto[]>,
    required: true
  }
});
const {t} = useI18n();
const packingMaterial = reactive(props.packingMaterial);
const packingMaterials = reactive(props.packingMaterials);
const errors = reactive<ErrorsDto>({});
const getTAE_Fees = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<Array<TAE_Fee>>(PRODUCT.TAE_FEES, 'GET', {});
  if(result.data)
  {
      return result.data.filter(taeFee => {
      // Ensure the TAE fee should not be included if it matches the current packing material's ID
      if (taeFee.id === packingMaterial.materialId) {
        return true;
      }
      
      // Ensure the TAE fee is not included if its ID exists in the packingMaterials list
      return packingMaterials.every(pm => pm.materialId !== taeFee.id);
    });
  }
  return []; 
};
let TAE_fees = await getTAE_Fees();

const totalWeight = computed(() => {
  let newtotalWeight: number = 0;
  if (packingMaterial.materialId != null && packingMaterial.weight != null) {
    assignTAEPerKG(packingMaterial.materialId);
    newtotalWeight = calculateTotalTae(packingMaterial.weight,packingMaterial.TAE_KG);
  }
  return newtotalWeight;
});

const validateForm = () => {
  let isValid = true;
  if (!packingMaterial.materialId) {
    errors.materialId = t('product.validation.packingMaterials.meterialRequired');
    isValid = false;
  }
  if (!packingMaterial.weight) {
    errors.weight = t('product.validation.packingMaterials.weightRequired');
    isValid = false;
  }
  return isValid;
};

const submitForm = async () => {
   if (validateForm()) {
      packingMaterial.TAE_Total = totalWeight.value;
      if (packingMaterial.addPackingMaterialHandler) {
        packingMaterial.addPackingMaterialHandler(packingMaterial);
      }
   }
};

const assignTAEPerKG = (newValue: number) => {
  clearError('materialId');
  if (TAE_fees != null) {
    let selectedTaeFee = TAE_fees.filter((x: any) => x.id == newValue)[0];
    if (selectedTaeFee) {
      packingMaterial.TAE_KG = selectedTaeFee.taeFeeMtKg;
      packingMaterial.material = selectedTaeFee.material;
    }
  }
};
const handleWeight = (item: packingMaterialDto)=>{ 
   if (isNaN(item.weight) || item.weight < 0) {
    item.weight = 0; // Reset the field if the value is invalid
  }
  
  clearError('weight')
}

const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = '';
  }
};

const resetPackingMaterial = () => {
  packingMaterial.id = 0;
  packingMaterial.materialId = 0;
  packingMaterial.material = '';
  packingMaterial.weight = 0;
  packingMaterial.TAE_KG = 0;
  packingMaterial.TAE_Total = 0;
  packingMaterial.verification = '';
};

watch(() => packingMaterial.materialId, (newValue: any) => {
  if (newValue == null || newValue === '') {
    resetPackingMaterial();
  }
});
</script>
<template>
  <v-form @submit.prevent="submitForm">
    <v-row class="my-6">
      <v-col cols="12" class="py-0">
        <v-label>{{ $t('packingMaterial.label.material') }}</v-label>
        <v-autocomplete
          v-model="packingMaterial.materialId"
          variant="outlined"
          class="mt-2"
          color="primary"
          clearable
          :placeholder="$t('packingMaterial.label.material')"
          :items="TAE_fees"
          item-value="id"
          :item-title="(item:packingMaterialDto) => $t(`common.packagingMaterial.${item.material}`)"
          @update:modelValue="assignTAEPerKG"
          :error-messages="errors.materialId ? [errors.materialId] : []"  
        ></v-autocomplete>
    
      </v-col>
      <v-col cols="12" class="py-0">
        <v-label>{{ $t('packingMaterial.label.weight') }}*</v-label>
        <v-text-field
          v-model="packingMaterial.weight"
          required
          variant="outlined"
          class="mt-2"
          color="primary"
          type="number"           
          maxlength="20"          
          min="1" 
          :placeholder="$t('packingMaterial.label.weight')"
          :error-messages="errors.weight ? [errors.weight] : []"  
          @input="handleWeight(packingMaterial)"
        ></v-text-field>
      </v-col>
      <v-col cols="12" class="py-0">
        <v-label>{{ $t('packingMaterial.label.TAE_KG') }}*</v-label>
        <v-text-field
          v-model="packingMaterial.TAE_KG"
          required
          variant="outlined"
          readonly
          class="mt-2"
          color="primary"
          :placeholder="$t('packingMaterial.label.TAE_KG')"
        ></v-text-field>
      </v-col>
      <v-col cols="12" class="py-0">
        <v-label>{{ $t('packingMaterial.label.TAE_Total') }}*</v-label>
        <v-text-field
          v-model="totalWeight"
          required
          readonly
          variant="outlined"
          class="mt-2"
          color="primary"
          :placeholder="$t('packingMaterial.label.TAE_Total')"
        ></v-text-field>
      </v-col>
    </v-row>
    <v-btn color="primary" block class="mt-4" variant="flat" size="large" type="submit">{{ packingMaterial.id ==0 ? $t('packingMaterial.button.add') : $t('packingMaterial.button.update') }}</v-btn>
  </v-form>
</template>
