<script setup lang="ts">
import type productDto from '@/composables/product/product';
import { mapApiResponseToProductDto } from '@/composables/product/product';
import { ref, reactive, defineProps, onMounted,  watch, computed, type PropType } from 'vue';
import { PlusOutlined, EditOutlined } from '@ant-design/icons-vue';
import { productSchema } from '@/utils/validationRules';
import PackingMaterial from "@/components/product/packingMaterial.vue";
import { useApi} from '@/composables/useApi';
import { PRODUCT, FILE } from '@/composables/apiEndpoints';
import { useSnackbarStore } from '@/stores/snackbar';
import type {ErrorsDto} from '@/composables/formError';
import type packingMaterialDto from '@/composables/product/packingMaterial';
import { DefaultTheme } from '@/theme/LightTheme';
import { useI18n } from "vue-i18n";
import { debounce } from 'lodash'; 
import { useRouter } from 'vue-router';
import { getCountries } from '@/composables/services/commonServices';
import type {Country} from '@/composables/country';
import type{FileModel} from '@/composables/filemodel';
import type productQuickSearchDto from '@/composables/product/productQuickSearch';
import { Modal } from 'ant-design-vue';



const props = defineProps({
  productDetails: {
    type: Object as PropType<productDto>,
    required: true
  }
});

let abortController: AbortController | null = null;
const router = useRouter();
const product = reactive(props.productDetails);
const snackbarStore = useSnackbarStore();
const productSchemas = productSchema();
const isSubmitting = ref(false);
const isUploading = ref(false);
const imageFile = ref<File | null>(null);
const fileList = ref<FileModel[]>([]);
const {t} = useI18n();
const searchResults = ref<productQuickSearchDto[]>([]);   
const searchQuery = ref<string>(props.productDetails.productName || '');
const showResults = ref(false);
const imageChanged = ref(false);
const fieldsToExcludeFromValidation = ['id', 'status', 'actualImageUrl', 'countries','rejectedReason'];
const errors = reactive<ErrorsDto>({});
const countries = ref<Country[]>([]);
const showPreview = ref(false);
const previewImage = ref<string>(''); 

const isUpdateForm = computed(() => {
   if (product.actualImageUrl && product.actualImageUrl.includes('https'))
   {
    fileList.value = product.actualImageUrl ? [
      {
        uid: '-1', // Unique identifier for the file
        name: 'product-image',
        status: 'done', // Indicates the upload status
        url: product.actualImageUrl, // URL of the image from API
        isNew: true
      }
    ] : [];
  }
  return product.id !== 0; // or any other condition based on product.id change
});

const hideSubmit = computed(() => {
  return product.status.toLowerCase() == 'approved'; // or any other condition based on product.id change
});

const validateProductCategoryFormat = (category: string): boolean => {
  const pattern = /^[0-9]{2}( [0-9]{2}){5}$/;
  return pattern.test(category);
};
const validate = () => {
  const productToValidate = { ...product } as { [key: string]: any };
  fieldsToExcludeFromValidation.forEach(field => delete productToValidate[field]);
  const { error } = productSchemas.validate(productToValidate, { abortEarly: false });
  if (!validateProductCategoryFormat(product.productCategory)) {
      errors.productCategory = t('product.validation.productCategory.maxlength');
  }
  if (error) {
       error.details.forEach((detail : any) => {
      const path = detail.path[0] as string;
      (errors as ErrorsDto)[path] = detail.message;
    });
    return false;
  }
  if (!validateProductCategoryFormat(product.productCategory)) {
      return false;
  }
  return true;
};

// Define a method to update packing materials
const updatePackingMaterials = (updatedMaterials: packingMaterialDto[]) => {
  product.packingMaterials = updatedMaterials;
  if(product.packingMaterials.length != 0){
    clearErrorByField('packingMaterials');
  }
};

const beforeUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    console.error('product.error.invalidImageType');
    snackbarStore.showMessage(t('imageUpload.info.isJpgOrPng'), 'error');
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    console.error('product.error.imageTooLarge');
    snackbarStore.showMessage(t('imageUpload.info.isLt5M'), 'error');
  }
  return isJpgOrPng && isLt5M;
};

const fetchSearchResults = async (query: string) => {
  if (!query) {
    searchResults.value = [];
    return;
  }

  try {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const { useAPI } = useApi();
    const result = await useAPI<productQuickSearchDto[]>(`${PRODUCT.PRODUCTSEARCH}?query=${query}`, 'GET', {});
    if (result && result.data) {
      searchResults.value = result.data;
      clearAllErrors();
    }
  } catch (error) {
    console.error('Failed to fetch search results:', error);
  }
};

const debouncedFetchSearchResults = debounce(fetchSearchResults, 300);

const fetchById = async (productId: any) => {
  try {
    const { useAPI } = useApi();
    const result  = await useAPI<productDto>(`${PRODUCT.GETBYID}/${productId}`, 'GET');
    Object.assign(product, mapApiResponseToProductDto(result.data));
    product.id = 0;
    product.status = '';
    product.internalArticleCode ='';
    product.packingMaterials = []
  } catch (error) {
    console.error( ('product.error.failedGetByProductId'), error);
  } 
};

const formatProductCategory = (input: string): string => {
  input = input.replace(/\D/g, ''); // Remove non-numeric characters
  return input.replace(/(\d{2})(?=\d)/g, '$1 ').trim(); // Add spaces
};

watch(() => product.productCategory, (newVal: string) => {
  const formattedCategory = formatProductCategory(newVal);
  
  // Only update the value if it's different from the formatted version to prevent an infinite loop
  if (formattedCategory !== newVal) {
    product.productCategory = formattedCategory;
  }
});

const selectItem = (item: any) => {
  fetchById(item.id);
  showResults.value = false;
};

const onBlur = () => {
  setTimeout(() => {
    showResults.value = false;
  }, 200); // Delay to allow click event on list item to register
};

const submitForm = async () => {
  product.productName = searchQuery.value;
  if( validate()) {
    let imageUploadResult = null;
    if(imageChanged.value)
     {
      imageUploadResult = await imageUpload(imageFile.value!);
      if(imageUploadResult)
       {
          product.image = imageUploadResult.data;
       }
    }
    const { useAPI } = useApi();
       
    try {
      let result;
      if (!isUpdateForm.value) {
        result = await useAPI<string>(PRODUCT.ADD, 'POST', product);
      } else {
        result = await useAPI<string>(PRODUCT.UPDATE, 'PATCH', product); // Assuming PUT for updates
      }
      snackbarStore.showMessage(result.message, 'success')
      isSubmitting.value=false;
      router.push({ name: 'ProductList'});

    } catch (error :any) {
      isSubmitting.value=false
    }
  }else{
    isSubmitting.value=false
  }
};

const imageUpload = async (file: File) => {
  const { useAPI } = useApi();

  const formData = new FormData();
  formData.append('file', file);
  // Add custom headers if needed
  const customHeaders = { 'Path': 'product', 'Content-Type': 'multipart/form-data' };

  try {
    const result = await useAPI<string>(FILE.UPLOAD, 'POST', formData, {}, {}, customHeaders);
    return result;
  } catch (error: any) {
    snackbarStore.showMessage('Failed to upload image', 'error');
  } 
};

const handleChange = async (options: any) => {  
  isUploading.value = true;
  const { file, onSuccess, onError } = options;
  imageFile.value = file;
  const objectURL = URL.createObjectURL(file);

  fileList.value = [{
    uid: file.uid,
    name: file.name,
    status: 'done',
    url: objectURL, 
    isNew: true
  }];
  onSuccess(null, file);
  product.image = file.name;
  imageChanged.value = true;
  errors.image = '';  
  isUploading.value = false;
};

const handleRemove = () => {
  fileList.value = [];
  imageFile.value = null;
  product.image = '';
};

