<script setup lang="ts">
import { FlagOutlined } from '@ant-design/icons-vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const activeLanguage = ref(localStorage.getItem('language') || 'en'); // Get the active language from localStorage or default to 'en'

function changeLanguage(lang: string) {
  localStorage.setItem('language', lang);
  locale.value = lang; // This changes the language
  activeLanguage.value = lang; // Set the active language based on the selected one
}

</script>

<template>
  <v-menu :close-on-content-click="false" offset="0, 0" location="left">
    <template v-slot:activator="{ props }">
      <v-btn icon class="text-secondary ml-sm-2 ml-1" color="darkText" rounded="sm" size="small" v-bind="props">
        <FlagOutlined :style="{ fontSize: '20px', color: '#555' }" />
      </v-btn>
    </template>
    <v-sheet rounded="md" class="language-dropdown" max-width="200">
      <v-divider></v-divider>
      <perfect-scrollbar style="height:100%; max-height: 265px">
        <v-list class="py-0" lines="two" aria-label="language list">
          <v-list-item 
            @click="changeLanguage('en')" 
            class="no-spacer py-1"
            :active="activeLanguage === 'en'"
            :class="{ 'active-language': activeLanguage === 'en' }"
          >
            <div class="d-inline-flex justify-space-between w-100">
              <h6 class="text-subtitle-1 font-weight-regular mb-0">
                English
              </h6>
            </div>
          </v-list-item>
          <v-list-item 
            @click="changeLanguage('pt')" 
            class="no-spacer py-1"
            :active="activeLanguage === 'pt'"
            :class="{ 'active-language': activeLanguage === 'pt' }"
          >
            <div class="d-inline-flex justify-space-between w-100">
              <h6 class="text-subtitle-1 font-weight-regular mb-0">
                Portuguese
              </h6>
            </div>
          </v-list-item>
        </v-list>
      </perfect-scrollbar>
    </v-sheet>
  </v-menu>
</template>


