<script setup lang="ts">
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { changePasswordSchema, resetPasswordSchema } from '@/utils/validationRules';
import { defineEmits, defineProps, nextTick, reactive, ref, watch, type PropType, type Ref} from 'vue';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import type { VTextField } from 'vuetify/components';

export interface ResetPswdFormProps {
    currentPassword?: string,
    password: string,
    confirmPassword: string
}

const isSubmitting = ref(false);
const emit = defineEmits(['submit', 'update:formValues']);
const showPswd = ref(false);
const showCurrPswd= ref(false);
const showConfPswd = ref(false);

const prop = defineProps({
    title:{
        type: String,
        required: true,
        default: '',
    },
    description:{
        type: String,
        required: true,
        default: '',
    },
    isChangePassword:{
        type: Boolean,
        required: true,
        default: false,
    },
  submitButtonText: {
    type: String,
    required: true,
    default: '',
  },
  formValues: {
    type: Object as PropType<ResetPswdFormProps>,
    required: true,
    default:() => ({
        currentPassword:'',
        password: '',
        confirmPassword: '',
    }),
  },
})

const changePswdSchema = prop.isChangePassword?changePasswordSchema():resetPasswordSchema();
const regForm = reactive({...prop.formValues});
const errors: ErrorsDto = reactive({});
const validate = () => {
  const {error} = changePswdSchema.validate(regForm, {abortEarly: false})
  if(error){
    error.details.forEach((detail: ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}
const passwordField: Ref<InstanceType<typeof VTextField> | null>  = ref(null);
const confirmPasswordField: Ref<InstanceType<typeof VTextField> | null>  = ref(null);
const currentPasswordField: Ref<InstanceType<typeof VTextField> | null>  = ref(null);
const passwordVisibility = async () => {
  const inputElement = passwordField.value?.$el.querySelector('input') as HTMLInputElement | null;
  if (inputElement) {
    const cursorPosition = inputElement.selectionStart ?? 0;
    showPswd.value = !showPswd.value;

    await nextTick();
    setTimeout(() => {
      const newInputElement = passwordField.value?.$el.querySelector('input') as HTMLInputElement | null;
      if (newInputElement) {
        newInputElement.focus();
        newInputElement.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }
}
const confirmPasswordVisibility = async () => {
    const inputElement = confirmPasswordField.value?.$el.querySelector('input') as HTMLInputElement | null;
    if (inputElement) {
      const cursorPosition = inputElement.selectionStart ?? 0;
      showConfPswd.value = !showConfPswd.value;

      await nextTick();
      setTimeout(() => {
        const newInputElement = confirmPasswordField.value?.$el.querySelector('input') as HTMLInputElement | null;
        if (newInputElement) {
          newInputElement.focus();
          newInputElement.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }
const currentPasswordVisibility = async () => {
    const inputElement = currentPasswordField.value?.$el.querySelector('input') as HTMLInputElement | null;
    if (inputElement) {
      const cursorPosition = inputElement.selectionStart ?? 0;
      showCurrPswd.value = !showCurrPswd.value;

      await nextTick();
      setTimeout(() => {
        const newInputElement = currentPasswordField.value?.$el.querySelector('input') as HTMLInputElement | null;
        if (newInputElement) {
          newInputElement.focus();
          newInputElement.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
  }

const submitForm = async () => {
  isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate()) {
    try {
        emit('submit', regForm);
        isSubmitting.value=false
    } catch (error) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }

}
const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = ''
  }
}
watch(() => prop.formValues, (newData: ResetPswdFormProps) => {
  regForm.password= newData.password
  regForm.confirmPassword= newData.confirmPassword
}, { deep: true });

watch(regForm, (newData: ResetPswdFormProps) => {
  emit('update:formValues', newData);
}, { deep: true });
</script>
<template>
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h3 text-center mb-0">{{title}}</h3>
      </div>
      <div class="text-h6 text-lightText mb-2">{{description}}</div>
      <v-form @submit.prevent="submitForm" class="mt-7 loginForm">
        <div class="mb-6" v-if="isChangePassword">
            <v-label>{{$t('authentication.label.currentPassword')}}*</v-label>
            <v-text-field
              v-model="regForm.currentPassword"
              ref="currentPasswordField"
              :error-messages="errors.currentPassword"
              :placeholder="$t('authentication.placeholder.currentPassword')"
              required
              variant="outlined"
              color="primary"
              hide-details="auto"
              :type="showCurrPswd ? 'text' : 'password'"
              class="mt-2"
              @input="clearError('currentPassword')"
            >
              <template v-slot:append-inner>
                <v-btn color="secondary" icon rounded variant="text" @click="currentPasswordVisibility" >
                  <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showCurrPswd == false"/>
                  <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showCurrPswd == true" />
                </v-btn>
              </template>
            </v-text-field>
          </div>
        <div class="mb-6">
          <v-label>{{$t('authentication.label.newPassword')}}*</v-label>
          <v-text-field
            v-model="regForm.password"
            ref="passwordField"
            :error-messages="errors.password"
            :placeholder="$t('authentication.placeholder.newPassword')"
            required
            variant="outlined"
            color="primary"
            hide-details="auto"
            :type="showPswd ? 'text' : 'password'"
            class="mt-2"
            @input="clearError('password')"
          >
            <template v-slot:append-inner>
              <v-btn color="secondary" icon rounded variant="text" @click="passwordVisibility">
                <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showPswd == false" />
                <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showPswd == true" />
              </v-btn>
            </template>
          </v-text-field>
        </div>
        <div class="mb-6">
          <v-label>{{$t('authentication.label.confirmPassword')}}*</v-label>
          <v-text-field
            ref="confirmPasswordField"
            v-model="regForm.confirmPassword"
            :error-messages="errors.confirmPassword"
            :placeholder="$t('authentication.placeholder.confirmPassword')"
            required
            variant="outlined"
            color="primary"
            hide-details="auto"
            :type="showConfPswd ? 'text' : 'password'"
            class="mt-2"
            @input="clearError('confirmPassword')"
          >
            <template v-slot:append-inner>
              <v-btn color="secondary" icon rounded variant="text" @click="confirmPasswordVisibility">
                <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showConfPswd == false" />
                <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="showConfPswd == true" />
              </v-btn>
            </template>
          </v-text-field>
        </div>
        <v-btn :loading="isSubmitting" color="primary" block class="mt-5" variant="flat" size="large" type="submit">
          {{submitButtonText}}</v-btn
        >
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
  