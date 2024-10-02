<script setup lang="ts">
import ProductionPlanForm, { type productionDetailDto, type productionDto } from '@/components/production/ProductionPlanForm.vue';
import { PRODUCTION } from '@/composables/apiEndpoints';
import { useApi } from '@/composables/useApi';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
export interface AddProductionResponseDto{
  id: number,
  title: string,
  isDraft: boolean,
  userId: number,
  planYear: number,
  previousYear: number,
  status: string,
  companyId: number,
  updatedAt: string,
  createdAt: string,
  description: null
}

const productionPlan=ref([
    
]);
const router = useRouter();
const isDraftLoad = ref(false);
const isSubmitLoad = ref(false);
const submitProduction = async (production: productionDto) => {
    if(production.isDraft){
        isDraftLoad.value = true;
    }else{
        isSubmitLoad.value = true;
    }
    try{
        let description = 'Production plans for '
        let product = production.productionDetails.map((product: productionDetailDto) => {
            description += product.productName + ', '
            return {
                productId: product.productId,
                plan: product.plan??0,
                actual: product.actuals??0
            }
        })
        const payload = {
            title:"Production plan 2024",
            description: description,
            isDraft: production.isDraft,
            product: product
        }
        const {useAPI} = useApi();
        const result = await useAPI<AddProductionResponseDto>(PRODUCTION.PRODUCTION_PLAN, 'POST', payload);
        isDraftLoad.value = false;
        isSubmitLoad.value = false;
        if(!result.error){
            router.push({ name: 'ProductionPlan'});  
        }
    }catch (error){
        isDraftLoad.value = false;
        isSubmitLoad.value = false;
        console.error(error);
    }
}

</script>

<template>
<ProductionPlanForm :productionDetail="productionPlan" :title="$t('production.head.addProduction')" :isDraft="true" :submitLoading="isSubmitLoad" :draftLoading="isDraftLoad" @submit="submitProduction"></ProductionPlanForm>
</template>
<style scoped lang="scss"></style>