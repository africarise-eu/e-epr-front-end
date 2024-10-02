<script setup lang="ts">
import type importShipmentProduct from '@/composables/imports/importShipmentProduct';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { computed, reactive, ref, defineProps, watch,onMounted, onUnmounted, type PropType} from 'vue';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import { DefaultTheme } from '@/theme/LightTheme';
import SelectProducts from '@/components/shared/SelectProducts.vue'
import { CloseOutlined } from '@ant-design/icons-vue';
import type productDto from '@/composables/product/product';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  productList: {
    type: Object as PropType<importShipmentProduct[]>,
    required: true
  },
  handleProducts: {
    type: Function as PropType<(productItems: importShipmentProduct[]) => void>,
    required: true
  },
  errorMessage: {
  type: String,
  required: false
  }
});

const productList = ref([...props.productList]);
const {t} = useI18n();
const computedErrorMessage = computed(() => props.errorMessage);
const showSelectProductModal = ref(false);
const modalWidth = ref('');

const selectedProducts= ref<number[]>([]);

const headers = computed((): DataTableHeader[] => [
  { title: t('import.table.productName'), key: 'productName' },
  { title: t('import.table.internalArticleCode'), key: 'internalArticleCode' },
  { title: t('import.table.units'), key: 'units' },
  { title: t('import.table.taeTotalValue'), key: 'taeTotalValue', sortable: false },
  { title: t('import.table.actions'), key: 'actions', sortable: false },
]);


const deleteProductFromImport= (item:any) => {

}

const handleSelectedProducts = (selectedProductItems: productDto[]) => {
  // Get the IDs of the selected products
  const selectedProductIds = new Set(selectedProductItems.map(product => product.id));

  selectedProductItems.forEach(product => {
    // Calculate the TAE total value
    const taeTotal = product.packingMaterials ? 
        product.packingMaterials.reduce((sum, item) => sum + item.TAE_Total, 0) : 0;
    const formattedTaeTotal = parseFloat(taeTotal.toFixed(2));

    // Check if the product is already in the productList
    const existingProduct = productList.value.find(p => p.productId === product.id);

    if (existingProduct) {
      // Update the existing product's perUnitTotalTaeValue
      existingProduct.perUnitTotalTaeValue = formattedTaeTotal;
    } else {
      // Add the new product to the productList
      const newItem = {
        productId: product.id,
        productName: product.productName,
        image: product.actualImageUrl,
        units: 1,
        internalArticleCode: product.internalArticleCode,
        taeTotalValue: formattedTaeTotal,
        perUnitTotalTaeValue: formattedTaeTotal
      };
      productList.value.push(newItem);
    }
  });

  // Remove products from productList that are not in selectedProductItems
productList.value.splice(0, productList.value.length, ...productList.value.filter((p: any) => selectedProductIds.has(p.productId)));
showSelectProductModal.value =false;
props.handleProducts(productList.value);
};

const totalTAE_Value = computed(() => {
  const sum = productList.value.reduce((sum, item) => sum + item.taeTotalValue, 0);
  return parseFloat(sum.toFixed(2));
});


// calculating totalTaeValue per unit
const handleTaeTotalvalue = (item: importShipmentProduct)=>{ 
   if (isNaN(item.units) || item.units <= 0) {
    item.units = 1; // Reset the field if the value is invalid
  }
  item.units = Number(item.units);
  const result = item.units * item.perUnitTotalTaeValue;
  item.taeTotalValue = parseFloat(result.toFixed(2));
}

const addProducts= () =>{
  selectedProducts.value = productList.value.map((product: any) => product.productId);
  showSelectProductModal.value = !showSelectProductModal.value;
}

const deleteProduct= async(item : importShipmentProduct)=>{
  productList.value = productList.value.filter((product: any) => product.productId !== item.productId);
  
  // Optionally, call the handleProducts function to notify parent or update the backend
  props.handleProducts(productList.value);
}

