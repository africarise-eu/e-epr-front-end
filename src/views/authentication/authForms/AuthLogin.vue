<script setup lang="ts">
import { nextTick, reactive, ref, type Ref } from 'vue';
import { loginSchema } from '@/utils/validationRules';
import { useApi } from '@/composables/useApi';
import { AUTH, USER } from '@/composables/apiEndpoints';
import { useRouter } from 'vue-router';
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import ForgotPasswordForm from '@/components/company/ForgotPasswordForm.vue';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useAuthStore } from '@/stores/auth';
import { useSnackbarStore } from '@/stores/snackbar';
import type { VTextField } from 'vuetify/components';
import  {ROLE} from '@/composables/role';

export interface loginDto {
    email: string,
    password: string,
  }

export interface LoginResponseDto {
  success: boolean,
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  roleId: number,
  accessToken: string,
  roleName: string,
  companyId: string,
  companyName: string,
  companyStatus: string,
  isVerified : boolean,
  profileImage : string,
  isProfileExist : boolean,
  isProfileVerified: boolean
}
const snackbarStore = useSnackbarStore();
// const userStore = useAuthStore();
const loginSchemas = loginSchema();
const router = useRouter();
const isSubmitting = ref(false);
const show1 = ref(false);
const regForm = reactive({
  email: '',
  password: ''
});
const errors: ErrorsDto = reactive({});
const showForgotPasswordModal = ref(false);
const auth = useAuthStore();
const validate = () => {
  const { error } = loginSchemas.validate(regForm, { abortEarly: false });
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
    const { useAPI } = useApi()
    try {
      const payload: loginDto = {
        email: regForm.email,
        password: regForm.password
      }
      const result = await useAPI<LoginResponseDto>(AUTH.LOGIN, 'POST', payload)
       if(!result.error){
        const userData = {
          accessToken: result.data.accessToken,
          email: result.data.email,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          roleId: result.data.roleId,
          companyId: result.data.companyId,
          companyName: result.data.companyName,
          companyStatus: result.data.companyStatus,
          roleName: result.data.roleName,
          isVerified: result.data.isVerified,
          profileImage: result.data.profileImage,
          isProfileExist: result.data.isProfileExist,
          isProfileVerified: result.data.isProfileVerified??false
        }
        auth.user = userData
        localStorage.setItem('user', JSON.stringify(userData))
        snackbarStore.showMessage(result.message, 'success');
        isSubmitting.value=false
        if(userData.roleId === ROLE.ADMIN){          
          router.push('/dashboard');
        }
        else if(userData.roleId === ROLE.VERIFIER){
          router.push('/verifier-dashboard');
        }
         else if(userData.roleId === ROLE.COMPANY || userData.roleId === ROLE.USER){
          router.push('/user-dashboard');
        }
      }else{
        isSubmitting.value = false;
      }
    } catch (error) {
      isSubmitting.value = false;
    }
  } else {
    isSubmitting.value = false;
  }
};

const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = '';
  }
};
const openModal = () => {
  showForgotPasswordModal.value = true;
};
const passwordField: Ref<InstanceType<typeof VTextField> | null>  = ref(null);
const togglePasswordVisibility = async () => {      
  const inputElement = passwordField.value?.$el.querySelector('input') as HTMLInputElement | null;
  if (inputElement) {
    const cursorPosition = inputElement.selectionStart ?? 0;
    show1.value = !show1.value;

    await nextTick();
    setTimeout(() => {
      const newInputElement = passwordField.value?.$el.querySelector('input') as HTMLInputElement | null;
      if (newInputElement) {
        newInputElement.focus();
        newInputElement.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  }
};

const submitForgotForm = async (formData: { email: string }) => {
  try {
    const { useAPI } = useApi();
      const payload={
        email: formData.email
      }
    const result = await useAPI(USER.SEND_RESET_PASSWORD_OTP, 'POST', payload);
    if(!result.error){
      localStorage.setItem('resetPasswordToken', JSON.stringify(result.data));
      localStorage.setItem('email', JSON.stringify({ email: formData.email, lastSentTime: Date.now() }));
      // userStore.setEmail(formData.email);
      router.push('/reset-password');
      snackbarStore.showMessage(result.message, 'success');
      showForgotPasswordModal.value = false;
    }else{
      snackbarStore.showMessage(result.message, 'error');
    }
  } catch (error) {
    console.error('Error in forgot password', error);
  }
};
</script>

<template>
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">{{ $t('authentication.head.login') }}</h3>
    <router-link to="/register" class="text-primary link-hover">{{ $t('authentication.link.noAccount') }}</router-link>
  </div>
  <v-form @submit.prevent="submitForm" class="mt-7 loginForm">
    <div class="mb-6">
      <v-label>{{ $t('authentication.label.email') }}*</v-label>
      <v-text-field
        v-model="regForm.email"
        :error-messages="errors.email"
        :placeholder="$t('authentication.placeholder.email')"
        class="mt-2"
        required
        hide-details="auto"
        variant="outlined"
        color="primary"
        @input="clearError('email')"
      ></v-text-field>
    </div>
    <div>
      <v-label>{{ $t('authentication.label.password') }}*</v-label>
      <v-text-field
        v-model="regForm.password"
        :error-messages="errors.password"
        :placeholder="$t('authentication.placeholder.password')"
        ref="passwordField"
        required
        variant="outlined"
        color="primary"
        hide-details="auto"
        :type="show1 ? 'text' : 'password'"
        class="mt-2"
        @input="clearError('password')"
      >
        <template v-slot:append-inner>
          <v-btn color="secondary" icon rounded variant="text" @click="togglePasswordVisibility"> 
            <EyeInvisibleOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == false" />
            <EyeOutlined :style="{ color: 'rgb(var(--v-theme-secondary))' }" v-if="show1 == true" />
          </v-btn>
        </template>
      </v-text-field>
    </div>
    <div class="d-flex align-center mt-4 mb-7 mb-sm-0">
      <div class="ml-auto">
        <v-btn variant="text" @click="openModal" class="text-primary link-hover">{{ $t('authentication.link.forgotPassword') }}</v-btn>
      </div>
    </div>
    <v-btn :loading="isSubmitting" color="primary" block class="mt-5" variant="flat" size="large" type="submit">
      {{ $t('authentication.button.login') }}</v-btn
    >
  </v-form>
  <ModalPopup v-model="showForgotPasswordModal" title="Forgot Password">
    <ForgotPasswordForm @submit="submitForgotForm" />
  </ModalPopup>
</template>
<style lang="scss">
.loginForm {
  .v-text-field .v-field--active input {
    font-weight: 500;
  }
}
</style>
