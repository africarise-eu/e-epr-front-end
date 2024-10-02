<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE, PRODUCT, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { debounce } from 'lodash';
import { useSnackbarStore } from '@/stores/snackbar';
import { useRoute, useRouter } from 'vue-router';
import { useFilterStore } from '@/stores/filter';
import {formatDate} from '@/utils/date/dateFormat';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { ROLE } from '@/composables/role';
import type { companyListDropdownDto, companyListResponseDto } from '@/views/authentication/authForms/AuthRegister.vue';
import type productDto from '@/composables/product/product';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { green, red } from 'vuetify/util/colors';
import { STATUSENUM } from '@/composables/status';
import { getStatusColor } from '@/composables/status';
import { formatNumberWithCommas } from '@/utils/commonMethods';

interface ApiResponse {
  count: number;
  rows: productionResponseDto[];
}

interface productionResponseDto {
  id: number;
  companyId: number;
  companyName: string;
  productCount: string;
  planYear: string;
  createdAt: string;
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const productList = ref<productionResponseDto[]>([]);
const productCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = ref(10);
const selectedRole = ref<number>(0);
const search = ref('');
const snackbarStore = useSnackbarStore();
const filterStore = useFilterStore();
const user = JSON.parse(localStorage.getItem('user')!);
const isFromCompany = ref(false);
const selectedCompany = ref<number>();
const selectedCompanyText = ref<string>();
const selectedStatuses = ref<string[]>([]);

const headers = computed((): DataTableHeader[] => [
  { title: t('verifier.table.companyName'), key: 'companyName' },
  { title: t('verifier.table.productCount'), key: 'productCount',align: 'end' },
  { title: t('verifier.table.planYear'), key: 'planYear' },
  { title: t('verifier.table.createdAt'), key: 'createdAt' },
  { title: t('verifier.table.actions'), align: 'start', key: 'actions', sortable: false }
]);

const statuses = ref<string[]>(['Approved', 'Rejected', 'Pending','Improved']);

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

const getAll = async (search: string, statuses: string[], limit: number, page: number, companyId?: number) => {
  try {
    const { useAPI } = useApi();
     const status = statuses.map((s) => s.toLowerCase());
     const payload = { search, status, limit, page, companyId };
    const result = await useAPI<ApiResponse>(VERIFIER.ALL_PRODUCTION, 'GET', null, payload);
    const selectedCompanyText = companyDropdownList.value.find((company) => company.id === companyId)?.name;
    if (result && result.data) {
      updateBreadcrumb?.([
        { title: '', href: '' },
        { title: t('verifier.head.productionPlans'), href: `/verify/production` },
        { title: selectedCompanyText ?? '', href: `/verify/production/${companyId}` }
      ]);
      productList.value = [];
      result.data.rows.map(async (product: any) => {
        productList.value.push({
          id : product.id,
          companyId: product.id,
          companyName: product.companyName,
          productCount: product.Productions[0].productCount,
          planYear: product.Productions[0].planYear,
          createdAt: product.Productions[0].createdAt
        });
      });
      productCount.value = result.data.count;
    } else {
      productCount.value = 0;
      productList.value = [];
    }
  } catch (error) {
    console.error(t('verifier.error.failedToGetproduction list'), error);
  }
};

const verifyProductClick = async (item: productionResponseDto) => {
   router.push({ name: 'VerifyProductionPlanList', params: { companyId: item.companyId.toString() }});
};


const handleSearchFilter = debounce(() => {
  filterStore.setSearch(search.value);
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
}, 1000);

const handleStatusFilter = () => {
  filterStore.setSelectedStatuses(selectedStatuses.value);  
  currentPage.value = 1;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value);
};

const selectCompany = (selectedId?: number) => {
  const id = selectedId ? selectedId : selectedCompany.value;
  let selected = companyDropdownList.value.find((item: companyListDropdownDto) => item.id === id);
  currentPage.value = 1;
  if (selected) {
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, id);
  }
  else{
    getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('verifier.head.productionPlans'), href: `/verify/production` }
  ]);
  search.value = filterStore.search;
  selectedStatuses.value = filterStore.selectedStatuses;
  await getCompanyList();
  if (route.params.companyId) {
    selectedCompany.value = Number(route.params.companyId);
    isFromCompany.value = true;
    selectCompany(selectedCompany.value);
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
   getAll(search.value, selectedStatuses.value, itemsPerPage.value, currentPage.value, selectedCompany.value);
});

watch(
  async () => route.params,
  async () => {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: t('verifier.head.productionPlans'), href: `/verify/production` }
    ]);
    search.value = filterStore.search;
    selectedStatuses.value = filterStore.selectedStatuses;
    if (route.params.companyId) {
      selectedCompany.value = Number(route.params.companyId);
      isFromCompany.value = true;
      selectCompany(selectedCompany.value);
    } else {
      selectedCompany.value = undefined;
      isFromCompany.value = false;
    }
  }
);
function capitalizeFirstLetter(text: String | undefined) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
</script>

<template>
  <v-container class="pa-0">
    <div class="d-flex justify-space-between align-center mb-6">
      <h3 class="text-h3 text-center mb-0">{{ $t('verifier.head.productionPlan') }}</h3>
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
      <!-- <v-text-field
        variant="outlined"
        v-model="search"
        @input="handleSearchFilter()"
        :label="$t('verifier.label.search')"
        max-width="300px"
      >
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field> -->
          <!-- <v-select
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
      ></v-select> -->
    </div>
    <v-card class="pt-1">
      <v-card-text >
        <v-data-table :headers="headers" :items="productList" item-key="id" hide-default-footer :Style="{ 'width': '100%' }">
          <template v-slot:item.actions="{ item }">
            <v-btn class="text-capitalize" color="primary" @click="verifyProductClick(item)">{{ $t('verifier.button.verify') }}</v-btn>
          </template>
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(new Date(item.createdAt)) }}
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

.v-table {
  ::v-deep .v-table__wrapper table tbody tr td {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
}
</style>
