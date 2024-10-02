<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE, PRODUCT, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { CloseOutlined, PictureOutlined, SearchOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import { ROLE } from '@/composables/role';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import type productDto from '@/composables/product/product';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { green, red } from 'vuetify/util/colors';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';
import { STATUSENUM } from '@/composables/status';
import { getStatusColor } from '@/composables/status';
import { formatNumberWithCommas } from '@/utils/commonMethods';

interface ApiResponse {
  count: number;
  rows: productionResponseDto[];
}

interface productionResponseDto {
  id: number;
  productId: number;
  plan: number;
  actual: number;
  previousPlan: number;
  previousActual: number;
  productName: string;
  productImage: string;
  actualStatus: string;
  planStatus: string;
  productCategory: string;
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const showHistory = ref(false);
const productList = ref<productionResponseDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const logId = ref(0);
const user = JSON.parse(localStorage.getItem('user')!);
const isFromCompany = ref(false);
const selectedCompany = ref<number>();
const selectedCompanyText = ref<string>();
const currentYear = new Date().getFullYear();

// Dialog-related state
const selectedProduct = ref<productionResponseDto | null>(null);
const currentProduct = ref<productDto | null>(null);
const currentProductImage = ref<string>();
const dialogVisible = ref(false);
const rejectModalVisible = ref(false); // State to handle reject modal visibility
const rejectReason = ref('');
const rejectReasonModelValue = ref<{ type: 'plan' | 'actual' }>({ type: 'plan' });
const isPlanActionDisabled = computed(() => {
  return selectedProduct.value?.planStatus === STATUSENUM.APPROVED || selectedProduct.value?.planStatus === STATUSENUM.REJECTED;
});

const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}

const isActualActionDisabled = computed(() => {
  return selectedProduct.value?.actualStatus === STATUSENUM.APPROVED || selectedProduct.value?.actualStatus === STATUSENUM.REJECTED;
});

const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.table.product'), key: 'productName' },
  { title: t('verifier.table.hsCode'), key: 'productCategory' },
  { title: t('verifier.table.plan', {year: currentYear}),align: 'end', key: 'plan' },
  { title: t('verifier.table.actuals',{year: currentYear - 1}),align: 'end', key: 'actual' },
  { title: t('verifier.table.plan',{year: currentYear - 1}),align: 'end', key: 'previousPlan' },
  { title: t('verifier.table.actuals',{year: currentYear - 2}),align: 'end', key: 'previousActual' },
  { title: t('verifier.table.actions'), align: 'start', key: 'actions', sortable: false }
]);
const companyDropdownList = ref<companyListDropdownDto[]>([]);
const getCompanyList = async () => {
  const { useAPI } = useApi();
  const result = await useAPI<{ count: number; rows: companyListResponseDto[] }>(COMPANY.LIST_COMPANY, 'GET');
  if (!result.error) {
    companyDropdownList.value = result.data.rows.map((company) => {
      return { id: company.id, name: company.companyName };
    });
  }
};