// Compute modal width based on viewport size
const updateModalWidth = () => {
  const width = window.innerWidth;
  if (width < 600) { // Mobile view
    modalWidth.value = '100%';
  } else if (width < 960) { // Tablet view
    modalWidth.value = '80%';
  } else { // Desktop view
    modalWidth.value = '60%';
  }
};

watch(() => props.productList, (newProductList: any) => {
  productList.value = [...newProductList];
}, { deep: true });

// Initialize modal width on mount
onMounted(() => {
  updateModalWidth();
  window.addEventListener('resize', updateModalWidth);
});

// Clean up event listener on unmount
onUnmounted(() => {
  window.removeEventListener('resize', updateModalWidth);
});
</script>

<template>
  <v-row class="mb-4 align-center">
    <v-col cols="12" sm="6">
      <strong v-if="productList.length > 0" >{{ $t('import.head.productDetails')}} </strong>
       <span v-if="computedErrorMessage" :style="{ color: DefaultTheme.colors?.error, fontSize: '12px' }">{{ computedErrorMessage }}</span>
    </v-col>
     <v-col cols="12" sm="6" class="d-flex justify-end">
      <v-btn color="primary" @click="addProducts()"> 
        {{ $t('import.button.selectProduct') }}
      </v-btn>
    </v-col>
  </v-row>
  <div class="table-container">
  <v-data-table v-if="productList.length > 0" :headers="headers" :items="productList" density="compact" item-key="productId" hide-default-footer >
    <!-- action column -->
      <template v-slot:item.units="{ item }">
                 <v-text-field
                    hide-details="auto"
                    max-width="60%"
                    required
                    v-model="item.units"  
                    variant="outlined"
                    class="mt-2"
                    color="primary"            
                    maxlength="50"
                    type="number"
                    min="1" 
                    :placeholder="$t('import.placeholder.units')"
                    @input="handleTaeTotalvalue(item)"
                ></v-text-field>
    </template>
    <template v-slot:item.productName="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
                      <img v-if="item.image" :src="item.image" alt="Product Image">
                      <PictureOutlined v-else class="icon-avatar-size" > </PictureOutlined>
                    </v-avatar>
                    <span>{{ item.productName }}</span>
                  </div>
          </template>
          <template v-slot:item.actions="{ item }">
            <div class="action-icons">
            <v-tooltip>
                    <template #activator="{ props }">
                      <span v-bind="props" style="cursor: pointer; text-decoration: underline;">
                          <CloseOutlined @click="deleteProduct(item)" class="icon px-3"></CloseOutlined>
                       </span>
                      </template>
                      <span>{{t('common.delete')}}</span> 
               </v-tooltip>
            </div>
          </template>
    <!-- Custom Summary Row -->
  </v-data-table>
  </div>
    <div class="summary-row"  v-if="productList.length > 0">
      <div class="summary-content">
        <div class="text-right font-weight-bold">{{ t('common.label.totaltae') }}</div>
        <div class="text-right font-weight-bold">{{ totalTAE_Value }}</div>
      </div>
    </div>
  <ModalPopup v-model="showSelectProductModal"  :max-width="modalWidth" :title="$t('import.head.selectProducts')">
    <SelectProducts :selectedProducts = selectedProducts :handle-selected-products="handleSelectedProducts"></SelectProducts>
  </ModalPopup>
</template>

<style lang="scss" scoped>
.icon {
  font-size: 15px; /* Adjust size if needed */
  color: #000; /* Default color */
  transition: color 0.3s; /* Smooth transition */
}

/* Hover effect for the icon */
.icon:hover {
  color: blue; /* Hover color */
}

.action-icons {
    display: flex;
    justify-content: center;
}

.action-icons .icon {
    margin: 0 4px; /* Adjust spacing between icons if needed */
}

.table-container {
  max-height: 400px; /* Set height as needed */
  overflow-y: auto; /* Enable vertical scrolling */
}

.summary-row {
  margin-top: 8px; /* Adjust spacing as needed */
  padding: 8px;
  margin-right: 12%;
}

.summary-content {
  display: flex;
  justify-content: flex-end; /* Align items to the right */
  width: 100%;
  gap: 130px; /* Space between elements */
}
</style>