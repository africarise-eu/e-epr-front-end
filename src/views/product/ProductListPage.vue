<script setup lang="ts">
import { computed, onMounted, onUpdated, reactive, inject, ref, type Ref } from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { useApi } from '@/composables/useApi';
import { COMPANY, PRODUCT, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import type productDto from '@/composables/product/product';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import Popover from '@/components/shared/Popover.vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import {
  EditOutlined,
  EyeOutlined,
  PictureOutlined,
  SearchOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  CloseOutlined
} from '@ant-design/icons-vue';
import type { CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';

interface ApiResponse {
  count: number;
  rows: productDto[];
}
const router = useRouter();
const { t } = useI18n();
const products = ref<productDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const search = ref('');
const snackbarStore = useSnackbarStore();
const selectedStatuses = ref<string[]>([]);
const filterStore = useFilterStore();
const showFilterModal = ref(false);

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
const companiData=await fetchCompanyProfile(user.companyId);
const companyStatus = ref(companiData?.status);
if (companyStatus.value === undefined || companyStatus.value === null || companyStatus.value === '' || companyStatus.value === STATUSENUM.REJECTED) {
  isCompanyVerified.value=false;
}
isCompanyProfile.value = user.isProfileExist;



const headers = computed((): DataTableHeader[] => [
  { title: t('product.label.product'), key: 'productName' },
  { title: t('product.label.brandName'), key: 'brandName' },
  { title: t('product.label.production'), key: 'production' },
  { title: t('product.label.productCategory'), key: 'productCategory' },
  { title: t('product.label.status'), key: 'status', sortable: false },
  { title: t('product.label.packingMaterialsCount'), align: 'end', key: 'materialCount'  },
  { title: t('product.label.actions'), align: 'center', key: 'actions', sortable: false }
]);

const statuses = ref<string[]>(['Approved', 'Rejected', 'Pending','Improved']);

const isApprovedProduct = (item: any) => {
  return item.status === STATUSENUM.APPROVED;
};
function capitalizeFirstLetter(text: String | undefined) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
const getAll = async (search: string, statuses: string[], limit: number, page: number) => {
  try {
    const { useAPI } = useApi();
    const status = statuses.map((s) => s.toLowerCase());
    const payload = { search, status, limit, page };

    const result = await useAPI<ApiResponse>(PRODUCT.GETALL, 'GET', null, payload);
    if (result && result.data) {
      products.value = result.data.rows.map((item) => ({
        ...item,
        production: capitalizeFirstLetter(item.production)
      }));
      productCount.value = result.data.count;
    }
  } catch (error) {
    console.error('Failed to get products:', error);
  }
};

const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
}, 1000);

const handleStatusFilter = () => {
  filterStore.setSelectedStatuses(selectedStatuses.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const editProduct = (item: productDto) => {
  router.push({ name: 'UpdateProduct', params: { id: item.id.toString() } });
};

const deleteProduct = async (item: productDto) => {
  try {
    const { useAPI } = useApi();
    const result = await useAPI<productDto>(`${PRODUCT.DELETE}/${item.id}`, 'DELETE');
    snackbarStore.showMessage(result.message, 'success');
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
  } catch (error) {
    console.error('Failed to get products:', error);
  }
};

const viewProduct = (item: productDto) => {
  router.push({ name: 'ViewProduct', params: { id: item.id.toString() } });
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('product.head.productList'), href: '' }
  ]);
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
});

const createCompany = async () => {
  router.push({ name: 'AddCompanyProfile' });
};
</script>

<template>
  <v-container class="">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('product.head.productList') }}</h3>
      <v-btn class="mt-5 mr-2 text-capitalize" color="primary" v-if="isCompanyProfile && isCompanyVerified" :to="{ name: 'AddProduct' }">{{
        $t('product.button.addProduct')
      }}</v-btn>
    </div>
    <div class="d-flex justify-start align-start" v-if="isCompanyProfile && isCompanyVerified">
      <v-text-field variant="outlined" v-model="search" @input="handleSearchFilter()" :label="$t('product.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
      <v-select
        v-model="selectedStatuses"
        density="compact"
        max-width="371px"
        class="ml-4"
        variant="outlined"
        color="primary"
        multiple
        chips
        clearable
        closable-chips
        :label="$t('product.label.status')"
        :items="statuses"
        @update:modelValue="handleStatusFilter"
      ></v-select>
    </div>
    <v-card class="pt-1">
      <v-card-text v-if="isCompanyProfile && isCompanyVerified">
        <v-data-table :headers="headers" :items="products" item-key="id" hide-default-footer>
          
          <!-- action column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-icons">
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                    <div :class="{ 'icon-container': true, 'center-icon': isApprovedProduct(item) }">
                      <EyeOutlined @click="viewProduct(item)" class="icon px-3"></EyeOutlined>
                    </div>
                  </span>
                </template>
                <span>{{t('common.view')}}</span>
              </v-tooltip>
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                    <EditOutlined @click="editProduct(item)" v-if="!isApprovedProduct(item)" class="icon px-3"></EditOutlined>
                  </span>
                </template>
                <span>{{t('common.edit')}}</span>
              </v-tooltip>
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                    <CloseOutlined @click="deleteProduct(item)" v-if="!isApprovedProduct(item)" class="icon px-3"></CloseOutlined>
                  </span>
                </template>
                <span>{{t('common.delete')}}</span>
              </v-tooltip>
            </div>
          </template>
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
            <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status) }">
              {{ t(`status.${item.status}`) }}
              <span v-if="item.status.toLowerCase() === 'rejected'" class="ml-2">
              <Popover  position="below" :key="item.id" :id="`status-${item.id}`" >
                  <template v-slot:activator>
                    <InfoCircleOutlined />
                  </template>
                  <div>{{ item.rejectedReason }}</div>
                </Popover>
              </span>
            </span>
          </template>
        </v-data-table>
      </v-card-text>
      <div class="d-flex align-center flex-column pa-10" v-else-if="!isCompanyProfile">
        <NoProfileCreateCompany
          :description="$t('company.other.noCompanyDetails')"
          :submitButtonText="$t('company.button.createCompany')"
          @submit="createCompany"
        ></NoProfileCreateCompany>
      </div>

      <v-list-item-title v-else-if="!isCompanyVerified" class="text-center py-8">{{ $t('product.other.notVerified') }}</v-list-item-title>
    </v-card>
    <v-pagination
      v-if="isCompanyProfile && isCompanyVerified && productCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(productCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
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

/* Default icon color */
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
.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
