<script setup lang="ts">
import type importShipmentDto from '@/composables/imports/importShipment';
import ProductForm from '@/components/product/productForm.vue';
import { reactive, onMounted, defineProps, ref, inject, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import { IMPORT, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRoute, useRouter } from 'vue-router';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { useImportShipment } from '@/composables/imports/useImportShipment';
import { formatDate } from '@/utils/date/dateFormat';
import Popover from '@/components/shared/Popover.vue';
import { ROLE } from '@/composables/role';
import { STATUSENUM, getStatusColor } from '@/composables/status';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { PictureOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { useSnackbarStore } from '@/stores/snackbar';
import ImportRejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import { blue } from 'vuetify/util/colors';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

const snackbarStore = useSnackbarStore();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const selectedRoleId = ref<number>(0);
const importId = ref(route.params.id as string);
const { importDetails } = useImportShipment(importId.value);
const showStatusReason = ref(false);
const headers = computed((): DataTableHeader[] => [
  { title: t('import.label.product'), align: 'start', key: 'productName', sortable: false },
  { title: t('import.label.internalArticleCode'), key: 'internalArticleCode' },
  { title: t('import.label.units'), align: 'start', sortable: false, key: 'units' },
  { title: t('import.label.taeTotalValue'), align: 'start', key: 'taeTotalValue', sortable: false }
]);

const showHistory = ref(false);
const logId = ref(0);

const formattedImportData = computed(() => {
  return {
    cdNo: { label: t('import.label.cdNo'), value: importDetails.cdNo },
    etaDate: { label: t('import.label.etaDate'), value: formatDate(new Date(importDetails.etaDate)) },
    arrivalPort: { label: t('import.label.arrivalPort'), value: importDetails.arrivalPorts.portname },
    countryId: { label: t('import.label.countryId'), value: importDetails.countries.name },
    fromPort: { label: t('import.label.fromPort'), value: importDetails.fromPort },
    status: { label: t('import.label.status'), value: importDetails.status },
    payStatus: { label: t('import.label.payStatus'), value: importDetails.payStatus }
  };
});

const totalTAE_Value = computed(() => {
  const sum = importDetails.products.reduce((sum, item) => sum + item.taeTotalValue, 0);
  return parseFloat(sum.toFixed(2));
});

const isVerifier = computed(() => {
  return selectedRoleId.value === ROLE.VERIFIER;
});

const submitRejectReason = async (value: { reason: string }) => {
  if (value.reason) {
    showStatusReason.value = !showStatusReason.value;
    submitChangeStatus(STATUSENUM.REJECTED, value.reason);
  }
};
const showLogHistory = (productId: number)=>{
    showHistory.value = !showHistory.value;
    logId.value = productId;
}
const submitChangeStatus = async (status: string, rejectedReason?: string) => {
  let payload = {
    status,
    rejectedReason,
    id: importDetails.id
  };
 
  const { useAPI } = useApi();
  const result = await useAPI(VERIFIER.IMPORTS, 'PATCH', payload);
  if (!result.error) {
    snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
    router.push({ name: 'VerifyImportShipmentList' });
  }
};
const changeStatus = async (status: string) => {
  showStatusReason.value = false;
  switch (status) {
    case STATUSENUM.APPROVED:
      submitChangeStatus(status);
      break;
    case STATUSENUM.REJECTED:
      showStatusReason.value = !showStatusReason.value;
      break;
    default:
      break;
  }
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
const setBreadCrumb = () => {
  if (isVerifier.value) {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: t('verifier.head.imports'), href: '/verify/imports' },
      { title: t('import.head.view'), href: '' }
    ]);
  } else {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: t('import.head.list'), href: '/imports' },
      { title: t('import.head.view'), href: '' }
    ]);
  }
};

