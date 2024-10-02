<script setup lang="ts">
import type productDto from '@/composables/product/product';
import ImportShipmentForm from "@/components/imports/ImportShipmentForm.vue";
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { reactive, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import type importShipmentDto from '@/composables/imports/importShipment';

const {t} = useI18n();
const newImportShipment = reactive<importShipmentDto>({
  // Initialize with empty values or default values for a new product
  id:0,
  cdNo: '',
  etaDate: '',
  arrivalPort: 1,
  countryId: 210,
  countries:{id: 0, name: ''},
  arrivalPorts: {id: 0, portname: ''},
  fromPort: '',
  productUnits:0,
  payStatus:'',
  status: '',
  rejectedReason: '',
  taeValue: 0,
  products:[]
});
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('import.head.list'), href: '/imports' },
        { title: t('import.head.add'), href: '' },
    ]);
});
</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('import.head.add')}}</h3>
  </div>
<v-card class="pa-8">
  <ImportShipmentForm :importShipmentDetails="newImportShipment" />
</v-card>
</template>
