<script setup lang="ts">
import { useCustomizerStore } from '../../../stores/customizer';
import { useAuthStore } from '@/stores/auth';
import { computed, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { FILE } from '@/composables/apiEndpoints';
import DefaultAvatar from '@/assets/images/users/avatar-1.png';
// icons
import { MenuFoldOutlined } from '@ant-design/icons-vue';

// dropdown imports
import LanguageDD from './languageDD.vue';
import ProfileDD from './ProfileDD.vue';
const userStore = useAuthStore();
const customizer = useCustomizerStore();
const profileImage = ref<string>('');

const fullName = computed(() => {
  const user = userStore.user;
  return user ? `${user.firstName} ${user.lastName}` : '';
});

// Function to fetch profile image
const fetchProfileImage = async () => {
  const user = userStore.user;
  if (user && user.profileImage) {
    const { useAPI } = useApi();
    try {
      const image = await useAPI(FILE.GET_FILE, 'GET', undefined, { path: user.profileImage });
      if (!image.error) {
        profileImage.value = (image.data as string) ?? '';
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
    }
  } else {
    profileImage.value = '';
  }
};

watch(
  () => userStore.user,
  (newUser: any) => {
    if (newUser) {
      fetchProfileImage();
    }
  },
  { immediate: true } // Fetch profile image immediately if userStore.user is already set
);
</script>

<template>
  <v-app-bar elevation="0" height="60">
    <v-btn
      class="hidden-md-and-down text-secondary mr-3"
      color="darkText"
      icon
      rounded="sm"
      variant="text"
      @click.stop="customizer.SET_MINI_SIDEBAR(!customizer.mini_sidebar)"
      size="small"
    >
      <MenuFoldOutlined :style="{ fontSize: '16px' }" />
    </v-btn>
    <v-btn
      class="hidden-lg-and-up text-secondary ms-3"
      color="darkText"
      icon
      rounded="sm"
      variant="text"
      @click.stop="customizer.SET_SIDEBAR_DRAWER"
      size="small"
    >
      <MenuFoldOutlined :style="{ fontSize: '16px' }" />
    </v-btn>

    <v-spacer />
    <!-- ---------------------------------------------- -->
    <!---right part -->
    <!-- ---------------------------------------------- -->

    <!-- ---------------------------------------------- -->
    <!-- Notification -->
    <!-- ---------------------------------------------- -->
    <LanguageDD />

    <!-- ---------------------------------------------- -->
    <!-- User Profile -->
    <!-- ---------------------------------------------- -->
    <v-menu :close-on-content-click="false" offset="8, 0">
      <template v-slot:activator="{ props }">
        <v-btn class="profileBtn" variant="text" rounded="sm" v-bind="props">
          <div class="d-flex align-center">
            <v-avatar class="mr-sm-2 mr-0 py-2">
              <img :src="profileImage || DefaultAvatar" alt="Julia" />
            </v-avatar>
            <h6 class="text-subtitle-1 mb-0 d-sm-block d-none">{{fullName}}</h6>
          </div>
        </v-btn>
      </template>
      <v-sheet rounded="md">
        <ProfileDD />
      </v-sheet>
    </v-menu>
  </v-app-bar>
</template>