onMounted(() => {
  const roleNameSelection = localStorage.getItem('user');
  if (roleNameSelection) {
    try {
      const user = JSON.parse(roleNameSelection);
      selectedRoleId.value = user.roleId;
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
  setBreadCrumb();
});
const navigateBack = () => {
  const targetRoute = isVerifier.value ? '/verify/imports' : '/imports';
  router.push(targetRoute);
};
</script>

<template>
  <div class="d-flex justify-space-between align-center mb-6 pt-5">
    <h3 class="text-h3 text-center mb-0">{{ $t('import.head.view') }}</h3>
    <div class="d-flex">
      <v-btn
        class="mr-2 text-capitalize"
        variant="outlined"
        @click="navigateBack"
      >
        {{ $t('common.back') }}</v-btn
      >
      <div v-if ="importDetails.status !== STATUSENUM.APPROVED && importDetails.status !== STATUSENUM.REJECTED && isVerifier" >
       <v-btn v-if="isVerifier" class="mr-2" color="success"  @click="changeStatus(STATUSENUM.APPROVED)">{{ t('verifier.button.approve') }}</v-btn>
       <v-btn v-if="isVerifier" color="error" @click="changeStatus(STATUSENUM.REJECTED)">{{ t('verifier.button.reject') }}</v-btn>
    </div>
      <v-btn
        v-if ="importDetails.status !== STATUSENUM.APPROVED && importDetails.status !== STATUSENUM.REJECTED && !isVerifier"
        class="mr-2 text-capitalize"
        color="primary"
        :to="{ name: 'UpdateImportShipment', query: { id: importDetails.id } }"
        >{{ $t('import.button.update') }}</v-btn
      >
    </div>
  </div>
  <v-card class="pt-1">
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-list>
            <v-list-item class="d-grid" v-for="(value, key) in formattedImportData" :key="key">
              <v-row>
                <v-col cols="4">
                  <v-list-item-content>
                    <v-list-item-title class="font-weight-bold">{{ value.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
                <v-col cols="8">
                  <v-list-item-content class="align-end">
                    <v-list-item-title
                      v-if="value.label === t('import.label.status')"
                      class="d-flex text-capitalize"
                      :style="{ color: getStatusColor(value.value.toString()) }"
                      >{{ t(`status.${value.value}`) }}
                      <span v-if="value.value?.toLowerCase() === STATUSENUM.REJECTED.toLowerCase() && !isVerifier" class="ml-2">
                        <Popover position="below" id="item" :toolTipText="'Brand name is not correct'">
                          <template v-slot:activator>
                            <InfoCircleOutlined />
                          </template>
                          <div>{{ importDetails.rejectedReason }}</div>
                        </Popover>
                      </span>
                      <span v-if="value.value?.toString().toLowerCase() === STATUSENUM.REJECTED.toLowerCase() && isVerifier" class="ml-2">
                      <v-tooltip>
                            <template #activator="{ props }">
                              <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                                <div class="ml-2 icon">
                                   <InfoCircleOutlined @click="showLogHistory(importId ? Number(importId) : 0)" />
                                </div>
                              </span>
                            </template>
                             <span> {{ t('logHistory.buttnText') }}</span>
                       </v-tooltip> 
                      </span>
                    </v-list-item-title>
                    <v-list-item-title
                      v-else-if="value.label === t('import.label.payStatus')"
                      class="text-capitalize"
                      :style="{ color: getStatusColor(value.value.toString()) }"
                      >{{ value.value }}
                      </v-list-item-title
                    >
                    <v-list-item-title v-else class="text-capitalize">{{ value.value }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-col> </v-row
      ><br /><br />
      <v-row>
        <v-col>
          <h4 class="font-weight-bold">{{ t('import.head.productDetails') }}</h4>
          <v-data-table :headers="headers" :items="importDetails.products" density="compact" item-key="id" hide-default-footer>
            <template v-slot:item.productName="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="36" class="square-avatar icon-avatar-size mr-4">
                  <img v-if="item.image" :src="item.image" alt="Product Image" />
                  <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
                </v-avatar>
                <span>{{ item.productName }}</span>
              </div>
            </template>
            <!-- Custom Summary Row -->
            <template v-if="importDetails.products.length > 0" v-slot:body.append>
              <tr>
                <td></td>
                <td></td>
                <td class="text-right font-weight-bold">{{ t('common.label.totaltae') }}</td>
                <td class="text-left font-weight-bold">{{ totalTAE_Value }}</td>
                <!-- Add other summary cells as needed -->
              </tr>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')">
    <ImportRejectReasonForm @submit="submitRejectReason" />
  </ModalPopup>
  <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.IMPORT" />
  </ModalPopup>
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
