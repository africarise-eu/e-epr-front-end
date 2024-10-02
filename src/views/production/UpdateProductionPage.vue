<script setup lang="ts">
import ProductionPlanForm, { type productionDetailDto, type productionDto } from '@/components/production/ProductionPlanForm.vue';
import { FILE, PRODUCTION } from '@/composables/apiEndpoints';
import { useApi } from '@/composables/useApi';
import { inject, onMounted, ref } from 'vue';
import type { ProductionResponseDto } from '@/views/production/ViewProductionPlan.vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';


const {t} = useI18n();
const isInitialLoad = ref(false)
const isDraftLoad = ref(false);
const isSubmitLoad = ref(false);
const isDraft = ref(false);
const router = useRouter();
const route = useRoute();
const production = ref<ProductionResponseDto>();
const productionProductList = ref<productionDetailDto[]>([]);
    const currentYear = new Date().getFullYear();
    const selectedYear = ref(currentYear.toString());

const getProductionDetails = async () => {
    isInitialLoad.value = true;
    try{
        const {useAPI} = useApi();
        const result = await useAPI<ProductionResponseDto>(PRODUCTION.PRODUCTION_PLAN+`/${route.params.id}`, 'GET');
        if(!result.error){
            production.value = result.data;
            isDraft.value = production.value.isDraft;
            productionProductList.value = [];
            result.data.productionProduct.map(async (item: any)=>{
                const image = await useAPI(FILE.GET_FILE, 'GET',undefined, {path: item.product.image});
                let imageUrl = '';
                if(!image.error){
                    imageUrl = (image.data??'') as string;
                }
                productionProductList.value.push({
                    productId: item.productId,
                    actualImageUrl: imageUrl,
                    productName: item.product.productName,
                    internalArticleCode: item.product.internalArticleCode,
                    status: item.product.status,
                    plan: item.plan,
                    planStatus: item.planVerification,
                    actuals: item.actual,
                    actualsStatus: item.actualStatus
                })
            })

            isInitialLoad.value = false;
        }else{
            isInitialLoad.value = false;
        }
    }catch (error){
        isInitialLoad.value = false;
        console.error(error);
    }
}
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
        const result = await useAPI(PRODUCTION.PRODUCTION_PLAN+`/${route.params.id}`, 'PATCH', payload);
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
const id=route.params.id;
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
    updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('production.head.productionPlan'), href: `/production` },
    { title: t('production.head.updateProduction'), href: `/production/update/${id}` },
    { title: selectedYear.value, href: `/production` }
  ]);
    getProductionDetails();
})
</script>

<template>
    <div v-if="!isInitialLoad">
<ProductionPlanForm :isDraft="isDraft" :productionDetail="productionProductList" :title="$t('production.head.updateProduction')" :submitLoading="isSubmitLoad" :draftLoading="isDraftLoad" @submit="submitProduction"></ProductionPlanForm>
</div></template>

<style scoped lang="scss"></style>