const getAll = async (search: string, limit: number, page: number, id?: number) => {
  try {
    const { useAPI } = useApi();
     //const payload = { search, limit, page};
    const result = await useAPI<productionResponseDto[]>(VERIFIER.PRODUCTION + `/${id}`, 'GET');
    const selectedCompanyText = companyDropdownList.value.find((company) => company.id === id)?.name;
   if (result && result.data) {
      updateBreadcrumb?.([
        { title: '', href: '' },
        { title: t('verifier.head.productionPlans'), href: `/verify/production` },
        { title: selectedCompanyText ?? '', href: `/verify/productionplan/${id}` }
      ]);
      productList.value = [];
      result.data.map(async (product: productionResponseDto) => {
        let imageUrl = '';
        if (product.productImage) {
          const image = await useAPI(FILE.GET_FILE, 'GET', undefined, { path: product.productImage });
          if (!image.error) {
            imageUrl = (image.data ?? '') as string;
          }
        }
        productList.value.push({
          ...product,
          productImage: imageUrl
        });
      });
      //productCount.value= result.data.count;
    } else {
      productCount.value = 0;
      productList.value = [];
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  }
};

const verifyProductClick = async (item: productionResponseDto) => {
  try {
    // Call the API to get the product details by productId
    const { useAPI } = useApi();
    const Productresult = await useAPI<productDto>(`${PRODUCT.GETBYID}/${item.productId}`, 'GET');

    if (Productresult && Productresult.data) {
      let imageUrl = '';
      if (Productresult.data.image) {
        const image = await useAPI(FILE.GET_FILE, 'GET', undefined, { path: Productresult.data.image });
        if (!image.error) {
          imageUrl = (image.data ?? '') as string;
        }
      }
      currentProductImage.value = imageUrl;
      currentProduct.value = Productresult.data;
      selectedProduct.value = item;
      dialogVisible.value = true; // Open the dialog
    } else {
      snackbarStore.showMessage(t('verifier.error.failedToGetProductDetails'), 'error');
    }
  } catch (error) {
    console.error('Error fetching product details:', error);
    snackbarStore.showMessage(t('verifier.error.failedToGetProductDetails'), 'error');
  }
};

const closeDialog = () => {
  dialogVisible.value = false;
};

const closeRejectModal = () => {
  rejectModalVisible.value = false;
  rejectReason.value = '';
};

// Approve action
const submitPlanStatus = async (item: productionResponseDto, status: string, rejectedReason?: string) => {
  let payload = {
    planVerification: status,
    id: item.id,
    planRejectReason: rejectedReason
  };

  const { useAPI } = useApi();
  const result = await useAPI(VERIFIER.PRODUCTION, 'PATCH', payload);
  if (!result.error) {
    snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
    getAll(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
    closeDialog();
  } else {
    snackbarStore.showMessage(t('verifier.error.failedToApprove'), 'error');
  }
};

const submitActualStatus = async (item: productionResponseDto, status: string, rejectedReason?: string) => {
  let payload = {
    id: item.id,
    actualStatus: status,
    actualRejectedReason: rejectedReason
  };
  const { useAPI } = useApi();
  const result = await useAPI(VERIFIER.PRODUCTION, 'PATCH', payload);
  if (!result.error) {
    snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
    getAll(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
    closeDialog();
  } else {
    snackbarStore.showMessage(t('verifier.error.failedToApprove'), 'error');
  }
};

const openRejectModal = (type: 'plan' | 'actual') => {
  rejectReasonModelValue.value.type = type; // Set the type for plan or actual
  rejectModalVisible.value = true;
};

const reject = async () => {
  if (!selectedProduct.value || !rejectReason.value) return;

  try {
    const { useAPI } = useApi();

    switch (rejectReasonModelValue.value.type) {
      case 'plan':
        await submitPlanStatus(selectedProduct.value, STATUSENUM.REJECTED, rejectReason.value);
        break;
      case 'actual':
        await submitActualStatus(selectedProduct.value, STATUSENUM.REJECTED, rejectReason.value);
        break;
      default:
        return;
    }

    snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
    closeRejectModal();
  } catch (error) {
    console.error('Error during rejection:', error);
    snackbarStore.showMessage(t('verifier.error.failedToReject'), 'error');
  }
};

const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  getAll(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
}, 1000);

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
};

const navigateBack = () => {
 router.push({ name: 'VerifyProductionList'});
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('verifier.head.productionPlans'), href: `/verify/production` },
    { title: t('verifier.head.productionPlan'), href: `/verify/productionplan` }
  ]);
  search.value = filterStore.search;
  if (route.params.companyId) {
    selectedCompany.value = Number(route.params.companyId);
    isFromCompany.value = true;
  }
  const roleSelection = localStorage.getItem('user');
  if (roleSelection) {
    try {
      const user = JSON.parse(roleSelection);
      selectedRole.value = user.roleId;
      if (selectedRole.value !== ROLE.VERIFIER) {
        router.push({ name: 'Dashboard' });
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
  await getCompanyList();
  await getAll(search.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
});
function capitalizeFirstLetter(text: String | undefined) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('verifier.head.productionPlan') }}</h3>
      <v-btn class="text-capitalize"   @click="navigateBack" >{{ $t('common.back') }}</v-btn>
    </div>
    <div class="d-flex justify-start align-start">
      <v-text-field
        variant="outlined"
        v-model="search"
        @input="handleSearchFilter()"
        :label="$t('verifier.label.search')"
        max-width="300px"
      >
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
    </div>
    <v-card class="pt-1">
      <v-card-text>
        <v-data-table :headers="headers" :items="productList" item-key="id" hide-default-footer>
          <template v-slot:item.productName="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
                <img v-if="item.productImage" :src="item.productImage" alt="Product Image" />
                <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
              </v-avatar>
              <span>{{ item.productName }}</span>
            </div>
          </template>
          <template v-slot:item.productCategory="{ item }">
            <td :style="{ minWidth: '150px' }">{{ item.productCategory }}</td>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn class="text-capitalize" color="primary" @click="verifyProductClick(item)">{{ $t('verifier.button.verify') }}</v-btn>
          </template>
          <template v-slot:item.plan="{ item }">
            {{ formatNumberWithCommas(item.plan) }}
          </template>
          <template v-slot:item.actual="{ item }">
            {{ formatNumberWithCommas(item.actual) }}
          </template>
          <template v-slot:item.previousPlan="{ item }">
            {{ formatNumberWithCommas(item.previousPlan) }}
          </template>
          <template v-slot:item.previousActual="{ item }">
            {{ formatNumberWithCommas(item.previousActual) }}
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

    <!-- Main Dialog for Verification -->
    <v-dialog v-model="dialogVisible" class="maindialogue" max-width="800px">
      <v-card>
        <v-card-title class="text-h3">
          {{ t('verifier.dialog.productionPlanTitle') }}
          <CloseOutlined @click="closeDialog" class="ml-auto float-right" />
        </v-card-title>
        <v-card-text>
          <v-row>
            <!-- Product Image -->
            <v-col cols="3">
              <v-img v-if="currentProductImage" :src="currentProductImage" class="icon-size"></v-img>
              <PictureOutlined v-else class="icon-size" style="color: grey"> </PictureOutlined>
            </v-col>
            <!-- Product Details -->
            <v-col cols="9 pl-10">
              <v-row class="py-3">
                <v-text class="font-weight-bold">{{ t('verifier.table.productName') + ' : ' + selectedProduct?.productName }}</v-text>
              </v-row>
              <v-row class="py-3">
                <v-text class="font-weight-bold">{{ t('product.label.productCategory') + ' : ' + currentProduct?.productCategory }}</v-text>
              </v-row>
              <v-row class="py-3">
                <v-text class="font-weight-bold">{{
                  t('product.label.internalArticleCode') + ' : ' + currentProduct?.internalArticleCode
                }}</v-text>
              </v-row>
            </v-col>
          </v-row>

          <!-- Verification Table -->
          <v-row>
            <v-col cols="12">
              <table class="verification-table" style="width: 100%; background-color: #f8f9fa; border-collapse: collapse">
                <thead>
                  <tr>
                    <th style="padding: 10px; text-align: right;padding-left: 20px">{{ t('verifier.table.plan', {year: currentYear})}}</th>
                    <th style="padding: 10px; text-align: left; padding-left: 10px">{{ t('verifier.table.verificationStatus') }}</th>
                    <th style="padding: 10px; text-align: right">{{ t('verifier.table.plan', {year: currentYear-1})}}</th>
                    <th style="padding: 10px; text-align: left;padding-left: 20px;min-width: 200px;">{{ t('verifier.table.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px;text-align: right">{{ formatNumberWithCommas(selectedProduct?.plan ?? 0) }}</td>
                    <td :style="{ padding: '10px', paddingLeft: '20px' }">
                      <div class="d-flex">
                      <span  :style="{ color: getStatusColor(selectedProduct?.actualStatus ?? '')}">
                         {{ t(`status.${selectedProduct?.planStatus}`) }}
                      </span>
                      <span  style="display: flex; align-items: center; justify-content: center;">
                      <v-tooltip>
                                  <template #activator="{ props }">
                                    <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                      <div class="ml-2 icon">
                                        <InfoCircleOutlined @click="showLogHistory(selectedProduct?.id ?? 0)"  />
                                      </div>
                                    </span>
                                  </template>
                                  <span> {{ t('logHistory.buttnText') }}</span>
                      </v-tooltip> 
                </span>
                      </div>
                    </td>
                    <td style="padding: 10px;text-align: right">{{ formatNumberWithCommas(selectedProduct?.previousPlan ?? 0) }}</td>
                    <td style="padding: 10px; text-align: left; padding-left: 20px;">
                      <template
                        v-if="selectedProduct?.planStatus === STATUSENUM.APPROVED || selectedProduct?.planStatus === STATUSENUM.REJECTED"
                      >
                        <span style="color: blue">{{ t('verifier.label.verified') }}</span>
                      </template>
                      <template v-else>
                        <a-button :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }" @click="selectedProduct && submitPlanStatus(selectedProduct, 'approved')">
                          {{ t('verifier.button.approve') }}
                        </a-button>
                        <a-button
                          :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545', marginLeft: '5px' }"
                          @click="openRejectModal('plan')"
                        >
                          {{ t('verifier.button.reject') }}
                        </a-button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>

              <table class="verification-table" style="width: 100%; background-color: #f8f9fa; border-collapse: collapse; margin-top: 20px">
                <thead>
                  <tr>
                    <th style="padding: 10px; text-align: right; padding-right: 10px; ">{{ t('verifier.table.actuals', {year: currentYear-1}) }}</th>
                    <th style="padding: 10px; text-align: left">{{ t('verifier.table.verificationStatus') }}</th>
                    <th style="padding: 10px; text-align: right">{{ t('verifier.table.actuals', {year: currentYear-2})}}</th>
                    <th style="padding: 10px; text-align: left;min-width: 190px;">{{ t('verifier.table.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 10px;; text-align: right">{{ formatNumberWithCommas(selectedProduct?.actual ?? 0) }}</td>
                    <td :style="{padding: '10px' }">
                      <div class="d-flex">
                      <span  :style="{ color: getStatusColor(selectedProduct?.actualStatus ?? '')}">
                       {{ t(`status.${selectedProduct?.actualStatus}`) }}
                      </span>
                        <span  style="display: flex; align-items: center; justify-content: center;">
                      <v-tooltip>
                                  <template #activator="{ props }">
                                    <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                      <div class="ml-2 icon">
                                        <InfoCircleOutlined @click="showLogHistory(selectedProduct?.id ?? 0)"  />
                                      </div>
                                    </span>
                                  </template>
                                  <span> {{ t('logHistory.buttnText') }}</span>
                      </v-tooltip> 
                </span>
                      </div>
                    </td>
                    <td style="padding: 10px;text-align: right">{{ formatNumberWithCommas(selectedProduct?.previousActual ?? 0) }}</td>
                    <td style="padding: 10px; text-align: left">
                      <template
                        v-if="
                          selectedProduct?.actualStatus === STATUSENUM.APPROVED || selectedProduct?.actualStatus === STATUSENUM.REJECTED
                        "
                      >
                        <span style="color: blue">{{ t('verifier.label.verified') }}</span>
                      </template>
                      <template v-else>
                        <a-button
                          :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }"
                          @click="selectedProduct && submitActualStatus(selectedProduct, 'approved')"
                        >
                          {{ t('verifier.button.approve') }}
                        </a-button>
                        <a-button
                          :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545', marginLeft: '5px' }"
                          @click="openRejectModal('actual')"
                        >
                          {{ t('verifier.button.reject') }}
                        </a-button>
                      </template>
                    </td>
                  </tr>
                </tbody>
              </table>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Reject Reason Modal -->
    <v-dialog v-model="rejectModalVisible" max-width="500px">
      <v-card>
        <v-card-title class="text-h3">
          {{ t('verifier.dialog.rejectTitle') }}
        </v-card-title>
        <v-card-text>
          <v-textarea v-model="rejectReason" required></v-textarea>
        </v-card-text>
        <v-card-actions class="d-flex justify-end">
          <a-button :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }" @click="reject">{{
            t('verifier.button.confirmReject')
          }}</a-button>
          <a-button
            :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545', marginLeft: '5px' }"
            @click="closeRejectModal"
          >
            {{ t('verifier.button.cancel') }}
          </a-button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
   <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.PRODUCTION" />
  </ModalPopup>
</template>

<style lang="scss" scoped>
/* Make v-avatar a square */
.square-avatar {
  border-radius: 5;
  width: 36px;
  height: 36px;
}

.square-avatar img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.icon-avatar-size {
  font-size: 36px;
  width: 36px;
  height: 36px;
}

.icon-container {
  display: inline-flex;
  align-items: center;
}

.action-icons {
  display: flex;
  justify-content: center;
}

.action-icons .icon {
  margin: 0 4px;
}
.icon:hover {
  color: blue; /* Hover color */
}
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
