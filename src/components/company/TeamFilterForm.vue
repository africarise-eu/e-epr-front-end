
<script setup lang="ts">
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { teamFilterSchema, } from '@/utils/validations/companyValidationRules';
import { defineEmits, defineProps, onMounted, reactive, ref, type Ref } from 'vue';

export interface InviteDto{
  firstName: string,
  lastName: string,
  email: string
}
export interface FilterFormDto {
    status: string|null
}
const regForm = reactive<FilterFormDto>({
  status: null,
})
const props= defineProps({
    status:{
        type: String,
        required:false,
        default:''
    }
})
const statusList: Ref<string[]> = ref([])
const isSubmitting = ref(false);
const errors: ErrorsDto = reactive({});
const filterSchema=teamFilterSchema();
const emit = defineEmits(['submit']);
regForm.status = props.status ?? null
const getCompanyList = async () => {
    statusList.value= ['enabled','disabled']
}
const validate = () => {
  const { error } = filterSchema.validate(regForm, { abortEarly: false });
  if (error) {
    error.details.forEach((detail: ErrorDetailDto) => {
      errors[detail.path[0]] = detail.message;
    });
    return false;
  }
  return true;
};
const submitForm = async () => {
  isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate()) {
    emit('submit', regForm);
   isSubmitting.value = false;
  } else {
    isSubmitting.value = false;
  }
  isSubmitting.value = false;
};
const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = '';
  }
};
onMounted(() => {
  getCompanyList();
})
</script>
<template>
    <div class="ml-n1">
        <v-form @submit.prevent="submitForm" class="d-flex flex-column form-container max-container">
            <div class="mb-4">
                <v-label>{{$t('company.label.status')}}</v-label>
                <v-autocomplete
                    v-model="regForm.status"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    clearable
                    closable-chips
                    :placeholder="$t('company.placeholder.status')"
                    :items="statusList"
                    item-value="id"
                    item-title="name"
                    :error-messages="errors.status"
                    @input="clearError('status')"
                ></v-autocomplete>
            </div>
            <div class="d-flex align-center justify-end mt-0 mb-7 mb-sm-0">
              <v-btn :loading="isSubmitting" color="primary" variant="flat" size="large" type="submit">
              {{$t('company.button.filter')}}</v-btn
            >
            </div>
            
          </v-form>
      </div>
</template>
<style lang="scss">
.link-container{
    .v-label{
        margin-top: -10px;
    }
}
</style>