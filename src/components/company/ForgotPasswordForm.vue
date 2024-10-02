<template>
  <div class="forgot-password-structure">
    <div class="text-h6 text-lightText mb-2">{{ $t('authentication.other.forgotPasswordDescription') }}</div>
    <v-form @submit.prevent="submitForm">
      <div class="mb-6">
        <v-label>{{ $t('authentication.label.email') }}*</v-label>
        <v-text-field v-model="email" :error-messages="errors.email"
          :placeholder="$t('authentication.placeholder.email')" class="mt-2" required hide-details="auto"
          variant="outlined" color="primary" @input="clearError('email')"></v-text-field>
      </div>
      <v-btn color="primary" block class="mt-4" variant="flat" size="large"
        type="submit">{{ $t('authentication.button.resetPassword') }}</v-btn>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { forgotPasswordSchema } from '@/utils/validationRules';
import { defineEmits, reactive, ref } from 'vue';

const email = ref('');
const errors: ErrorsDto = reactive({});

const forgotSchema = forgotPasswordSchema();
const emit = defineEmits<{
  (e: 'submit', value: { email: string }): void;
}>();
const submitForm = () => {
  if (validate()) {
    emit('submit', { email: email.value });
    email.value = '';
  }
};
const validate = () => {
  const { error } = forgotSchema.validate({ email: email.value }, { abortEarly: false })
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