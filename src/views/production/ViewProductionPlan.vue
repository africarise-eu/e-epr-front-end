<script setup lang="ts">
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { DefaultTheme } from '@/theme/LightTheme';
import { computed, inject, onMounted, ref } from 'vue';
import { CloseOutlined, InfoCircleOutlined, PictureOutlined } from '@ant-design/icons-vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useRouter } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { useI18n } from 'vue-i18n';
import { ROLE } from '@/composables/role';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { COMPANY, FILE, PRODUCTION } from '@/composables/apiEndpoints';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import Popover from '@/components/shared/Popover.vue';
import ConfirmationPopup, { type ConfirmationPopupProps } from '@/components/shared/ConfirmationPopup.vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';
import type { CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
export interface ProductionResponseDto {
  id: number;
  title: string;
  description: string;
  companyId: number;
  userId: number;
  planYear: number;
  previousYear: number;
  isDraft: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  previousYearPlan: string;
  productionProduct: {
    id: number;
    productId: number;
    productionId: number;
    plan: number;
    planVerification: string;
    planAmount: number;
    planRejectReason: string;
    actual: number;
    actualStatus: string;
    actualAmount: number;
    createdAt: string;
    updatedAt: string;
    previousYearPlan: number;
    product: {
      id: number;
      companyId: number;
      productName: string;
      productCategory: string;
      production: string;
      image: string;
      manufacturerCompany: string;
      countryOfManufacture: string;
      brandName: string;
      productModelTypeVolume: string;
      barcode: string;
      internalArticleCode: string;
      status: string;
      userId: number;
      createdAt: string;
      updatedAt: string;
    };
  }[];
}
export interface productionDetailPreviousDto {
  productId: number;
  actualImageUrl: string;
  productName: string;
  internalArticleCode: string;
  status: string;
  plan: number;
  planStatus: string;
  actuals: number;
  actualsStatus: string;
  previousYearPlan: number;
  actualsStatusReason?: string;
  planStatusReason?: string;
  productStatusReason?: string;
}
const snackbarStore = useSnackbarStore();
const selectedRoleId = ref<number>(0);
const router = useRouter();
const confirmDialogData = ref<ConfirmationPopupProps>({
  title: 'Confirmation',
  message: 'Are you sure you want to proceed?',
  confirmButtonText: 'Confirm',
  cancelButtonText: 'Cancel',
  show: false,
  type: 'submit'
});
const { t } = useI18n();
const production = ref<ProductionResponseDto>();
const productionProductList = ref<productionDetailPreviousDto[]>([]);
const isLoading = ref(false);
const currentYear = new Date().getFullYear();
const selectedYear = ref(currentYear.toString());
const startYear = currentYear - 10;
const endYear = currentYear + 1;

const fetchCompanyProfile = async (value: number) => {
  const { useAPI } = useApi();
  try {
    const result = await useAPI<CompanyProfileResponseProps>(COMPANY.COMPANY_PROFILE, 'GET');
    return result.data; // Return the data if available
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
};

const isCompanyProfile = ref(false);
const isCompanyVerified = ref(true);
const user = JSON.parse(localStorage.getItem('user')!);
const companiData = await fetchCompanyProfile(user.companyId);
const companyStatus = ref(companiData?.status);
if (
  companyStatus.value === undefined ||
  companyStatus.value === null ||
  companyStatus.value === '' ||
  companyStatus.value === STATUSENUM.REJECTED
) {
  isCompanyVerified.value = false;
}
isCompanyProfile.value = user.isProfileExist;
const isAllApproved = ref(false);
const isoneApproved = ref(false);

const years = computed(() => {
  const yearsArray = [];
  for (let year = startYear; year <= endYear; year++) {
    yearsArray.push(year.toString());
  }
  return yearsArray;
});
const headers = computed<DataTableHeader[]>(() => [
  { title: t('production.table.product'), key: 'productName' },
  { title: t('production.table.internalArticleCode'), key: 'internalArticleCode' },
  { title: t('production.table.status'), key: 'status', sortable: false },
  { title: t('production.table.plan', { year: selectedYear.value }),align: 'end', key: 'plan' },
  { title: t('production.table.planStatus', { year: selectedYear.value }), key: 'planStatus', sortable: false },
  { title: t('production.table.actuals', { year: Number(selectedYear.value) - 1 }),align: 'end', key: 'actuals' },
  { title: t('production.table.actualsStatus', { year: Number(selectedYear.value) - 1 }), key: 'actualsStatus', sortable: false },
  { title: t('production.table.plan', { year: Number(selectedYear.value) - 1 }), align: 'end', key: 'previousYearPlan', sortable: false }
]);

const getAll = async (year: string) => {
  try {
    const { useAPI } = useApi();

    const result = await useAPI<ProductionResponseDto>(PRODUCTION.LIST_PRODUCTION + `/${year}`, 'GET');

    if (result && result.data) {
      production.value = result.data;
      productionProductList.value = [];
      result.data.productionProduct.map(async (item: any) => {
        let imageUrl = '';
        if (item.product.image) {
          const image = await useAPI(FILE.GET_FILE, 'GET', undefined, { path: item.product.image });
          if (!image.error) {
            imageUrl = (image.data ?? '') as string;
          }
        }
        if (item.actualStatus?.toLowerCase() === STATUSENUM.APPROVED && item.planVerification?.toLowerCase() === STATUSENUM.APPROVED) {
          isAllApproved.value = true;
        } else {
          isAllApproved.value = false;
        }

        if (item.actualStatus?.toLowerCase() === STATUSENUM.APPROVED || item.planVerification?.toLowerCase() === STATUSENUM.APPROVED) {
          isoneApproved.value = true;
        } else {
          isoneApproved.value = false;
        }
        productionProductList.value.push({
          productId: item.productId,
          actualImageUrl: imageUrl,
          productName: item.product.productName,
          internalArticleCode: item.product.internalArticleCode,
          status: item.product.status,
          plan: item.plan,
          planStatus: item.planVerification,
          planStatusReason: item.planRejectReason,
          actuals: item.actual,
          actualsStatus: item.actualStatus,
          actualsStatusReason: item.actualRejectedReason,
          previousYearPlan: item.previousYearPlan
        });
      });
    } else {
      productionProductList.value = [];
    }
  } catch (error) {
    console.error('Failed to get tae status:', error);
  }
};

const handleYearFilter = () => {
  getAll(selectedYear.value);
  // headers.value = [
  //   { title: t('production.table.product'), key: 'productName' },
  //   { title: t('production.table.internalArticleCode'), key: 'internalArticleCode' },
  //   { title: t('production.table.status'), key: 'status', sortable: false },
  //   { title: t('production.table.plan', { year: selectedYear.value }), key: 'plan' },
  //   { title: t('production.table.planStatus'), key: 'planStatus', sortable: false },
  //   { title: t('production.table.actuals', { year: Number(selectedYear.value) - 1 }), key: 'actuals' },
  //   { title: t('production.table.actualsStatus'), key: 'actualsStatus', sortable: false },
  //   {
  //     title: t('production.table.plan', { year: Number(selectedYear.value) - 1 }),
  //     align: 'center',
  //     key: 'previousYearPlan',
  //     sortable: false
  //   }
  // ];
};

const isCurrentYear = () => {
  return selectedYear.value === currentYear.toString();
};
const editProduct = () => {
  router.push({ name: 'UpdateProductionPlan', params: { id: production.value?.id.toString() } });
};
const addProduction = () => {
  router.push({ name: 'AddProductionPlan' });
};

const isApprovedProduct = () => {
  return production.value?.status === 'approved';
};
const handleConfirm = () => {
  confirmDialogData.value.show = false;
  switch (confirmDialogData.value.type) {
    case 'delete':
      deleteProductionConfirm();
      break;
    case 'back':
      router.push({ name: 'ProductionPlan' });
      break;
    default:
      break;
  }
};
const handleCancel = () => {
  confirmDialogData.value.show = false;
  return;
};

const deleteProduction = () => {
  confirmDialogData.value = {
    title: 'Delete Production Plan',
    message: 'Are you sure you want to delete this production plan?',
    confirmButtonText: 'Confirm',
    cancelButtonText: 'Cancel',
    show: true,
    type: 'delete'
  };
};
const deleteProductionConfirm = async () => {
  isLoading.value = true;
  try {
    const { useAPI } = useApi();

    await useAPI(PRODUCTION.PRODUCTION_PLAN + `/${production.value?.id}`, 'Delete');
    snackbarStore.showMessage('Production plan deleted successfully', 'success');
    getAll(selectedYear.value);
    isLoading.value = false;
  } catch (error) {
    isLoading.value = false;
    console.error(error);
  }
};
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  // getProductionDetails();
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('production.head.productionPlan'), href: `/production` },
    { title: selectedYear.value, href: `/production` }
  ]);
  getAll(selectedYear.value);
  const roleNameSelection = localStorage.getItem('user');
  if (roleNameSelection) {
    try {
      const user = JSON.parse(roleNameSelection);
      selectedRoleId.value = user.roleId;
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
});
const createCompany = async () => {
  router.push({ name: 'AddCompanyProfile' });
};
</script>

