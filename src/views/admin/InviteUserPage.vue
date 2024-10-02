
<script setup lang="ts">
import { ADMIN } from '@/composables/apiEndpoints';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useApi } from '@/composables/useApi';
import { adminInviteUserSchema } from '@/utils/validations/companyValidationRules';
import { computed, reactive, ref, onMounted, inject } from 'vue';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons-vue';
import { useSnackbarStore } from '@/stores/snackbar';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { useI18n } from 'vue-i18n';

export interface InviteDto{
  firstName: string,
  lastName: string,
  email: string,
  roleId: number
}
export interface InviteResponseDto {
    isActive: boolean,
    isVerified: boolean,
    id: number,
    firstName: string,
    lastName: string,
    email: string,
    inviteLink: string,
    inviteLinkExpiration: string,
    roleId: number,
    updatedAt: string,
    createdAt: string,
    password?: string,
    imagePath?: string,
    status?: string,
    otp?: string,
    otpExpiration?: string,
    otpToken?: string,
    accessToken?: string
}
const regForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  roleId:0
})
const snackbarStore=useSnackbarStore();
const { t }= useI18n();
const isSubmitting = ref(false);
const linkText = ref('');
const errors: ErrorsDto = reactive({});
const inviteSchema=adminInviteUserSchema();
const copied = ref(false);

const copyIcon = computed(() => copied.value ? CheckOutlined : CopyOutlined);
const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = '';
  }
};
const validate = () => {
  const { error } = inviteSchema.validate(regForm, { abortEarly: false });
  if (error) {
    error.details.forEach((detail: ErrorDetailDto) => {
      errors[detail.path[0]] = detail.message;
    });
    return false;
  }
  return true;
};
const submitForm = async () => {
  // isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate()) {
    const { useAPI } = useApi()
    try {
      const payload: InviteDto = {
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        roleId: regForm.roleId
      }
      const result = await useAPI<InviteResponseDto>(ADMIN.INVITE_USER, 'POST', payload)
       isSubmitting.value=false
       if(!result.error){
            snackbarStore.showMessage('admin.success.userInvited', 'success');
            linkText.value = result.data.inviteLink
        }
    } catch (error) {
      isSubmitting.value = false;
    }
  } else {
    isSubmitting.value = false;
  }
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(linkText.value);
    copied.value = true;
    snackbarStore.showMessage('Link copied to clipboard', 'success');
    setTimeout(() => {
      copied.value = false;
    }, 1000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted( async() => {
    updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('admin.head.inviteUser'), href: '' },
    ]);
});
</script>
<template>
    <div>
        <h3 class="text-h3 text-start py-4">{{$t('admin.head.inviteUser')}}</h3>
    </div>
    <div class="d-flex flex-column justify-center align-center mt-8">
        <v-card class="pa-10" max-width="600">
            <v-form @submit.prevent="submitForm" class="d-flex flex-column form-container max-container">
                <div class="mb-4">
                    <v-label>{{$t('admin.label.firstName')}}*</v-label>
                    <v-text-field
                        v-model="regForm.firstName"
                        :error-messages="errors.firstName"
                        :placeholder="$t('admin.placeholder.firstName')"
                        class="mt-2"
                        required
                        hide-details="auto"
                        variant="outlined"
                        color="primary"
                        @input="clearError('firstName')"
                    ></v-text-field>
                </div>
                <div class="mb-4">
                    <v-label>{{$t('admin.label.lastName')}}*</v-label>
                    <v-text-field
                        v-model="regForm.lastName"
                        :error-messages="errors.lastName"
                        :placeholder="$t('admin.placeholder.lastName')"
                        class="mt-2"
                        required
                        hide-details="auto"
                        variant="outlined"
                        color="primary"
                        @input="clearError('lastName')"
                    ></v-text-field>
                </div>
                <div class="mb-4">
                    <v-label>{{$t('admin.label.email')}}*</v-label>
                    <v-text-field
                    v-model="regForm.email"
                    :error-messages="errors.email"
                    :placeholder="$t('admin.placeholder.email')"
                    class="mt-2"
                    required
                    hide-details="auto"
                    variant="outlined"
                    color="primary"
                    @input="clearError('email')"
                    ></v-text-field>
                </div>
                
                <div class="mb-4">
                    <v-label>{{$t('admin.label.role')}}*</v-label>
                    <v-radio-group inline v-model="regForm.roleId" @update:modelValue="clearError('roleId')"
                    :error-messages="errors.roleId">
                        <v-radio class="ml-n2" :label="$t('admin.label.verifier')" value="2"></v-radio>
                        <v-radio :label="$t('admin.label.company')" value="3"></v-radio>
                    </v-radio-group>
                </div>
                <div class="d-flex align-center justify-end mt-0 mb-7 mb-sm-0">
                <v-btn :loading="isSubmitting" color="primary" variant="flat" size="large" type="submit">
                {{$t('admin.button.inviteUser')}}</v-btn
                >
                </div>
                
            </v-form>
        </v-card>
        <v-card class="mt-4 px-10 pt-4" max-width="600" v-if="linkText">
            <div class="link-container">
                <v-label>{{$t('company.other.clickToCopy')}}</v-label>
                <v-text-field
                v-model="linkText"
                label=""
                type="text"
                readonly
                @click="copyToClipboard"
            >
                <template v-slot:append-inner>
                <v-icon @click="copyToClipboard">
                    <component :is="copyIcon" />
                </v-icon>
                </template>
            </v-text-field>
            </div>
        </v-card>
      </div>
</template>
<style lang="scss">
.link-container{
    .v-label{
        margin-top: -10px;
    }
}
</style>