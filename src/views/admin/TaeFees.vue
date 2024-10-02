<script setup lang="ts">
import { onMounted, ref, inject, computed} from 'vue';
import { useApi } from '@/composables/useApi';
import { PRODUCT } from '@/composables/apiEndpoints';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import type TAE_Fee from '@/composables/product/TAE_fee';
import { useI18n } from 'vue-i18n';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';


const taeFees = ref<TAE_Fee[]>([]);
const { t }= useI18n();

const headers = computed((): DataTableHeader[] => [
  { title: t('taeFees.table.material'), key: 'material' },
  { title: t('taeFees.table.taeFeeMtTon'), align: 'end', key: 'taeFeeMtTon' },
  { title: t('taeFees.table.impactFactor'), align: 'end', key: 'impactFactor' },
  { title: t('taeFees.table.taeFeeMtKg'), key: 'taeFeeMtKg' }
]);

 const getTAE_Fees = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<Array<TAE_Fee>>(PRODUCT.TAE_FEES, 'GET', {});
  if(!result.error)
  {
    taeFees.value = result.data;  
  }
  else{
    console.log("Error on fetching tae fees");
  }
};
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => { 
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('taeFees.head.tae'), href: '' },
    ]);  
  getTAE_Fees();
});
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6 ">
      <h3 class="text-h3 text-center mb-0">{{$t('taeFees.head.tae')}}</h3>
    </div>
    <v-card class="pt-1">
   <v-card-text> 
         <v-data-table :headers="headers" :items="taeFees"  item-key="id" hide-default-footer>
          <template v-slot:item.material="{ item }">
              {{ t(`common.packagingMaterial.${item.material}`) }}
            </template>
        </v-data-table>

      </v-card-text>
    </v-card>
  </v-container>
</template>
<style lang="scss" scoped>
</style>