<template>
  <div v-if="isCompanyVerified">
    <div class="d-sm-flex justify-space-between align-center mb-6 pt-5">
      <h3 class="text-h3 text-start mb-xs-2 mb-sm-0">{{ $t('production.head.productionPlan') }}</h3>

      <div class="d-flex flex-wrap" v-if="isCompanyProfile">
        <v-btn
          class="mb-2 mr-2"
          color="primary"
          elevation="2"
          v-if="production && productionProductList.length > 0"
          :loading="isLoading"
          :to="{ name: 'ProductionTaeStatus' }"
          >{{ t('import.button.viewTaeStatus') }}</v-btn
        >
        <v-btn
          class="mb-2 mr-2"
          elevation="2"
          min-width="40px"
          v-if="isCurrentYear() && !isApprovedProduct()"
          color="primary"
          @click="production && productionProductList.length > 0 ? editProduct() : addProduction()"
          >{{ production && productionProductList.length > 0 ? t('production.head.edit') : t('production.head.add') }}
          {{ t('production.head.production') }}</v-btn
        >
      </div>
    </div>
    <div class="d-flex justify-start align-start" v-if="isCompanyProfile">
      <v-select
        v-model="selectedYear"
        density="compact"
        max-width="200px"
        variant="outlined"
        color="primary"
        :label="$t('import.label.year')"
        :items="years"
        @update:modelValue="handleYearFilter"
      ></v-select>
    </div>
    <v-card>
      <v-data-table
        v-if="isCompanyProfile && production && productionProductList.length > 0"
        :headers="headers"
        :items="productionProductList"
        item-key="id"
        hide-default-footer
      >
        <!-- action column -->

        <template v-slot:item.productName="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
              <img v-if="item.actualImageUrl" :src="item.actualImageUrl" alt="Product Image" />
              <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
            </v-avatar>
            <span>{{ item.productName }}</span>
          </div>
        </template>
        <template v-slot:item.status="{ item }">
          <span class="d-flex text-capitalize" v-if="selectedRoleId === ROLE.VERIFIER">
            <!-- <v-btn color="success" size="small" class="mr-2">Approve</v-btn>
            <v-btn color="error" size="small">Reject</v-btn> -->
          </span>
          <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.status) }">
             {{ t(`status.${item.status}`) }}
            <!-- <span v-if="item.status.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
              <Popover position="below" id="status" :toolTipText="'Brand name is not correct'">
                <template v-slot:activator>
                  <InfoCircleOutlined />
                </template>
                <div>Internal article code is invalid</div>
              </Popover>
            </span> -->
          </span>
        </template>
        <template v-slot:item.planStatus="{ item }">
          <span class="text-capitalize" v-if="selectedRoleId === ROLE.VERIFIER">
            <!-- <v-btn color="success" size="small" class="mr-2">Approve</v-btn>
            <v-btn color="error" size="small">Reject</v-btn> -->
          </span>
          <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.planStatus) }">
            {{ t(`status.${item.planStatus}`) }}
            <span v-if="item.planStatus.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
              <Popover position="below" id="planStatus" :toolTipText="item.planStatusReason">
                <template v-slot:activator>
                  <InfoCircleOutlined />
                </template>
                <div>{{ item.planStatusReason }}</div>
              </Popover>
            </span>
          </span>
        </template>
        <template v-slot:item.actualsStatus="{ item }">
          <span class="text-capitalize" v-if="selectedRoleId === ROLE.VERIFIER">
            <v-btn color="success" size="small" class="mr-2">Approve</v-btn>
            <v-btn color="error" size="small">Reject</v-btn>
          </span>
          <span class="d-flex text-capitalize" v-else :style="{ color: getStatusColor(item.actualsStatus) }">
              {{ t(`status.${item.actualsStatus}`) }}
            <span v-if="item.actualsStatus.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
              <Popover position="below" id="actualsStatus" :toolTipText="item.actualsStatusReason">
                <template v-slot:activator>
                  <InfoCircleOutlined />
                </template>
                <div>{{ item.actualsStatusReason }}</div>
              </Popover>
            </span>
          </span>
        </template>
        <template v-slot:item.plan="{ item }">
          {{ formatNumberWithCommas(item.plan) }}
        </template>
        <template v-slot:item.actuals="{ item }">
          {{ formatNumberWithCommas(item.actuals) }}
        </template>
        <template v-slot:item.previousYearPlan="{ item }">
          {{ formatNumberWithCommas(item.previousYearPlan) }}
        </template>
      </v-data-table>
      <div class="d-flex align-center flex-column pa-10" v-else-if="!isCompanyProfile">
        <NoProfileCreateCompany
          :description="$t('company.other.noCompanyDetails')"
          :submitButtonText="$t('company.button.createCompany')"
          @submit="createCompany"
        ></NoProfileCreateCompany>
      </div>
      <div class="d-flex align-center flex-column pa-10" v-else>
        <div class="text-bold text-center">{{ $t('production.other.noProductionAdded') }}</div>
        <v-btn v-if="isCurrentYear()" color="primary" size="large" :loading="isLoading" class="mt-4" @click="addProduction">{{
          t('production.head.addProduction')
        }}</v-btn>
      </div>
    </v-card>
  </div>
  <div v-else>
    <h3 class="text-h3 text-start mb-xs-2 mb-sm-0 pb-5">{{ $t('production.head.productionPlan') }}</h3>
    <v-card class="pt-1">
      <v-list-item-title class="text-center py-8">{{ $t('production.other.notVerified') }}</v-list-item-title>
    </v-card>
  </div>
  <ConfirmationPopup
    v-model:show="confirmDialogData.show"
    :title="confirmDialogData.title"
    :message="confirmDialogData.message"
    :confirmButtonText="confirmDialogData.confirmButtonText"
    :cancelButtonText="confirmDialogData.cancelButtonText"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
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
  font-size: 36px; /* Adjust size to match avatar */
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
  margin: 0 4px; /* Adjust spacing between icons if needed */
}
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
