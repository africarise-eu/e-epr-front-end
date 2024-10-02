<script setup lang="ts">
import CompensationForm from "@/components/compensation/CompensationForm.vue";
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { reactive, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();

const newCompensationDetails = reactive({
    id: 0,
    requestedDate:'',
    deliveryToEdDate: '',
    materialId: null,
    material: '',
    deliveredKgs: 0,
    edOrganisationId: null,
    edOrganisation: '',
    edType: '',
    edOrgStatus:'',
    status:'',
    rejectedReason: '',
    documents: []
  });

 const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('compensationRequest.head.compensation'), href: '/compensations' },
        { title: t('compensationRequest.head.list'), href: '/compensation/requests' },
        { title: t('compensationRequest.head.add'), href: '' },
    ]);
});
</script>
<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('compensationRequest.head.add')}}</h3>
  </div>
<v-card class="pa-8">
  <CompensationForm :compensationRequestDetails="newCompensationDetails" />
</v-card>
</template>
