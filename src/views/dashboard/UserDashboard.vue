<script setup lang="ts">
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { inject, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale, t } = useI18n();

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([]);
});
</script>
<template>
       <v-container>
        <div class="d-flex justify-space-between align-center mb-6">
        <h3 class="text-h3 text-center mb-0">{{ $t('dashboard.head.title') }}</h3>
      </div>
        <v-card>
          <v-card-text>
              <v-row v-if="locale ==='en'">
                <!-- Loop through your image URLs -->
                <v-col cols="12" sm="6" md="4" lg="6">
                  <div class="image-wrapper">
                    <img  src="@/assets/images/english/cust_1.jpg" alt="cust_1"  class="responsive-image" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6">        
                  <div class="image-wrapper">
                    <img   src="@/assets/images/english/cust_2.jpg" alt="cust_2"  class="responsive-image" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6" >
                  <div class="image-wrapper">
                    <img class="responsive-image" src="@/assets/images/english/cust_3.jpg" alt="cust_5" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6">
                  <div class="image-wrapper">
                      <img class="responsive-image" src="@/assets/images/english/cust_4.jpg" alt="cust_4" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6">
                  <div class="image-wrapper">
                    <img class="responsive-image" src="@/assets/images/english/cust_5.jpg" alt="cust_3" />
                  </div>
                </v-col>
              </v-row>
              <v-row v-else>
                <!-- Loop through your image URLs -->
                <v-col cols="12" sm="6" md="4" lg="6">
                  <div class="image-wrapper">
                    <img src="@/assets/images/portuguese/cust_1.jpg" alt="cust_1"  class="responsive-image" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6">        
                  <div class="image-wrapper">
                    <img style="height:100%" src="@/assets/images/portuguese/cust_2.jpg" alt="cust_2"  class="responsive-image" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6" >
                  <div class="image-wrapper">
                    <img  class="responsive-image" src="@/assets/images/portuguese/cust_5.jpg" alt="cust_5" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6">
                  <div class="image-wrapper">
                      <img class="responsive-image" src="@/assets/images/portuguese/cust_4.jpg" alt="cust_4" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="4" lg="6">
                  <div class="image-wrapper">
                    <img class="responsive-image" src="@/assets/images/portuguese/cust_3.jpg" alt="cust_3" />
                  </div>
                </v-col>
              </v-row>
          </v-card-text>
        </v-card>
  </v-container>
</template>
<style scoped>
.image-wrapper {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding-top: 60%; /* Aspect ratio (4:3 in this case, adjust as needed) */
}

.responsive-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  object-fit: contain; /* Ensures the image covers the entire area */
  border-radius: 8px; /* Optional: for rounded corners */
}
</style>