<script setup lang="ts">
import type compensationRequestDto from '@/composables/compensation/compensationRequest';
import type compensationDocumentDto from '@/composables/compensation/compensationDocument';
import { reactive, onMounted, defineProps, ref, computed, inject } from 'vue';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { useApi } from '@/composables/useApi';
import { COMPENSATION, VERIFIER } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { DefaultTheme } from '@/theme/LightTheme';
import { useRoute, useRouter } from 'vue-router';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { useImportShipment } from '@/composables/imports/useImportShipment';
import { formatDate } from '@/utils/date/dateFormat';
import Popover from '@/components/shared/Popover.vue';
import { STATUSENUM } from '@/composables/status';
import { ROLE } from '@/composables/role';
import { getStatusColor } from '@/composables/status';
import { PictureOutlined, InfoCircleOutlined, FilePdfOutlined } from '@ant-design/icons-vue';
import { mapApiResponseToCompensationRequestDto, initializedCompensationRequest } from '@/composables/compensation/compensationRequest';
import { useSnackbarStore } from '@/stores/snackbar';
import RejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import { formatNumberWithCommas } from '@/utils/commonMethods';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

const snackbarStore = useSnackbarStore();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const selectedRoleId = ref<number>(0);
const compensationId = ref(route.params.id as string);
const showStatusReason = ref(false);
const compensationRequest = reactive({
  id: 0,
  requestedDate: '',
  deliveryToEdDate: '',
  materialId: null,
  material: '',
  deliveredKgs: 0,
  edOrganisationId: null,
  edOrganisation: '',
  edType: '',
  status: '',
  edOrgStatus: '',
  rejectedReason: '',
  documents: []
});
const showHistory = ref(false);
const logId = ref(0);

const fetchById = async () => {
  try {
    const { useAPI } = useApi();
    const result = await useAPI<compensationRequestDto>(`${COMPENSATION.GETBYID}/${compensationId.value}`, 'GET');
    if (!result.error) {
      Object.assign(compensationRequest, mapApiResponseToCompensationRequestDto(result.data));
    } else {
      snackbarStore.showMessage(result.message, 'error');
      router.push({ name: 'CompensationList' });
    }
  } catch (error) {
    console.error('Failed when getting compensation by id', error);
  }
};

