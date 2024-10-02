<script setup lang="ts">
import { RouterView } from 'vue-router';
import LoaderWrapper from './LoaderWrapper.vue';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import { DefaultTheme } from "@/theme/LightTheme";
import { HomeFilled, RightOutlined } from '@ant-design/icons-vue';
import { onMounted, provide, ref } from 'vue';
export interface breadCrumbDto{
  title: string;
  href: string;
  disabled?: boolean;
}
const breadcrumbs = ref<breadCrumbDto[]>([]);
onMounted(() => {
  breadcrumbs.value = []
});
function updateBreadcrumb(newBreadcrumbs: breadCrumbDto[]) {
  breadcrumbs.value = newBreadcrumbs;
}

provide('updateBreadcrumb', updateBreadcrumb);
</script>

<template>
  <v-locale-provider>
    <v-app :class="[]">
      <VerticalSidebarVue />
      <VerticalHeaderVue />

      <v-main class="page-wrapper">
        <v-breadcrumbs class="pl-8 py-2" :items="breadcrumbs" bg-color="gray100">
          <template v-slot:divider>
            <RightOutlined />
          </template>
          <template v-slot:prepend>
            <HomeFilled :to="'/dashboard'" class="mt-n1" :style="{color: breadcrumbs.length>0?DefaultTheme.colors.lightText:DefaultTheme.colors.darkText}"/>
          </template>
        </v-breadcrumbs>
        <v-container fluid>
          <div>
            <!-- Loader start -->
            <LoaderWrapper />
            <!-- Loader end -->
            <RouterView />
          </div>
        </v-container>
      </v-main>
    </v-app>
  </v-locale-provider>
</template>
