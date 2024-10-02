<script setup lang="ts">
import { defineEmits, defineProps, reactive, ref, watch, onUnmounted, type PropType, type Ref, onMounted, computed} from 'vue';
import { otpVerificationSchema } from '@/utils/validationRules';
import {useI18n} from 'vue-i18n';;
import { DefaultTheme } from '@/theme/LightTheme';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';

export interface OtpFormProps {
    otp: string;
}

const { t }= useI18n();
const theme = reactive(DefaultTheme);
const otpverifySchema = otpVerificationSchema();
const isSubmitting = ref(false);const timer = ref(120); 
const formattedTime = computed(() => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
});
const emit = defineEmits(['submit','resend', 'update:formValues'])

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
  submitButtonText: {
    type: String,
    required: true,
    default: '',
  },
  formValues: {
    type: Object as PropType<OtpFormProps>,
    required: true,
    default:() => ({
        otp: '',
    }),
  },
})

const regForm = reactive({...prop.formValues});
const errors: ErrorsDto = reactive({});
const validate = () => {
  const {error} = otpverifySchema.validate(regForm, {abortEarly: false})
  if(error){
    error.details.forEach((detail: ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
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

const resendOtp = async() => {
  // Simulate sending OTP
  try {
    emit('resend', regForm);
    regForm.otp = '';
    timer.value = 120;
    startTimer();
  } catch (error) {
    const errorMsg = t('authentication.error.resendOtp');
    console.error(errorMsg, error);
  }
};
const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = ''
  }
}
const startTimer = () => {
  const interval = setInterval(() => {
    if (timer.value > 0) {
      timer.value--;
    } else {
      clearInterval(interval);
    }
  }, 1000);

  onUnmounted(() => {
    clearInterval(interval);
  });
};
watch(() => prop.formValues, (newData: OtpFormProps) => {
  regForm.otp= newData.otp
}, { deep: true });

watch(regForm, (newData: OtpFormProps) => {
  emit('update:formValues', newData);
}, { deep: true });

onMounted(() => {
  startTimer();
});
</script>
<template>    
    <div class="d-flex justify-space-between align-center">
        <h3 class="text-h3 text-center mb-0">{{title}}</h3>
      </div>
      <div class="text-h6 text-lightText mb-2">{{description}}</div>
      <v-form @submit.prevent="submitForm" class="mt-7 loginForm">
        <div class="mb-3">
          <v-otp-input
            v-model="regForm.otp"
            variant="solo"
            :error="errors.otp?true:false"
            @input="clearError('otp')"
          ></v-otp-input>
          <span v-if="errors.otp" class="error mt-1" :style="{ color: theme.colors?.error, fontSize:'12px' }">{{ errors.otp }}</span>
        </div>
        <div class="d-flex flex-row-reverse justify-space-between align-center">
          <v-btn variant="text" class="ps-2 mt-n1" :disabled="timer > 0" :style="{ color: theme.colors?.primary }" @click="resendOtp">{{$t('authentication.link.resendOtp')}}</v-btn>
          <span v-if="timer">{{$t("authentication.other.resendOtpDescription", {time: formattedTime})}}</span>
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

  
