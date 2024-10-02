<script setup lang="ts">
import ImportShipmentForm from "@/components/imports/ImportShipmentForm.vue";
import { ref, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useImportShipment } from '@/composables/imports/useImportShipment';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();
const route = useRoute();
const importId =  ref(route.params.id as string);

const { importDetails } = useImportShipment(importId.value);
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('import.head.list'), href: '/imports' },
        { title: t('import.head.edit'), href: '' },
    ]);
});
</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('import.head.edit')}}</h3>
  </div>
<v-card class="pa-8">
  <ImportShipmentForm :importShipmentDetails="importDetails" />
</v-card>
</template>
