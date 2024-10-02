<script setup lang="ts">
import EndDestinationForm from "@/components/compensation/EndDestinationForm.vue";
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { reactive, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import type endDestinationDto from '@/composables/compensation/endDestination';

const {t} = useI18n();
const newEndDestination = reactive<endDestinationDto>({
    id: 0,
    orgName: '',
    orgType: null,
    companyRegNo: '',
    companyId: 0,
    companyName: '',
    phone: '',
    email: '',
    contactPerson: '',
    address: '',
    cityName: '',
    city: null,
    countryName: '',
    country: 1,
    status: '',
    rejectedReason: '',
    createdAt : ''
  });
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('endDestination.head.list') , href: '/end-destinations' },
        { title: t('endDestination.head.add'), href: '' },
    ]);
});
</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('endDestination.head.add')}}</h3>
  </div>
  <EndDestinationForm :endDestinationDetails="newEndDestination" />
</template>
