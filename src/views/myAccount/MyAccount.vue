<script setup lang="ts">
import { onMounted, reactive, ref, onUnmounted, type Ref, inject } from 'vue';
import { MYACCOUNT, FILE } from '@/composables/apiEndpoints';
import { useApi } from '@/composables/useApi';
import { useRouter } from 'vue-router';
import type { ErrorDetailDto, ErrorsDto } from '@/composables/formError';
import { myAccountSchema, otpVerificationSchema } from '@/utils/validationRules';
import { useSnackbarStore } from '@/stores/snackbar';
import OtpVerificationForm , {type OtpFormProps } from '@/components/Auth/OtpVerificationForm.vue';
import { useI18n } from 'vue-i18n';
import { CheckOutlined, PlusOutlined, EditOutlined  } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import type{FileModel} from '@/composables/filemodel';
import { ROLE } from '@/composables/role';
import { Modal } from 'ant-design-vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

interface myAccount {
    firstName: string,
    lastName: string,
    email: string,
    profileImage: string,
    companyName: string,
}

const userStore = useAuthStore();
const { t }= useI18n();
const isSubmitting = ref(false);
const showOtp = ref(false);
const emailVerified = ref(false);
const myAccount = ref<myAccount>({
    firstName: '',
    lastName: '',
    email: '',
    profileImage:'',
    companyName:''
});
const errors:ErrorsDto = reactive({});
const userRoleId = ref<number>(0);
const myAccountValSchema = myAccountSchema();
const otpverifySchema = otpVerificationSchema();
const snackbarStore = useSnackbarStore();
const fileList = ref<FileModel[]>([]);
const isUploading = ref(false);
const imageFile = ref<File | null>(null);
const imageChanged = ref(false);
const vcardWidth = ref('');
const showPreview = ref(false);
const previewImage = ref<string>(''); 
const otpForm: Ref<OtpFormProps> = ref({
  otp:'',
});
const fieldsToExcludeFromValidation = ['email', 'profileImage','companyName'];


const validate = () => {
  const fieldsToValidate = { ...myAccount.value } as { [key: string]: any };
  fieldsToExcludeFromValidation.forEach(field => delete fieldsToValidate[field]);
  const {error} = myAccountValSchema.validate(fieldsToValidate, {abortEarly: false})
  if(error){
    error.details.forEach((detail: ErrorDetailDto)=>{
      errors[detail.path[0]] = detail.message
    })
    return false;
  }
  return true
}

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

const submitForm = async () => {
  isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validate()) {

    let imageUploadResult = null;
    if(imageChanged.value && imageFile.value)
     {
      imageUploadResult = await imageUpload(imageFile.value!);
      if(imageUploadResult)
       {
          myAccount.value.profileImage = imageUploadResult.data;
       }
    }
    const { useAPI } = useApi()
    try {
      let payload:{firstName: string, lastName: string, email: string, profileImage?: string} = {
        firstName: myAccount.value.firstName,
        lastName: myAccount.value.lastName,
        email: myAccount.value.email,
      }
      if(myAccount.value.profileImage && myAccount.value.profileImage !== "") {
        payload.profileImage = myAccount.value.profileImage
      }
      else{
        payload.profileImage = '';
      }
      const result = await useAPI(MYACCOUNT.UPDATE, 'PATCH', payload)
      if(!result.error){
        isSubmitting.value=false
        snackbarStore.showMessage(result.message, 'success');

        // update localstorage and store
        const userString = localStorage.getItem('user');
        if (userString) {
          try {
            const user = JSON.parse(userString);
            user.firstName = myAccount.value.firstName;
            user.lastName = myAccount.value.lastName;
            user.email = myAccount.value.email;  
            if(imageChanged.value || !myAccount.value.profileImage)
            {        
                user.profileImage = myAccount.value.profileImage; 
            }           
            localStorage.setItem('user', JSON.stringify(user));            
            userStore.setUser(user);
          } catch (error) {
            console.error('Error parsing user data from localStorage', error);
          }
        }
      }else{
        isSubmitting.value=false
      }
    } catch (error) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }
}

const sendVerificationEmail = async () => {
  const now = Date.now();
  const { useAPI } = useApi();
  try {
      const result = await useAPI(MYACCOUNT.VERIFYEMAIL, 'POST', { email: myAccount.value.email });
      if (!result.error) {
      localStorage.setItem('email', JSON.stringify({ lastSentTime: now }));
      snackbarStore.showMessage('Verification email sent successfully', 'success');
      showOtp.value =true;
      } else {
      snackbarStore.showMessage(result.message, 'error');
      }
  } catch (error) {
      snackbarStore.showMessage('Error sending verification email', 'error');
  }
    
};

