<template>
    <div class="forgot-password-structure">
      <v-form @submit.prevent="submitForm">
        <div class="mb-6">
          <v-label>{{ $t('Reason') }}*</v-label>
          <v-textarea v-model="reason" :error-messages="errors.reason"
            :placeholder="$t('reason')" class="mt-2" required hide-details="auto"
            variant="outlined" color="primary" @input="clearError('reason')"></v-textarea>
        </div>
        <v-btn color="error" block class="mt-4" variant="flat" size="large"
          type="submit">{{ $t('verifier.button.confirmReject') }}</v-btn>
      </v-form>
    </div>
  </template>
  
  <script setup lang="ts">
  import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
  import { rejectedReasonSchema } from '@/utils/validationRules';
  import { defineEmits, reactive, ref } from 'vue';
  
  const reason = ref('');
  const errors: ErrorsDto = reactive({});
  
  const rejectSchema = rejectedReasonSchema();
  const emit = defineEmits<{
    (e: 'submit', value: { reason: string }): void;
  }>();
  const submitForm = () => {
    if (validate()) {
      emit('submit', { reason: reason.value });
      reason.value = '';
    }
  };
  const validate = () => {
    const { error } = rejectSchema.validate({ reason: reason.value }, { abortEarly: false })
    if (error) {
      error.details.forEach((detail: ErrorDetailDto) => {
        errors[detail.path[0]] = detail.message
      })
      return false;
    }
    return true
  }
  const clearError = (field: string) => {
    if (errors[field]) {
      errors[field] = ''
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .forgot-password-structure {
    margin-left: -5px;
  }
  </style>