const handlePreview = (file: any) => {
  showPreview.value = true;
  previewImage.value = file.url;
};

const handleCancel = () => {
  showPreview.value = false;
};

const clearErrorByField = (field: any) => {
  if ((errors as ErrorsDto)[field]) {
    (errors as ErrorsDto)[field] = '';
  }
};

const clearAllErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key as keyof ErrorsDto] = '';
  });
};

const fetchCountries = async () => {
  try {
    const fetchedCountries = await getCountries();
    countries.value = fetchedCountries || [];
  } catch (error) {
    console.error('Failed to fetch countries:', error);
  }
};

watch(() => props.productDetails.productName, (newName : string) => {
  searchQuery.value = newName || '';
});

watch(searchQuery, (newQuery : any) => {
  if(!isUpdateForm.value)
  {
   debouncedFetchSearchResults(newQuery);
  }
});

onMounted(() => {
  fetchCountries();
});
</script>

<template>
  <v-form @submit.prevent="submitForm" class="mt-7 addProductForm">
    <v-row>
      <v-col cols="12" class="py-0">
        <v-row>
          <v-col cols="12" sm="6" class="py-0">
            <v-row>
              <v-col cols="12" class="py-0">
                <div class="mb-6">
                  <v-label>{{ $t('product.label.productName') }}*</v-label>
                <div class="autocomplete-wrapper">
                    <v-text-field
                      v-model="searchQuery"
                      :placeholder="$t('product.placeholder.productName')"
                      hide-details="auto"
                      required
                      variant="outlined"
                      class="mt-2"
                      color="primary"
                      maxlength="50"
                      :error-messages="errors.productName ? [errors.productName] : []"
                      @input="clearErrorByField('productName')"
                      @focus="showResults = true"
                      @blur="onBlur"
                    ></v-text-field>
                    <v-list v-if="showResults && searchResults.length" class="autocomplete-results">
                      <v-list-item
                        v-for="item in searchResults"
                        :key="item.id"
                        @click="selectItem(item)"
                      >
                        <v-list-item-content>
                          <v-list-item-title>{{ item.productName + ' ' + item.brandName}} </v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" class="py-0">
                <div class="mb-6">
                  <v-label>{{ $t('product.label.production') }}*</v-label>
                  <a-form-item>
                    <v-radio-group v-model="product.production" inline @change="clearErrorByField('production')" :error-messages="errors.production ? [errors.production] : []" >
                      <v-radio label="Imported" value="imported"></v-radio>
                      <v-radio label="Domestic" value="domestic"></v-radio>
                    </v-radio-group>
                  </a-form-item>
                </div>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" sm="6" class="py-0">
            <v-row>
              <v-col cols="12" class="py-0">
              <div class="mb-6">
              <v-label class="pb-2">{{ $t('product.label.image') }}*</v-label>
              <a-upload list-type="picture-card"
               :before-upload="beforeUpload"
               :file-list="fileList"
               :custom-request="handleChange"
               :on-Preview="handlePreview"
               :on-remove="handleRemove"
               :disabled="isUploading"                
               :multiple="false">
                <div v-if="fileList.length < 1">
                  <PlusOutlined  />                  
                  <div style="margin-top: 8px">{{ isUploading ? 'Uploading...' : 'Upload' }}</div>
                </div>
              </a-upload>
              <Modal :open="showPreview" :footer="null"  :onCancel=handleCancel>
                <img alt="example" style="width: 100%" :src=previewImage />
              </Modal>
             <span v-if="errors.image" :style="{ color: DefaultTheme.colors?.error, fontSize: '12px' }">{{ errors.image }}</span>
             </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.productCategory') }}*</v-label>
          <v-text-field
            hide-details="auto"
            required
            v-model="product.productCategory"
            :error-messages="errors.productCategory ? [errors.productCategory] : []"  
            variant="outlined"
            class="mt-2"
            color="primary"            
            maxlength="17"
            :placeholder="$t('product.placeholder.productCategory')"
             @input="clearErrorByField('productCategory')"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.manufacturerCompany') }}*</v-label>
          <v-text-field
            hide-details="auto"
            required
            v-model="product.manufacturerCompany"
            :error-messages="errors.manufacturerCompany ? [errors.manufacturerCompany] : []"  
            variant="outlined"
            class="mt-2"
            color="primary"           
            maxlength="50"
            :placeholder="$t('product.placeholder.manufacturerCompany')"
             @input="clearErrorByField('manufacturerCompany')"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.countryOfManufacture') }}*</v-label>
                <v-select
                    :items="countries"
                    v-model="product.countryOfManufacture"
                    :error-messages="errors.countryOfManufacture ? [errors.countryOfManufacture] : []"
                    variant="outlined"
                    class="mt-2"
                    color="primary"
                    item-value="id"
                    item-title="name"
                    :placeholder="$t('product.placeholder.countryOfManufacture')"
                    @input="clearErrorByField('countryOfManufacture')"
                  ></v-select>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.brandName') }}*</v-label>
          <v-text-field
            hide-details="auto"
            required
            v-model="product.brandName"
            :error-messages="errors.brandName ? [errors.brandName] : []"  
            variant="outlined"
            class="mt-2"
            color="primary"           
            maxlength="50"
            :placeholder="$t('product.placeholder.brandName')"
             @input="clearErrorByField('brandName')"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.productModelTypeVolume') }}*</v-label>
          <v-text-field
            hide-details="auto"
            required
            v-model="product.productModelTypeVolume"
            :error-messages="errors.productModelTypeVolume ? [errors.productModelTypeVolume] : []"  
            variant="outlined"
            class="mt-2"
            color="primary"           
            maxlength="50"
            :placeholder="$t('product.placeholder.productModelTypeVolume')"
             @input="clearErrorByField('productModelTypeVolume')"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.barcode') }}*</v-label>
          <v-text-field
            hide-details="auto"
            required
            v-model="product.barcode"
            :error-messages="errors.barcode ? [errors.barcode] : []"  
            variant="outlined"
            class="mt-2"
            color="primary"           
            maxlength="50"
            :placeholder="$t('product.placeholder.barcode')"
             @input="clearErrorByField('barcode')"
          ></v-text-field>
        </div>
      </v-col>
      <v-col cols="12" sm="6" class="py-0">
        <div class="mb-6">
          <v-label>{{ $t('product.label.internalArticleCode') }}*</v-label>
          <v-text-field
            hide-details="auto"
            required
            v-model="product.internalArticleCode"
            :error-messages="errors.internalArticleCode ? [errors.internalArticleCode] : []"  
            variant="outlined"
            class="mt-2"
            color="primary"           
            maxlength="50"
            :placeholder="$t('product.placeholder.internalArticleCode')"
             @input="clearErrorByField('internalArticleCode')"
          ></v-text-field>
        </div>
      </v-col>
    </v-row>
    <v-divider class="my-4"></v-divider>

    <PackingMaterial :packing-material-list="product.packingMaterials" :error-message ="errors.packingMaterials ? errors.packingMaterials : ''" 
    :update-packing-materials="updatePackingMaterials"></PackingMaterial>

      <div class="d-flex align-center justify-center mt-4 mb-7 mb-sm-0">
        <v-btn :loading="isSubmitting" class="mt-5 mr-2" variant="outlined" :to="'/products'" size="large" >
        {{hideSubmit ? $t('common.back') : $t('common.cancel')}}</v-btn>
          <v-btn v-if="!hideSubmit" :loading="isSubmitting" color="primary" class="mt-5" variant="flat" size="large" type="submit">
        {{ !isUpdateForm ? $t('product.button.submitProduct') : $t('product.button.updateProduct') }}</v-btn>
      </div>
  </v-form>
</template>
<style scoped>
.autocomplete-wrapper {
  position: relative;
}

.autocomplete-results {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  z-index: 10;
  background-color: white;
  border: 1px solid #ddd;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