const headers: DataTableHeader[] = [
  { title: 'Document', align: 'start', sortable: false, key: 'documentUrl' },
  { title: 'Description', align: 'start', key: 'description', sortable: false }
];
const showLogHistory = (productId: number) => {
  showHistory.value = !showHistory.value;
  logId.value = productId;
};
const formattedCompensationData = computed(() => {
  return {
    deliveryToEdDate: {
      label: t('compensationRequest.label.deliveryToEdDate'),
      value: formatDate(new Date(compensationRequest.deliveryToEdDate))
    },
    material: { label: t('compensationRequest.label.material'), value:t(`common.packagingMaterial.${compensationRequest.material}`)  },
    deliveredKgs: { label: t('compensationRequest.label.deliveredKgs'), value: compensationRequest.deliveredKgs },
    edOrganisation: { label: t('compensationRequest.label.edOrganisation'), value: compensationRequest.edOrganisation },
    edType: { label: t('compensationRequest.label.edType'), value: compensationRequest.edType },
    status: { label: t('compensationRequest.label.status'), value: compensationRequest.status }
  };
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

const submitChangeStatus = async (status: string, rejectedReason?: string) => {
  showStatusReason.value = false;
  let payload = {
    status,
    rejectedReason,
    id: compensationRequest.id
  };
  const { useAPI } = useApi();
  const result = await useAPI(VERIFIER.COMPENSATION_VERIFY, 'PATCH', payload);
  if (!result.error) {
    snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
    router.push({ name: 'VerifyCompensationList' });
  }
};

const changeStatus = async (status: string) => {
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
      { title: t('verifier.head.compensation'), href: '/verify/compensation' },
      { title: t('compensationRequest.head.view'), href: '' }
    ]);
  } else {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: t('compensationRequest.head.compensation'), href: '/compensations' },
      { title: t('compensationRequest.head.list'), href: '/compensation/requests' },
      { title: t('compensationRequest.head.view'), href: '' }
    ]);
  }
};
onMounted(() => {
  fetchById();
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
  const targetRoute = isVerifier.value ? '/verify/compensation' : '/compensation/requests';
  router.push(targetRoute);
};
</script>

<template>
  <div class="d-flex justify-space-between align-center mb-6 pt-5">
    <h3 class="text-h3 text-center mb-0">{{ $t('compensationRequest.head.view') }}</h3>
    <div>
      <a-button
        class="mr-2 text-capitalize"
        variant="outlined"
        :style="{ backgroundColor: 'white', color: 'black', borderColor: 'black' }"
        @click="navigateBack"
      >
        {{ $t('common.back') }}</a-button
      >
      <a-button
        v-if="isVerifier"
        :style="{ backgroundColor: '#28a745', color: 'white', borderColor: '#28a745' }"
        @click="changeStatus(STATUSENUM.APPROVED)"
        >{{ t('verifier.button.approve') }}</a-button
      >
      <a-button
        v-if="isVerifier"
        :style="{ backgroundColor: '#dc3545', color: 'white', borderColor: '#dc3545', marginLeft: '5px' }"
        @click="changeStatus(STATUSENUM.REJECTED)"
        >{{ t('verifier.button.reject') }}</a-button
      >
    </div>
  </div>
  <v-card class="pt-1">
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-list>
            <v-list-item class="d-grid" v-for="(value, key) in formattedCompensationData" :key="key">
              <v-row>
                <v-col cols="4">
                  <v-list-item-content>
                    <v-list-item-title class="font-weight-bold">{{ value.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
                <v-col cols="8">
                  <v-list-item-content class="align-end">
                    <v-list-item-title
                      v-if="value.label === t('compensationRequest.label.status')"
                      class="d-flex text-capitalize"
                      :style="{ color: getStatusColor(value.value.toString()) }"
                      >{{ t(`status.${value.value}`) }}
                      <span v-if="value.value?.toString().toLowerCase() === STATUSENUM.REJECTED || isVerifier" class="ml-2">
                        <v-tooltip>
                          <template #activator="{ props }">
                            <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                              <div class="ml-2 icon">
                                <InfoCircleOutlined @click="showLogHistory(Number(compensationId))" />
                              </div>
                            </span>
                          </template>
                          <span> {{ t('logHistory.buttnText') }}</span>
                        </v-tooltip>
                      </span>
                    </v-list-item-title>
                    <v-list-item-title v-else class="text-capitalize">{{ value.value }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-col> </v-row
      ><br /><br />
      <v-row>
        <v-col cols="8" sm="12" md="8">
          <h4 class="font-weight-bold">{{ t('compensationRequest.head.documents') }}</h4>
          <v-data-table
            class="pa-4"
            :headers="headers"
            :items="compensationRequest.documents"
            density="compact"
            item-key="id"
            hide-default-footer
          >
            <template v-slot:item.documentUrl="{ item }">
              <v-avatar size="36" class="square-avatar icon-avatar-size mr-4 mt-2">
                <!-- <iframe
                  v-if="(item as compensationDocumentDto).documentName.endsWith('.pdf')"
                  :src="(item as compensationDocumentDto).documentUrl"
                  frameborder="0"
                  style="width: 100%"
                ></iframe> -->
                <FilePdfOutlined v-if="(item as compensationDocumentDto).documentName.endsWith('.pdf')" />
                <img
                  v-else-if="(item as compensationDocumentDto).documentUrl"
                  :src="(item as compensationDocumentDto).documentUrl"
                  alt="compensation document"
                />
                <PictureOutlined v-else class="icon-avatar-size"> </PictureOutlined>
              </v-avatar>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')">
    <RejectReasonForm @submit="submitRejectReason" />
  </ModalPopup>
  <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.COMPENSATION" />
  </ModalPopup>
</template>
<style scoped>
.font-weight-black {
  font-weight: 900;
}
.square-avatar {
  border-radius: 0;
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

.icon-size {
  font-size: 300px;
  width: 400px; /* Set the width to match v-img max-width */
  height: 400px; /* Set the height to match v-img max-height */
}
</style>
