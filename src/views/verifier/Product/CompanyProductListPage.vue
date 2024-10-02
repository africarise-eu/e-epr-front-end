<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useFilterStore } from '@/stores/filter';
import type {DataTableHeader} from '@/composables/dataTableHeader';
import {formatDate} from '@/utils/date/dateFormat';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { OBJECTTYPE } from '@/composables/logObjectTypes';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ROLE } from '@/composables/role';
import Popover from '@/components/shared/Popover.vue';
import LogHistory from '@/components/shared/LogHistory.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import type productDto from '@/composables/product/product';

interface ApiResponse {
  count: number;
  rows: productResponseDto[];
}
interface productResponseDto {
  id: number;
  companyId: number;
  productName: string;
  productCategory: string;
  production: string;
  image: string | null;
  manufacturerCompany: string;
  countryOfManufacture: number;
  brandName: string;
  productModelTypeVolume: string;
  barcode: string;
  internalArticleCode: string;
  status: string;
  userId: number;
  rejectedReason: null | string;
  createdAt: string;
  updatedAt: string;
  Company: {
    companyName: string;
  };
}
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const productList = ref<productResponseDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const selectedStatuses = ref<string[]>([]);
const showHistory = ref(false);
const logId = ref(0);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user = JSON.parse(localStorage.getItem('user')!);
const isFromCompany = ref(false);
const selectedCompany = ref<number>();

const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.head.company'), key: 'Company.companyName' },
  { title: t('verifier.head.product'), key: 'productName' },
  { title: t('verifier.head.hsCode'), key: 'productCategory' },
  { title: t('verifier.head.date'), key: 'updatedAt' },
  { title: t('verifier.head.verificationStatus'), align: 'start', key: 'status', sortable: false },
  { title: 'Actions', align: 'start', key: 'actions', sortable: false }
]);

const statuses = ref<string[]>(['Approved', 'Rejected', 'Pending','Improved']);

const isApprovedProduct = (item: any) => {
  return item.status === 'approved';
};

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
const getAll = async (search: string, statuses: string[], limit: number, page: number, companyId?: number | null) => {
  try {
    const { useAPI } = useApi();
    const status = statuses.map((s) => s.toLowerCase());
    const payload = { search, status, limit, page, companyId };

    const result = await useAPI<ApiResponse>(VERIFIER.PRODUCT_LIST, 'GET', null, payload);
    if (result && result.data) {
      productCount.value = result.data.count;
      productList.value = [];
      const processedProducts = await Promise.all(
      result.data.rows.map(async (product: productResponseDto) => {
        let imageUrl = '';
        if (product.image) {
          const image = await useAPI(FILE.GET_FILE, 'GET', undefined, { path: product.image });
          if (!image.error) {
            imageUrl = (image.data ?? '') as string;
          }
        }
        return {
          ...product,
          image: imageUrl
        };
      })
    );

     productList.value = processedProducts;
    } else {
      productCount.value = 0;
      productList.value = [];
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetVerifierList'), error);
  }
};

const viewProductClick = (item: productResponseDto) => {
  if (isFromCompany.value) {
    router.push({ path: `/companies/${item.Company.companyName}/product/${item.id}` });
  } else {
    router.push({ path: `/verify/products/${item.id}` });
  }
};

const handleStatusFilter = () => {
  filterStore.setSelectedStatuses(selectedStatuses.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value); 
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
}, 1000);

const selectCompany = (selectedId?: number) => {
  const id = selectedId ? selectedId : selectedCompany.value;
  if (id === null) {
    currentPage.value = 1;
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, null);
  } else {
    filterStore.setSelectedCompany(id as number);
    let selected = companyDropdownList.value.find((item: companyListDropdownDto) => item.id === id);
    if (selected) {
      if (isFromCompany.value) {
        updateBreadcrumb?.([
          { title: '', href: '' },
          { title: 'Companies', href: '/companies' },
          { title: selected?.name ?? '', href: `/companies/${selectedCompany.value}` },
          { title: 'Products', href: `/companies/${selectedCompany.value}/product` }
        ]);
      }
      currentPage.value = 1;
      getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, id);
    }
  }
};
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
};

const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}
const updateBreadcrumb =  inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: 'Products', href: `/company/product` }
  ]);
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  await getCompanyList();
  if (route.params.companyId) {
    selectedCompany.value = Number(route.params.companyId);
    isFromCompany.value = true;
    selectCompany(selectedCompany.value);
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, Number(route.params.companyId));
  } else {
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, null);
  }
  const roleSelection = localStorage.getItem('user');
  if (roleSelection) {
    try {
      const user = JSON.parse(roleSelection);
      selectedRole.value = user.roleId;
      if (selectedRole.value !== ROLE.VERIFIER) {
        router.push({ name: 'Dashboard' });
      } else {
        isFromCompany.value = true;
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
});
// Watch the route for changes
watch(
  async () => route.params,
  async () => {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: t('verifier.head.products'), href: `/company/product` }
    ]);
    search.value = filterStore.search;
    selectedStatuses.value = filterStore.selectedStatuses;
    // if(selectedCompany.value ===undefined || selectedCompany.value ===0){
    //   getAll(search.value, itemsPerPage.value, currentPage.value, null);
    // }
    if (!route.params.companyId) {
      selectedCompany.value = undefined;
      getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, null);
    }
  }
);
</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('verifier.head.products') }}</h3>
    </div>
    <div class="d-flex justify-start align-start">
      <v-autocomplete
        v-model="selectedCompany"
        variant="outlined"
        max-width="300px"
        class="mr-2"
        color="primary"
        clearable
        :placeholder="$t('authentication.placeholder.company')"
        :items="companyDropdownList"
        item-value="id"
        item-title="name"
        @update:model-value="selectCompany()"
      ></v-autocomplete>
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
        :item-value="(item: string) => item"
        :item-title="(item: string) => $t(`status.${item.toLowerCase()}`)"
        @update:modelValue="handleStatusFilter"
      ></v-select>
    </div>
    <v-card class="pt-1">
      <v-card-text>
        <v-data-table :headers="headers" :items="productList" :no-data-text="'No pending products found'" item-key="id" hide-default-footer>
          <template v-slot:item.productName="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
                <img v-if="item.image" :src="item.image" alt="Product Image" />
                <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
              </v-avatar>
              <span>{{ item.productName }}</span>
            </div>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn class="text-capitalize" color="primary" @click="viewProductClick(item)">{{ $t('verifier.button.verify') }}</v-btn>
          </template>
            <template v-slot:item.updatedAt="{ item }">
                    <span v-if="item.updatedAt">{{ formatDate(new Date(item.updatedAt)) }}</span>
                    <span v-else>-</span>
            </template>
            <template v-slot:item.status="{ item }">
              <span class="d-flex text-capitalize" :style="{ color: getStatusColor(item.status ) }">
                              {{ t(`status.${item.status}`) }}
                    <v-tooltip>
                            <template #activator="{ props }">
                              <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                <div class="ml-2 icon">
                                   <InfoCircleOutlined @click="showLogHistory(item.id)"  />
                                </div>
                              </span>
                            </template>
                             <span> {{ t('logHistory.buttnText') }}</span>
                       </v-tooltip> 
              </span>
          </template>
        </v-data-table>
      </v-card-text>
      <!-- <v-card-text class="text-center" v-else>
        <span class="font-weight-bold">{{$t('verifier.error.selectCompany')}}</span>
      </v-card-text> -->
    </v-card>
    <v-pagination
      v-if="productCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(productCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
  <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.PRODUCT" />
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
