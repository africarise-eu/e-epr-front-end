<script setup lang="ts">
import Logo from '@/layouts/dashboard/logo/LogoDark.vue';import { reactive, ref, type Ref } from 'vue';
import { resetPasswordSchema } from '@/utils/validationRules';
import { useRouter } from 'vue-router';
import { useApi, } from '@/composables/useApi';
import { USER } from '@/composables/apiEndpoints';
import { useSnackbarStore } from '@/stores/snackbar';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useI18n } from 'vue-i18n';
import ResetPasswordForm, { type ResetPswdFormProps } from '@/components/Auth/ResetPasswordForm.vue';

 const { t }= useI18n();
const snackbarStore = useSnackbarStore();
const router = useRouter();
const resetPswdSchema = resetPasswordSchema();
const isSubmitting = ref(false);
const regForm: Ref<ResetPswdFormProps> = ref({
  password: '',
  confirmPassword: '',
});
const errors:ErrorsDto = reactive({});

const validate = (formValue: ResetPswdFormProps) => {
  const {error} = resetPswdSchema.validate(formValue, {abortEarly: false})
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
    const { useAPI } = useApi();
    const currentUrl = window.location.href;
    try {
      const payload={
        password: regForm.value.password,
        url: currentUrl,
      }
      const result = await useAPI(USER.INVITE_USER_SET_PASSWORD, 'POST', payload);
      isSubmitting.value=false
      if(!result.error){
        snackbarStore.showMessage(result.message, 'success')
        router.push('/login');
      }
    } catch (error) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }

}
const updateFormData = (newData: ResetPswdFormProps) => {
  regForm.value = newData;
};
</script>

<template>
  <v-row class="bg-containerBg position-relative" no-gutters>
    <v-col cols="12">
      <div class="pt-6 pl-6">
        <Logo />
      </div>
    </v-col>
    <v-col cols="12" lg="12" class="d-flex align-center">
      <v-container>
        <div class="d-flex align-center justify-center" style="min-height: calc(100vh - 148px)">
          <v-row justify="center">
            <v-col cols="12" md="12">
              <v-card elevation="0" class="loginBox">
                <v-card elevation="24">
                  <v-card-text class="pa-sm-10 pa-6">
                    <!---Change password Form-->
                        <div>
                            <reset-password-form :is-change-password="false" :form-values="regForm" :submitButtonText="$t('authentication.button.setPassword')" :title="$t('authentication.head.setPassword')" :description="$t('authentication.other.setPasswordDescription')" @submit="submitForm" @update:formValues="updateFormData"></reset-password-form>
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
