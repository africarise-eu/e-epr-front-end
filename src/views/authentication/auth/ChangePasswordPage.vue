<script setup lang="ts">
import Logo from '@/layouts/dashboard/logo/LogoDark.vue';import { onMounted, onUnmounted, reactive, ref, type Ref } from 'vue';
import { changePasswordSchema, otpVerificationSchema } from '@/utils/validationRules';
import { useRouter } from 'vue-router';
import { useApi, } from '@/composables/useApi';
import { USER } from '@/composables/apiEndpoints';
import { useSnackbarStore } from '@/stores/snackbar';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useI18n } from 'vue-i18n';
import OtpVerificationForm , {type OtpFormProps } from '@/components/Auth/OtpVerificationForm.vue';
import ResetPasswordForm, { type ResetPswdFormProps } from '@/components/Auth/ResetPasswordForm.vue';

 const { t }= useI18n();
const snackbarStore = useSnackbarStore();
const router = useRouter();
const user =  localStorage.getItem('user');
const email = JSON.parse(user!).email;
const changePswdSchema = changePasswordSchema();
const otpverifySchema = otpVerificationSchema();
const isSubmitting = ref(false);
const showOtp = ref(true);
const otpForm: Ref<OtpFormProps> = ref({
  otp:'',
});
const regForm: Ref<ResetPswdFormProps> = ref({
  password: '',
  confirmPassword: '',
});
const errors:ErrorsDto = reactive({});
const validateOtp = (formValue: OtpFormProps) => {
  const {error} = otpverifySchema.validate(formValue, {abortEarly: false})
  if(error){
    error.details.forEach((detail:ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}

const validate = (formValue: ResetPswdFormProps) => {
  const {error} = changePswdSchema.validate(formValue, {abortEarly: false})
  if(error){
    error.details.forEach((detail:ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}
const submitForm = async (formValue: ResetPswdFormProps) => {
  isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate(formValue)) {
    regForm.value = formValue;
    const resetPasswordToken =  localStorage.getItem('resetPasswordToken');
    const { useAPI } = useApi();
    try {
      const payload={
        currentPassword: regForm.value.currentPassword,
        newPassword: regForm.value.password,
        otp: otpForm.value.otp,
        token: JSON.parse(resetPasswordToken??'')
      }
      const result = await useAPI(USER.CHANGE_PASSWORD, 'POST', payload);
      isSubmitting.value=false
      if(!result.error){
        snackbarStore.showMessage(result.message, 'success')
        localStorage.removeItem('resetPasswordToken')
        router.push('/dashboard');
      }
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
    const { useAPI } = useApi();
      const email = JSON.parse(user??'').email;
      const payload={
        email: email
      }
    const result = await useAPI(USER.SEND_CHANGE_PASSWORD_OTP, 'POST', payload);
    localStorage.setItem('email', JSON.stringify({ lastSentTime: Date.now() }));
    if(!result.error){
      localStorage.setItem('resetPasswordToken', JSON.stringify(result.data));
      snackbarStore.showMessage(result.message, 'success');
    }
  } catch (error) {
    const errorMsg = t('authentication.error.resendOtp');
    console.error(errorMsg, error);
  }
};

const submitOtpForm = async (formValue: OtpFormProps) => {
  isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validateOtp(formValue)) {
    otpForm.value = formValue;
    const { useAPI } = useApi();
      const resetPasswordToken =  localStorage.getItem('resetPasswordToken');
    try {
      const payload={
        otp: otpForm.value.otp,
        token: JSON.parse(resetPasswordToken??'')
      }
      const result = await useAPI(USER.VERIFY_OTP, 'POST', payload);
      isSubmitting.value=false
      if(!result.error){
        snackbarStore.showMessage(result.message, 'success')
        showOtp.value = false;
      }
    } catch (error) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
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
      const payload={
        email: email
      }
    const result = await useAPI(USER.SEND_RESET_PASSWORD_OTP, 'POST', payload);
    localStorage.setItem('email', JSON.stringify({lastSentTime: Date.now() }));
    if(!result.error){
      localStorage.setItem('resetPasswordToken', JSON.stringify(result.data));
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
  <v-row class="bg-containerBg position-relative" no-gutters>
    <v-col cols="12" lg="12" class="d-flex align-center">
      <v-container>
        <div class="d-flex align-center justify-center" style="min-height: calc(100vh - 148px)">
          <v-row justify="center">
            <v-col cols="12" md="12">
              <v-card elevation="0" class="loginBox">
                <v-card elevation="24">
                  <v-card-text class="pa-sm-10 pa-6">
                    <!---Change password Form-->
                        <div v-if="showOtp">
                            <otp-verification-form :form-values="otpForm" :submitButtonText="$t('authentication.button.verifyOtp')" :title="$t('authentication.head.otpVerification')" :description="$t('authentication.other.otpVerificationDescription')" @submit="submitOtpForm" @resend="resendOtp" @update:formValues="updateOtpFormData"></otp-verification-form>
                        </div>
                        <div v-else>
                            <reset-password-form :isChangePassword="true" :form-values="regForm" :submitButtonText="$t('authentication.button.changePassword')" :title="$t('authentication.head.changePassword')" :description="$t('authentication.other.changePasswordDescription')" @submit="submitForm" @update:formValues="updateFormData"></reset-password-form>
                        </div>
                    <!---Change password Form-->
                  </v-card-text>
                </v-card>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </v-col>
  </v-row>
</template>
<style lang="scss">
.loginBox {
  max-width: 475px;
  margin: 0 auto;
}
.blur-logo {
  position: absolute;
  filter: blur(18px);
  bottom: 0;
  transform: inherit;
}
.loginForm {
    .v-text-field .v-field--active input {
      font-weight: 500;
    }
  }
</style>
