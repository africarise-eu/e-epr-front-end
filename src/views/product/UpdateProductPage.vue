<script setup lang="ts">
import type productDto from '@/composables/product/product';
import { mapApiResponseToProductDto, initializedProduct } from '@/composables/product/product';
import ProductForm from "@/components/product/productForm.vue";
import { reactive, onMounted, defineProps, ref, inject  } from 'vue';
import { useApi } from '@/composables/useApi';
import { PRODUCT } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { string } from 'joi';

const route = useRoute();

const {t} = useI18n();
const productId =  ref(route.params.id);
const product = initializedProduct;
const formattedProductName = ref('');

const fetchById = async () => {
  try {
    const { useAPI } = useApi();
    const result  = await useAPI<productDto>(`${PRODUCT.GETBYID}/${productId.value}`, 'GET');
    Object.assign(product, mapApiResponseToProductDto(result.data));
    formattedProductName.value=product.productName;
   
  } catch (error) {
    console.error( ('product.error.failedGetByProductId'), error);
  } 
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('product.head.productList'), href: `/products` },
    { title: t('product.head.editProduct'), href: `/products/update/${id}` },
    { title: formattedProductName.value, href: `/products/update/${id}` }
  ]);
};
const id=route.params.id;
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  fetchById();
});

</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('product.head.editProduct')}}</h3>
  </div>
<v-card class="pa-8">
  <ProductForm :productDetails="product" />
</v-card>
</template>
