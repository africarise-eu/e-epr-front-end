<script setup lang="ts">
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { inject, onMounted} from 'vue';
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
              <v-row  v-if="locale ==='en'">
                <!-- Loop through your image URLs -->
                <v-col cols="12" sm="6" md="6" lg="6">
                  <div class="image-wrapper">
                    <img   src="@/assets/images/english/admin_1.jpg" alt="admin_1"  class="responsive-image" />
                  </div>
                </v-col>
                <v-col cols="12" sm="6" md="6" lg="6">        
                  <div class="image-wrapper">
                    <img  src="@/assets/images/english/admin_2.jpg" alt="admin_2"  class="responsive-image" />
                  </div>
                </v-col>
              </v-row>
              <v-row v-else >
                <!-- Loop through your image URLs -->
                <v-col cols="12" sm="6" md="6" lg="6">
                  <div class="image-wrapper">
                    <img   src="@/assets/images/portuguese/admin_1.jpg" alt="admin_1"  class="responsive-image" />
                  </div>
                </v-col>
                  <v-col cols="12" sm="6" md="6" lg="6">        
                  <div class="image-wrapper">
                    <img  src="@/assets/images/portuguese/admin_2.jpg" alt="admin_2"  class="responsive-image" />
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
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.responsive-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Ensures the image fits within the container without being stretched */
  border-radius: 8px; /* Optional: for rounded corners */
}
</style>