<script setup lang="ts">
import type productDto from '@/composables/product/product';
import ProductForm from "@/components/product/productForm.vue";
import { reactive, onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

const {t} = useI18n();
const newProduct = reactive<productDto>({
  // Initialize with empty values or default values for a new product
  id:0,
  productName: '',
  productCategory: '',
  image: '',
  actualImageUrl: '',
  production: '',
  manufacturerCompany: '',
  countryOfManufacture: 1,
  countries:{id: 0, name: ''},
  brandName: '',
  productModelTypeVolume: '',
  barcode: '',
  internalArticleCode: '',
  packingMaterials:[],
  status: '',
});

const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
   updateBreadcrumb?.([
        { title: '', href: '' }  ,
        { title: t('product.head.productList'), href: '/products' },
        { title: t('product.head.addProduct'), href: '' }
  ]); 
});
</script>

<template>
 <div class="d-flex justify-space-between align-center my-6">
    <h3 class="text-h3 text-center mb-0">{{$t('product.head.addProduct')}}</h3>
  </div>
<v-card class="pa-8">
  <ProductForm :productDetails="newProduct" />
</v-card>
</template>
