
<script setup lang="ts">
import { COMPANY } from '@/composables/apiEndpoints';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { useApi } from '@/composables/useApi';
import { inviteUserSchema } from '@/utils/validations/companyValidationRules';
import { computed, defineEmits, reactive, ref } from 'vue';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons-vue';
import { useSnackbarStore } from '@/stores/snackbar';

export interface InviteDto{
  firstName: string,
  lastName: string,
  email: string
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
})
const snackbarStore=useSnackbarStore();
const isSubmitting = ref(false);
const linkText = ref('');
const errors: ErrorsDto = reactive({});
const inviteSchema=inviteUserSchema();
const copied = ref(false);
const emit = defineEmits(['submit'])

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
        email: regForm.email
      }
      const result = await useAPI<InviteResponseDto>(COMPANY.INVITE_USER, 'POST', payload)
       isSubmitting.value=false
       if(!result.error){
            linkText.value = result.data.inviteLink
            emit('submit', result.data);
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
</script>
<template>
    <div class="ml-n1">
        <v-form @submit.prevent="submitForm" class="d-flex flex-column form-container max-container">
                    <div class="mb-4">
                      <v-label>{{$t('company.label.firstName')}}*</v-label>
                      <v-text-field
                          v-model="regForm.firstName"
                          :error-messages="errors.firstName"
                          :placeholder="$t('company.placeholder.firstName')"
                          class="mt-2"
                          required
                          hide-details="auto"
                          variant="outlined"
                          color="primary"
                          @input="clearError('firstName')"
                      ></v-text-field>
                    </div>
                    <div class="mb-4">
                      <v-label>{{$t('company.label.lastName')}}*</v-label>
                      <v-text-field
                        v-model="regForm.lastName"
                        :error-messages="errors.lastName"
                        :placeholder="$t('company.placeholder.lastName')"
                        class="mt-2"
                        required
                        hide-details="auto"
                        variant="outlined"
                        color="primary"
                        @input="clearError('lastName')"
                    ></v-text-field>
                    </div>
            <div class="mb-4">
                <v-label>{{$t('company.label.email')}}*</v-label>
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
            <div class="d-flex align-center justify-end mt-0 mb-7 mb-sm-0">
              <v-btn :loading="isSubmitting" color="primary" variant="flat" size="large" type="submit">
              {{$t('company.button.inviteMembers')}}</v-btn
            >
            </div>
            
          </v-form>
          <div class="link-container mt-4" v-if="linkText">
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
      </div>
</template>
<style lang="scss">
.link-container{
    .v-label{
        margin-top: -10px;
    }
}
</style>