<script setup lang="ts">
// icons
import { LogoutOutlined, UserOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { USER } from '@/composables/apiEndpoints';
import { useSnackbarStore } from '@/stores/snackbar';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();
const snackbarStore = useSnackbarStore();
const authStore = useAuthStore();
const router = useRouter();

const submitForm = async () => {
  const { useAPI } = useApi();
  try{
    const result = await useAPI(USER.SEND_CHANGE_PASSWORD_OTP, 'POST', {});
    if(!result.error){
      localStorage.setItem('resetPasswordToken', JSON.stringify(result.data));
      localStorage.setItem('email', JSON.stringify({lastSentTime: Date.now() }));
      snackbarStore.showMessage(result.message, 'success')
      router.push('/change-password');
    }
  } catch (error) {
    const errorMsg = t('authentication.error.changePasswordOtp');
    console.error(errorMsg, error);
  }
};
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!-- profile DD -->
  <!-- ---------------------------------------------- -->
  <div>
    <perfect-scrollbar style="height: 100px; max-height: 200px">
      <v-list class="py-0" aria-label="profile list" aria-busy="true">
        <v-list-item @click="submitForm()" color="primary" rounded="0" value="Change Password">
          <template v-slot:prepend>
            <SettingOutlined :style="{ fontSize: '14px' }" class="mr-4" />
          </template>
          <v-list-item-title class="text-h6">{{$t('authentication.head.changePassword')}}</v-list-item-title>
        </v-list-item>

        <v-list-item @click="authStore.logout()" color="secondary" rounded="0">
          <template v-slot:prepend>
            <LogoutOutlined :style="{ fontSize: '14px' }" class="mr-4" />
          </template>
          <v-list-item-title class="text-h6"> {{$t('common.logout')}}</v-list-item-title>
        </v-list-item>
      </v-list>
    </perfect-scrollbar>
  </div>
</template>
