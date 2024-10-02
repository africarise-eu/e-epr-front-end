<script setup lang="ts">
import { computed, onMounted, reactive, ref, type PropType, defineProps, watch, type Ref} from 'vue';
import { useApi } from '@/composables/useApi';
import { PRODUCT } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type importShipmentProduct from '@/composables/imports/importShipmentProduct';
import type productDto from '@/composables/product/product';
import type packingMaterialDto from '@/composables/product/packingMaterial';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import {  PictureOutlined } from '@ant-design/icons-vue';
import { debounce } from 'lodash';

const props = defineProps({
  isProduction:{
    type: Boolean,
    required: false,
    default: false
  },
  selectedProducts: {
    type: Object as PropType<number[]>,
    required: true
  },
  handleSelectedProducts: {
    type: Function as PropType<(selectedProductItems: productDto[]) => void>,
    required: true
  },
  excludeProducts: {
    type: Object as PropType<number[]>,
    required: false,
    default: () => []
  },
});

interface ApiResponse {
  count: number;
  rows: productDto[];
}
const products = ref<productDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(20);
const {t} = useI18n();
const search = ref('');
//let existProducts = ref(props.selectedProducts);
const selectedProductResult = ref(<productDto[]>([]));
const excludeProductIds = ref(props.excludeProducts);

const headers = computed((): DataTableHeader[] => [
  { title: t('selectProduct.table.product'), key: 'productName' },
  { title: t('selectProduct.table.manufacturerCompany'), key: 'manufacturerCompany' },
  { title: t('selectProduct.table.productCategory'), key: 'productCategory' }
]);


const mapPackingMaterials = (packingMaterials: any[]): packingMaterialDto[] => {
  return packingMaterials.map(item => ({
    id: item.id ?? 0, // Default values if fields are missing
    materialId: item.materialId ?? null,
    material: item.material ?? '',
    weight: item.weight ?? null,
    TAE_KG: item.TAE_KG ?? 0,
    TAE_Total: item.taeTotal ?? 0,
    verification: item.verification ?? '',
    // Add any additional fields and default values as needed
  }));
};

const getAll = async (search:string, limit:number, page:number, excludeIds: number[] = []) => {
  try {
    const { useAPI } = useApi();
    const payload:any = { search, limit, page, excludeIds};
    if(props.isProduction){
      payload['menu_type'] = 'production';
    } 
    const result = await useAPI<ApiResponse>(PRODUCT.GETALLAPPROVED, 'GET', null, payload);
    if (result && result.data) {
      products.value = result.data.rows.map((product: productDto) => ({
        ...product,
        packingMaterials: mapPackingMaterials(product.packingMaterials) // Apply mapping to packingMaterials
      }));
      productCount.value = result.data.count;
      syncSelectedProducts();
    }
  } catch (error) {
    console.error('Failed to get products:', error);
  } 
};

const syncSelectedProducts = () => {
  // Add new products that are not in the current products list
  props.selectedProducts.forEach((id: number) => {
    const product = products.value.find((p: productDto) => p.id === id);
    if (product) {
      selectedProductResult.value.push(product);
    }
  });
};

const handleSearchFilter = debounce(() => {  
  currentPage.value = 1;
  getAll(search.value, itemsPerPage.value, currentPage.value, excludeProductIds.value);
}, 1000);

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, itemsPerPage.value, currentPage.value, excludeProductIds.value);
};

const save=() => {
     props.handleSelectedProducts(selectedProductResult.value);
}

onMounted(() => {
  getAll(search.value, itemsPerPage.value, currentPage.value, excludeProductIds.value);
});
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-start align-start">
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('product.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
    </div>
    <v-card class="pt-1">
      <v-card-text>
         <v-data-table v-model="selectedProductResult" :headers="headers" :items="products"  item-value="id" show-select return-object hide-default-footer>
          <template v-slot:item.productName="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="36" class="circle-avatar icon-avatar-size mr-4">
                      <img v-if="item.actualImageUrl" :src="item.actualImageUrl" alt="Product Image">
                       <PictureOutlined v-else class="icon-avatar-size" > </PictureOutlined>
                    </v-avatar>
                    <span>{{ item.productName }}</span>
                  </div>
          </template>
          </v-data-table>
      </v-card-text>
    </v-card>
      <v-pagination
       v-if="productCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(productCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
    <div class="d-flex align-center justify-center mt-4 mb-7 mb-sm-0">
          <v-btn @click="save" color="primary" class="mt-5" variant="flat" size="large">
        {{ $t('common.save')}}</v-btn>
      </div>
</template>
<style lang="scss" scoped>
/* Make v-avatar a square */
.circle-avatar {
  border-radius: 5; 
  width: 36px; 
  height: 36px; 
}

.circle-avatar img {
  object-fit: cover; 
  width: 100%; 
  height: 100%; 
}

.icon-avatar-size {
  font-size: 36px; /* Adjust size to match avatar */
  width: 36px;
  height: 36px;
}
.icon-container {
  display: inline-flex;
  align-items: center;
}

.v-table{
  ::v-deep .v-table__wrapper table tbody tr td{
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
        
}
</style>