const submitOtpForm = async (formValue: OtpFormProps) => {
  isSubmitting.value=true
  Object.keys(errors).forEach(key=>errors[key]= '')
  if( validateOtp(formValue)) {
    otpForm.value = formValue;
    const { useAPI } = useApi();
    try {
      const payload={
        otp: otpForm.value.otp
      }
      const result = await useAPI(MYACCOUNT.VERIFY_OTP, 'POST', payload);
      isSubmitting.value=false
      if(!result.error){
        snackbarStore.showMessage(result.message, 'success')
        showOtp.value = false;
        emailVerified.value = true;
        const userString = localStorage.getItem('user');
        if (userString) {
          try {
            const user = JSON.parse(userString);
            user.isVerified = true;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (error) {
            console.error('Error parsing user data from localStorage', error);
          }
        }
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
      const payload={
        email: myAccount.value.email

      }
    const result = await useAPI(MYACCOUNT.VERIFYEMAIL, 'POST', payload);
    localStorage.setItem('email', JSON.stringify({ lastSentTime: Date.now() }));
    if(!result.error){
      snackbarStore.showMessage(result.message, 'success');
    }
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

const imageUpload = async (file: File) => {
  const { useAPI } = useApi();

  const formData = new FormData();
  formData.append('file', file);
  // Add custom headers if needed
  const customHeaders = { 'Path': 'profileImage', 'Content-Type': 'multipart/form-data' };

  try {
    isUploading.value = true;
    const result = await useAPI<string>(FILE.UPLOAD, 'POST', formData, {}, {}, customHeaders);
    return result;
  } catch (error: any) {
    snackbarStore.showMessage('Failed to upload image', 'error');
  } finally {
    isUploading.value = false;
  }
};

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    console.error('product.error.invalidImageType');
    snackbarStore.showMessage(t('imageUpload.info.isJpgOrPng'), 'error');
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    console.error('product.error.imageTooLarge');
    snackbarStore.showMessage(t('imageUpload.info.isLt5M'), 'error');
  }
  return isJpgOrPng && isLt5M;
};

const handleChange = async (options: any) => {
  const { file, onSuccess, onError } = options;
  imageFile.value = file;
  const objectURL = URL.createObjectURL(file);

  fileList.value = [{
    uid: file.uid,
    name: file.name,
    status: 'done',
    url: objectURL, // URL for preview
    isNew: true
  }];
  onSuccess(null, file);
  myAccount.value.profileImage = file.name;
  imageChanged.value = true;
  errors.image = '';
};

const handleRemove = () => {
  fileList.value = [];
  imageFile.value = null;
  myAccount.value.profileImage = '';
};

const handleCancel = () => {
  showPreview.value = false;
};

const handlePreview = (file :any) => {
  showPreview.value = true;
  previewImage.value = file.url;
};

const updateVcardWidth = () => {
  const width = window.innerWidth;
  if (width < 600) { // Mobile view
    vcardWidth.value = '100%';
  } else if (width < 960) { // Tablet view
    vcardWidth.value = '80%';
  } else { // Desktop view
    vcardWidth.value = '60%';
  }
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');

onMounted( async() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('myaccount.head.myaccount'), href: `/myaccount` },
  ]);

  const userString = localStorage.getItem('user');
  if (userString) {
    try {
      const user = JSON.parse(userString);
      myAccount.value.firstName = user.firstName;
      myAccount.value.lastName = user.lastName;
      myAccount.value.email = user.email;
      myAccount.value.companyName = user.companyName;
      userRoleId.value = user.roleId;
      emailVerified.value = user.isVerified;
      if(user.profileImage)
      {
          const { useAPI } = useApi()
          const image = await useAPI(FILE.GET_FILE, 'GET',undefined, {path: user.profileImage});
          if(!image.error){
              myAccount.value.profileImage = (image.data??'') as string;
               fileList.value = [{
                                  uid: '-1', // Unique identifier for the file
                                  name: 'product-image',
                                  status: 'done', // Indicates the upload status
                                  url: myAccount.value.profileImage, // URL of the image from API
                                  isNew: false
                                }];
           }
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
  showOtp.value = false;
  imageChanged.value =false;
  updateVcardWidth();
  window.addEventListener('resize', updateVcardWidth);
});

// Clean up event listener on unmount
onUnmounted(() => {
  window.removeEventListener('resize', updateVcardWidth);
});
</script>

<template>

  <div class="d-flex justify-space-between align-center">
    <h3 class="text-h3 text-center mb-0">{{$t('myaccount.head.myaccount')}}</h3>
  </div>  
    <v-row class="bg-containerBg position-relative" no-gutters>
    <v-col cols="12" lg="12" class="d-flex align-center">
      <v-container>
        <div class="d-flex align-center justify-center" style="min-height: calc(100vh - 148px)">
          <v-row justify="center" style="margin-bottom: auto;">
            <v-col cols="12" md="12">
              <v-card elevation="0" class="loginBox">
                <v-card elevation="24">
                  <v-card-text>
                  <div v-if="showOtp">
                        <otp-verification-form :form-values="otpForm" :submitButtonText="$t('authentication.button.verifyOtp')" :title="$t('authentication.head.otpVerification')" :description="$t('authentication.other.otpVerificationDescription')" @submit="submitOtpForm" @resend="resendOtp"></otp-verification-form>                   
                  </div>
                  <div v-else>
                    <!-- <v-card :max-width="vcardWidth" class="mt-5" v-else>
                      <v-card-text> -->
                    <v-form @submit.prevent="submitForm" class="mt-10">
                      <v-row>
                        <v-col cols="5" mt-4 class="text-center">
                          <div class="mt-8 ">
                          <v-label class="pb-2">{{ $t('myaccount.label.profileimage') }}</v-label>
                                <a-upload list-type="picture-card"
                                :before-upload="beforeUpload"
                                :file-list="fileList"
                                :custom-request="handleChange"                                
                                :on-Preview="handlePreview"
                                :on-remove="handleRemove"
                                :disabled="isUploading"                
                                :multiple="false">
                                   <div v-if="fileList.length < 1">
                                      <PlusOutlined  />                  
                                      <div style="margin-top: 8px">{{ isUploading ? 'Uploading...' : 'Upload' }}</div>
                                   </div>
                                </a-upload>
                                 <Modal :open="showPreview" :footer="null"  :onCancel=handleCancel>
                                    <img alt="example" style="width: 100%" :src=previewImage />
                                 </Modal>
                              </div>
                        </v-col>
                        <v-col  cols="7">
                      <v-row class="my-0 pr-3" dense align="start" justify="start">
                        <v-col cols="12">
                          <div class="text-field-wrapper">
                            <v-label>{{$t('common.label.firstName')}}*</v-label>
                            <v-text-field
                              v-model="myAccount.firstName"
                              hide-details="auto"
                              required
                              variant="outlined"
                              :error-messages="errors.firstName"
                              class="mb-2"
                              color="primary"
                              :placeholder="$t('common.placeholder.firstName')"
                              @input="clearError('firstName')"
                            ></v-text-field>
                          </div>
                        </v-col>
                          <v-col cols="12">       
                          <div class="text-field-wrapper">
                            <v-label>{{$t('common.label.lastName')}}*</v-label>
                            <v-text-field
                              v-model="myAccount.lastName"
                              :error-messages="errors.lastName"
                              hide-details="auto"
                              required
                              variant="outlined"
                              class="mb-2"
                              color="primary"
                              :placeholder="$t('common.placeholder.lastName')"
                              @input="clearError('lastName')"
                            ></v-text-field>
                          </div>
                        </v-col>                        
                        <v-col cols="12" v-if="userRoleId === ROLE.COMPANY || userRoleId === ROLE.USER">       
                          <div class="text-field-wrapper">
                            <v-label>{{$t('common.label.companyName')}}</v-label>
                            <v-text-field
                              v-model="myAccount.companyName"
                              hide-details="auto"
                              required
                              variant="outlined"
                              class="mb-2"
                              color="primary"
                              :placeholder="$t('common.placeholder.lastName')"
                              disabled
                            ></v-text-field>
                          </div>
                        </v-col>
                        <v-col cols="12">
                          <div class="mb-6 text-field-wrapper">
                            <v-label>{{$t('common.label.email')}}</v-label>
                            <v-text-field
                              v-model="myAccount.email"
                              :error-messages="errors.email"
                              class="mb-2"
                              required
                              hide-details="auto"
                              variant="outlined"
                              color="primary"
                              disabled
                            >
                              <template v-slot:append-inner>            
                                    <CheckOutlined v-if="emailVerified" class="text-success">{{ $t('common.status.verified') }}</CheckOutlined>              
                              </template>
                              </v-text-field>
                              <v-btn 
                                variant="text"
                                v-if="!emailVerified" 
                                @click="sendVerificationEmail" 
                                color="primary"
                                class="verify-email-btn text-primary link-hover"
                              >
                                <span>{{$t('Email.VerifyEmail')}}</span>
                              </v-btn>
                          </div>
                        </v-col>
                        </v-row>
                        </v-col>
                      </v-row>
                      <v-row class="my-0" align="center" justify="center">
                        <v-col cols="5" class="ml-6">
                        <v-btn :loading="isSubmitting" color="primary" style="min-width: 200px;" class="mt-4" variant="flat" size="large" type="submit">{{$t('common.save')}}</v-btn>
                        </v-col></v-row>
                      
                        <v-row class="my-0" align="center" justify="center">
                        <v-col cols="12" sm="6">  
                        </v-col>
                      </v-row>                      
                      <v-row class="my-0" align="center" justify="center">
                        
                      </v-row>
                      
                  </v-form>
                    </div>
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

<style scoped>
.loginBox {
  max-width: 660px;
  margin: 0 auto;
  margin-top: 40px;
}
.text-success {
  color: #4caf50; /* Green color */
}
.text-field-wrapper {
  display: flex;
  flex-direction: column; /* Adjust as needed for layout */
  gap: 10px; /* Space between the text field and button */
}

.verify-email-btn {
  align-self: flex-end; /* Align the button as needed */
}
</style>