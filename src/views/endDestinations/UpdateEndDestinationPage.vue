<script setup lang="ts">
import EndDestinationForm from "@/components/compensation/EndDestinationForm.vue";
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ref, onMounted, reactive, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { COMPENSATION } from '@/composables/apiEndpoints';
import { useApi } from '@/composables/useApi';
import type endDestinationDto from '@/composables/compensation/endDestination';

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const endDestinationId =  ref(route.params.id as string);
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
  

const fetchById = async () => {
  try {
      const { useAPI } = useApi();
      const result = await useAPI<endDestinationDto>(`${COMPENSATION.GET_BY_ID_ENDDESTINATIONS}/${endDestinationId.value}`, 'GET');
      if(!result.error){        
         Object.assign(newEndDestination, mapApiResponseToEndDestinationDto(result.data));
      }
      else
      {
        console.log("error when fetching end destination");
        router.push({ name: 'EndDestinations'});
      }
  } catch (error) {
      console.error("error when fetching end destination", error);
  }
};

 const mapApiResponseToEndDestinationDto = (response: any): endDestinationDto => {
    return {
        id: response.id ?? 0,
        orgName: response.orgName ?? '',
        orgType: response.orgType ?? null,
        companyRegNo: response.companyRegNo ?? '',
        companyId: response.companyId ?? 0,
        companyName: response.companyName ?? '',
        phone: response.phone ?? '',
        email: response.email ?? '',
        contactPerson: response.contactPerson ?? '',
        address: response.address ?? '',
        cityName: response.cityName ?? '',
        city: response.cityId ?? null,
        countryName: response.countryName ?? '',
        country: response.countryId ?? 1,
        status: response.status ?? '',
        rejectedReason: response.rejectedReason ?? '',
        createdAt: response.createdAt ?? ''
    };
};

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('endDestination.head.list') , href: '/end-destinations' },
        { title: t('endDestination.head.edit'), href: '' },
    ]);
    fetchById();
});
</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('endDestination.head.edit')}}</h3>
  </div>
  <EndDestinationForm :endDestinationDetails="newEndDestination" />
</template>
