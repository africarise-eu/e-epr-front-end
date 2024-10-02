<script setup lang="ts">
import { onMounted, reactive, ref, type Ref } from 'vue';
import { otpVerificationSchema, resetPasswordSchema } from '@/utils/validationRules';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { USER } from '@/composables/apiEndpoints';
import { useSnackbarStore } from '@/stores/snackbar';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useI18n } from 'vue-i18n';
import OtpVerificationForm, { type OtpFormProps } from '@/components/Auth/OtpVerificationForm.vue';
import ResetPasswordForm, { type ResetPswdFormProps } from '@/components/Auth/ResetPasswordForm.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
//  const userStore = useAuthStore();
const snackbarStore = useSnackbarStore();
const router = useRouter();
const user = localStorage.getItem('email');
const email = JSON.parse(user ?? '').email;
const changePswdSchema = resetPasswordSchema();
const otpverifySchema = otpVerificationSchema();
const isSubmitting = ref(false);
const showOtp = ref(true);

// const email = userStore.email;
const otpForm: Ref<OtpFormProps> = ref({
  otp: '',
});
const regForm: Ref<ResetPswdFormProps> = ref({
  password: '',
  confirmPassword: '',
});
const errors: ErrorsDto = reactive({});
const validateOtp = (formValue: OtpFormProps) => {
  const { error } = otpverifySchema.validate(formValue, { abortEarly: false })
  if (error) {
    error.details.forEach((detail: ErrorDetailDto) => {
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}

const validate = (formValue: ResetPswdFormProps) => {
  const { error } = changePswdSchema.validate(formValue, { abortEarly: false })
  if (error) {
    error.details.forEach((detail: ErrorDetailDto) => {
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}
const submitForm = async (formValue: ResetPswdFormProps) => {
  isSubmitting.value = true
  Object.keys(errors).forEach(key => errors[key] = '')
  if (validate(formValue)) {
    regForm.value = formValue;
    const resetPasswordToken = localStorage.getItem('resetPasswordToken');
    const { useAPI } = useApi();
    try {
      const payload = {
        newPassword: regForm.value.password,
        otp: otpForm.value.otp,
        token: JSON.parse(resetPasswordToken ?? '')
      }
      const result = await useAPI(USER.RESET_PASSWORD, 'POST', payload);
      isSubmitting.value = false
      if (!result.error) {
        snackbarStore.showMessage(result.message, 'success')
        localStorage.removeItem('resetPasswordToken')
        router.push('/login');
      }
    } catch (error) {
      isSubmitting.value = false
    }
  } else {
    isSubmitting.value = false
  }

}
const resendOtp = async () => {
  // Simulate sending OTP
  try {
    const { useAPI } = useApi();
    // const email = JSON.parse(user??'').email;
    // const email = userStore.email;
    const payload = {
      email: email
    }
    const result = await useAPI(USER.SEND_RESET_PASSWORD_OTP, 'POST', payload);
    if (!result.error) {
      localStorage.setItem('resetPasswordToken', JSON.stringify(result.data));
      localStorage.setItem('email', JSON.stringify({ email: email, lastSentTime: Date.now() }));
      snackbarStore.showMessage(result.message, 'success');
    }
  } catch (error) {
    const errorMsg = t('authentication.error.resendOtp');
    console.error(errorMsg, error);
  }
};

const submitOtpForm = async (formValue: OtpFormProps) => {
  isSubmitting.value = true
  Object.keys(errors).forEach(key => errors[key] = '')
  if (validateOtp(formValue)) {
    otpForm.value = formValue;
    const { useAPI } = useApi();
    const resetPasswordToken = localStorage.getItem('resetPasswordToken');
    try {
      const payload = {
        otp: otpForm.value.otp,
        token: JSON.parse(resetPasswordToken ?? '')
      }
      const result = await useAPI(USER.VERIFY_OTP, 'POST', payload);
      isSubmitting.value = false
      if (!result.error) {
        snackbarStore.showMessage(result.message, 'success')
        showOtp.value = false;
      }
    } catch (error) {
      isSubmitting.value = false
    }
  } else {
    isSubmitting.value = false
  }

}
const updateOtpFormData = (newData: OtpFormProps) => {
  otpForm.value = newData;
};
const updateFormData = (newData: ResetPswdFormProps) => {
  regForm.value = newData;
};

const sendOtpMail = async () => {
  try {
    const { useAPI } = useApi();
    const payload = {
      email: email
    }
    const result = await useAPI(USER.SEND_RESET_PASSWORD_OTP, 'POST', payload);
    if (!result.error) {
      localStorage.setItem('resetPasswordToken', JSON.stringify(result.data));
      localStorage.setItem('email', JSON.stringify({ email: email, lastSentTime: Date.now() }));
    }
  } catch (error) {
    console.error('Error in sending', error);
  }
};
onMounted(() => {
  const navigationType = (window.performance.getEntries()[0] as PerformanceNavigationTiming).type;
  if (navigationType === 'reload') {
    const lastSentTime = JSON.parse(localStorage.getItem('email') ?? '').lastSentTime;
    if((Date.now() - lastSentTime)>=120000 ){
      sendOtpMail()
    }
  }
})
</script>

<template>
  <div v-if="showOtp">
    <div class="otp-verification-container">
    <div class="header-container">
      <h2>{{ $t('authentication.head.otpVerification') }}</h2>
      <router-link to="/login" class="text-primary text-decoration-none back-to-login">
        {{ $t('authentication.link.backToLogin') }}
      </router-link>
    </div>
  </div>
    <otp-verification-form :form-values="otpForm" :submitButtonText="$t('authentication.button.verifyOtp')"
      :description="$t('authentication.other.otpVerificationDescription')" @submit="submitOtpForm" @resend="resendOtp"
      @update:formValues="updateOtpFormData"></otp-verification-form> 
  </div>
  <div v-else>
    <reset-password-form :form-values="regForm" :isChangePassword="false"
      :submitButtonText="$t('authentication.button.resetPassword')" :title="$t('authentication.head.resetPassword')"
      :description="$t('authentication.other.resetPasswordDescription')" @submit="submitForm"
      @update:formValues="updateFormData"></reset-password-form>
  </div>
</template>
<style lang="scss">
.loginForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}

.otp-verification-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 5px;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

h2 {
  margin: 0;
}

.back-to-login {
  margin-left: auto;
}

.back-to-login:hover {
   font-weight: 700;
   transition: background-color 0.3s ease;
}

.v-otp-input {
  justify-content: normal !important;
}

.v-otp-input__content {
padding: 0.5rem 0.5rem 0.5rem 0 !important; 
}
</style>
