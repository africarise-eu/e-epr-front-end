<script setup lang="ts">
import CompensationForm from "@/components/compensation/CompensationForm.vue";
import type compensationRequestDto from '@/composables/compensation/compensationRequest';
import { ref, onMounted, reactive, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { COMPENSATION } from '@/composables/apiEndpoints';
import { useImportShipment } from '@/composables/imports/useImportShipment';
import { mapApiResponseToCompensationRequestDto, initializedCompensationRequest } from '@/composables/compensation/compensationRequest';
import { useSnackbarStore } from '@/stores/snackbar';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { useI18n } from 'vue-i18n';

const {t} = useI18n();
const snackbarStore = useSnackbarStore();
const route = useRoute();
const router = useRouter();
const compensationId =  ref(route.params.id as string);
const compensationRequest =  reactive({
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
const fetchById = async () => {
  try {
      const { useAPI } = useApi();
      const result = await useAPI<compensationRequestDto>(`${COMPENSATION.GETBYID}/${compensationId.value}`, 'GET');
      if(!result.error){        
         Object.assign(compensationRequest, mapApiResponseToCompensationRequestDto(result.data));
      }
      else
      {
        snackbarStore.showMessage(result.message, 'error')
        router.push({ name: 'CompensationList'});
      }
  } catch (error) {
      console.error('Failed when getting compensation by id', error);
  }
};

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('compensationRequest.head.compensation'), href: '/compensation' },
        { title: t('compensationRequest.head.list'), href: '/compensation/requests' },
        { title: t('compensationRequest.head.update'), href: '' },
    ]);
  fetchById();
});
</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('compensationRequest.head.update')}}</h3>
  </div>
<v-card class="pa-8">
  
  <CompensationForm :compensationRequestDetails="compensationRequest" />
</v-card>
</template>
