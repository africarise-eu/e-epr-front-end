<script setup lang="ts">
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { companyRegistrationSchema } from '@/utils/validationRules';
import { nextTick, onMounted, reactive, ref, type Ref } from 'vue';
import { COMPANY } from '@/composables/apiEndpoints';
import { useApi } from '@/composables/useApi';
import { useRouter } from 'vue-router';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import type { VTextField } from 'vuetify/components';
interface CompanyUserDto {
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    companyId?: number | null
}
export interface companyListResponseDto{
  id: number,
  companyName: string
}
export interface companyListDropdownDto{
  id: number,
  name: string
}
const router = useRouter();
const show1 = ref(false);
const loadRegistration = ref(false);
const registrationSchema = companyRegistrationSchema();
const regForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  company: null
});
const errors:ErrorsDto = reactive({});
const companyList = ref<companyListDropdownDto[]>([]);
const getCompanyList = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<{count: number, rows: companyListResponseDto[]}>(COMPANY.LIST_COMPANY, 'GET');
  if(!result.error){
    companyList.value= result.data.rows.map((company)=>{return {id:company.id, name: company.companyName}})
  }

}
const validate = () => {
  const {error} = registrationSchema.validate(regForm, {abortEarly: false})
  if(error){
    error.details.forEach((detail: ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}
const submitForm = async () => {
  loadRegistration.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate()) {
    const { useAPI } = useApi()
    try {
      const payload: CompanyUserDto={
        firstName: regForm.firstName,
        lastName: regForm.lastName,
        email: regForm.email,
        password: regForm.password,
      }
      if(regForm.company ){
        payload.companyId = regForm.company 
      }
      const result = await useAPI(COMPANY.REGISTER, 'POST', payload)
      if(!result.error){
        loadRegistration.value=false
        router.push('/login');
      }else{
        loadRegistration.value=false
      }
    } catch (error) {
      loadRegistration.value=false
    }
  }else{
    loadRegistration.value=false
  }

}

const clearError = (field: string) => {
  if (errors[field]) {
    errors[field] = ''
  }
} 
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
onMounted(() => {
  getCompanyList();
})
</script>

<template>
  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">{{$t('authentication.head.signUp')}}</h3>
    <router-link to="/login" class="text-primary link-hover">{{$t('authentication.link.alreadyHaveAccount')}}</router-link>
  </div>
  <v-form @submit.prevent="submitForm" class="mt-10 loginForm">
    <v-row class="my-0">
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{$t('authentication.label.firstName')}}*</v-label>
          <v-text-field
            v-model="regForm.firstName"
            hide-details="auto"
            required
            variant="outlined"
            :error-messages="errors.firstName"
            class="mt-2"
            color="primary"
            :placeholder="$t('authentication.placeholder.firstName')"
            @input="clearError('firstName')"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{$t('authentication.label.lastName')}}*</v-label>
          <v-text-field
            v-model="regForm.lastName"
            :error-messages="errors.lastName"
            hide-details="auto"
            required
            variant="outlined"
            class="mt-2"
            color="primary"
            :placeholder="$t('authentication.placeholder.lastName')"
            @input="clearError('lastName')"
          ></v-text-field>
        </div>
      </v-col>
    </v-row>
    <div class="mb-6">
      <v-label>{{$t('authentication.label.email')}}*</v-label>
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
    <div class="mb-6">
      <v-label>{{$t('authentication.label.password')}}*</v-label>
      <v-text-field
        v-model="regForm.password"
        ref="passwordField"
        :error-messages="errors.password"
        :placeholder="$t('authentication.placeholder.password')"
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
    <div class="mb-6">
      <v-label>{{$t('authentication.label.company')}}</v-label>
      <v-autocomplete
        v-model="regForm.company"
        variant="outlined"
        class="mt-2"
        color="primary"
        clearable
        :placeholder="$t('authentication.placeholder.company')"
        :items="companyList"
        item-value="id"
        item-title="name"
        :error-messages="errors.company"
        @input="clearError('company')"
      ></v-autocomplete>
    </div>

    <v-btn :loading="loadRegistration" color="primary" block class="mt-4" variant="flat" size="large" type="submit">{{$t('authentication.button.createAccount')}}</v-btn>
  </v-form>
</template>
<style lang="scss">
.back-to-login :hover {
   font-weight: 700;
   transition: background-color 0.3s ease;
}
</style>