<script setup lang="ts">
import type productDto from '@/composables/product/product';
import { mapApiResponseToProductDto, initializedProduct } from '@/composables/product/product';
import ProductForm from '@/components/product/productForm.vue';
import { reactive, onMounted, defineProps, ref, computed, inject } from 'vue';
import { useApi } from '@/composables/useApi';
import { PRODUCT } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRoute } from 'vue-router';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { PictureOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import Popover from '@/components/shared/Popover.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';

const route = useRoute();

const { t } = useI18n();
const productId = ref(route.params.id);


const headers = computed<DataTableHeader[]>(() => [
  { title: t('packingMaterial.table.material'), align: 'start', sortable: false, key: 'material' },
  { title: t('packingMaterial.table.weight'), align: 'end', key: 'weight', sortable: false },
  { title: t('packingMaterial.table.TAE_KG'), align: 'start', key: 'TAE_KG', sortable: false },
  { title: t('packingMaterial.table.TAE_Total'), align: 'start', key: 'TAE_Total', sortable: false }
]);
const product = initializedProduct;

const fetchById = async () => {
  try {
    const { useAPI } = useApi();
    const result = await useAPI<productDto>(`${PRODUCT.GETBYID}/${productId.value}`, 'GET');
    Object.assign(product, mapApiResponseToProductDto(result.data));
  } catch (error) {
    console.error('product.error.failedGetByProductId', error);
  }
};

const formattedProductData = computed(() => {
  return {
    productName: { label: t('product.label.productName'), value: product.productName },
    productCategory: { label: t('product.label.productCategory'), value: product.productCategory },
    production: { label: t('product.label.production'), value: product.production },
    manufacturerCompany: { label: t('product.label.manufacturerCompany'), value: product.manufacturerCompany },
    countryOfManufacture: { label: t('product.label.countryOfManufacture'), value: product.countries.name },
    brandName: { label: t('product.label.brandName'), value: product.brandName },
    productModelTypeVolume: { label: t('product.label.productModelTypeVolume'), value: product.productModelTypeVolume },
    barcode: { label: t('product.label.barcode'), value: product.barcode },
    internalArticleCode: { label: t('product.label.internalArticleCode'), value: product.internalArticleCode },
    packingMaterials: {
      label: t('product.label.packingMaterials'),
      value: product.packingMaterials.map((pm) => pm.material).join(', ')
    },
    status: { label: t('product.label.status'), value: product.status }
  };
});

const totalWeight = computed(() => {
  const sum = product.packingMaterials.reduce((total: any, material: any) => total + material.weight, 0);
  return parseFloat(sum.toFixed(2));
});

const totalTAE_KG = computed(() => {
  const sum = product.packingMaterials.reduce((total: any, material: any) => total + material.TAE_KG, 0);
  return parseFloat(sum.toFixed(2));
});

const totalTAE_Total = computed(() => {
  const sum = product.packingMaterials.reduce((total: any, material: any) => total + material.TAE_Total, 0);
  return parseFloat(sum.toFixed(2));
});

const id = route.params.id;
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  fetchById();
  const formattedProductName = `${formattedProductData.value.productName.value}`;
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('product.head.productList'), href: `/products` },
    { title: t('product.head.viewProduct'), href: `/products/view/${id}` },
    { title: formattedProductName, href: `/products/view/${id}` }
  ]);
});
</script>

<template>
  <div class="d-flex justify-space-between align-center mb-6 pt-5">
    <h3 class="text-h3 text-center mb-0">{{ $t('product.head.viewProduct') }}</h3>
    <div>
      <v-btn class="mt-5 mr-2 text-capitalize" variant="outlined" :to="'/products'"> {{ $t('common.back') }}</v-btn>
      <v-btn
        v-if="product.status !== STATUSENUM.APPROVED"
        class="mt-5 mr-2 text-capitalize"
        color="primary"
        :to="{ name: 'UpdateProduct', query: { id: product.id } }"
        >{{ $t('product.button.updateProduct') }}</v-btn
      >
    </div>
  </div>
  <v-card class="pt-1">
    <v-card-text>
      <v-row>
        <v-col cols="4">
          <v-img v-if="product.actualImageUrl" :src="product.actualImageUrl" class="icon-size"></v-img>
          <PictureOutlined v-else class="icon-size" style="color: grey"> </PictureOutlined>
        </v-col>
        <v-col cols="8">
          <v-list>
            <v-list-item class="d-grid" v-for="(value, key) in formattedProductData" :key="key">
              <v-row>
                <v-col cols="4">
                  <v-list-item-content>
                    <v-list-item-title class="font-weight-bold">{{ value.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
                <v-col cols="8">
                  <v-list-item-content class="align-end">
                    <v-list-item-title
                      v-if="value.label === t('product.label.status')"
                      class="d-flex text-capitalize"
                      :style="{ color: getStatusColor(value.value.toString()) }"
                      >{{ t(`status.${value.value }`) }}
                      <span v-if="value.value?.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                        <Popover position="below" id="item" :toolTipText="'Brand name is not correct'">
                          <template v-slot:activator>
                            <InfoCircleOutlined />
                          </template>
                          <div>{{ product.rejectedReason }}</div>
                        </Popover>
                      </span>
                    </v-list-item-title>
                    <v-list-item-title v-else class="text-capitalize">{{ value.value }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <h4 class="font-weight-bold">{{ t('product.label.packingMaterials') }}</h4>
          <v-data-table :headers="headers" :items="product.packingMaterials" density="compact" item-key="id" hide-default-footer>
            <template v-slot:item.material="{ item }">
              {{ t(`common.packagingMaterial.${item.material}`) }}
            </template>
            <template v-slot:item.weight="{ item }">
              {{ formatNumberWithCommas(item.weight) }}
            </template>
            <template v-slot:item.TAE_KG="{ item }">
              {{ formatNumberWithCommas(item.TAE_KG) }}
            </template>
            <template v-slot:item.TAE_Total="{ item }">
              {{ formatNumberWithCommas(item.TAE_Total) }}
            </template>
            <!-- Custom Summary Row -->
            <template v-if="product.packingMaterials.length > 0" v-slot:body.append>
              <tr>
                <td class="text-left font-weight-black">{{ t('packingMaterial.table.total') }}</td>
                <td class="text-right font-weight-bold">{{ formatNumberWithCommas(totalWeight) }}</td>
                <td class="text-left font-weight-bold">{{ formatNumberWithCommas(totalTAE_KG) }}</td>
                <td class="text-left font-weight-bold">{{ formatNumberWithCommas(totalTAE_Total) }}</td>
                <!-- Add other summary cells as needed -->
              </tr>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<style scoped>
.font-weight-black {
  font-weight: 900;
}

.icon-size {
  font-size: 300px;
  width: 400px; /* Set the width to match v-img max-width */
  height: 400px; /* Set the height to match v-img max-height */
}
</style>
