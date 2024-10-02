<script setup lang="ts">
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { ref, onMounted, computed, reactive, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { ROLE } from '@/composables/role';
import { useRoute, useRouter } from 'vue-router';
import { COMPENSATION, VERIFIER } from '@/composables/apiEndpoints';
import { useApi } from '@/composables/useApi';
import { useSnackbarStore } from '@/stores/snackbar';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { formatDate } from '@/utils/date/dateFormat';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { InfoCircleOutlined } from '@ant-design/icons-vue';
import Popover from '@/components/shared/Popover.vue';
import RejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import type endDestinationDto from '@/composables/compensation/endDestination';
import LogHistory from '@/components/shared/LogHistory.vue';
import { OBJECTTYPE } from '@/composables/logObjectTypes';

const { t } = useI18n();
const route = useRoute();
const snackbarStore = useSnackbarStore();
const router = useRouter();
const endDestinationId = ref(route.params.id as string);
const selectedRoleId = ref<number>(0);
const showStatusReason = ref(false);
const endDestination = reactive<endDestinationDto>({
  id: 0,
  orgName: '',
  orgType: null,
  companyRegNo: '',
  companyId: 0,
  companyName: '',
  phone: '',
  email: '',
  contactPerson: '',
  address: '',
  cityName: '',
  city: null,
  countryName: '',
  country: 1,
  status: '',
  rejectedReason: '',
  createdAt: ''
});
const showHistory = ref(false);
const logId = ref(0);

const fetchById = async () => {
  try {
    const { useAPI } = useApi();
    const result = await useAPI<endDestinationDto>(`${COMPENSATION.GET_BY_ID_ENDDESTINATIONS}/${endDestinationId.value}`, 'GET');
    if (!result.error) {
      Object.assign(endDestination, mapApiResponseToEndDestinationDto(result.data));
    } else {
      console.log('error when fetching end destination');
      router.push({ name: 'EndDestinations' });
    }
  } catch (error) {
    console.error('error when fetching end destination', error);
  }
};

const mapApiResponseToEndDestinationDto = (response: any): endDestinationDto => {
  return {
    id: response.id ?? 0,
    orgName: response.orgName ?? '',
    orgType: response.orgType ?? null,
    companyRegNo: response.companyRegNo ?? '',
    companyId: response.companyId ?? 0,
    companyName: response.companyName ?? '',
    phone: response.phone ?? '',
    email: response.email ?? '',
    contactPerson: response.contactPerson ?? '',
    address: response.address ?? '',
    cityName: response.cityName ?? '',
    city: response.cityId ?? null,
    countryName: response.countryName ?? '',
    country: response.countryId ?? 1,
    status: response.status ?? '',
    rejectedReason: response.rejectedReason ?? '',
    createdAt: response.createdAt ?? ''
  };
};

const formattedCompensationData = computed(() => {
  return {
    createdAt: { label: t('endDestination.label.createdAt'), value: formatDate(new Date(endDestination.createdAt)) },
    orgName: { label: t('endDestination.label.orgName'), value: endDestination.orgName },
    orgType: { label: t('endDestination.label.orgType'), value: endDestination.orgType },
    companyRegNo: { label: t('endDestination.label.companyRegNo'), value: endDestination.companyRegNo },
    phone: { label: t('endDestination.label.phone'), value: endDestination.phone },
    email: { label: t('endDestination.label.email'), value: endDestination.email },
    contactPerson: { label: t('endDestination.label.contactPerson'), value: endDestination.contactPerson },
    address: { label: t('endDestination.label.address'), value: endDestination.address },
    cityName: { label: t('endDestination.label.city'), value: endDestination.cityName },
    countryName: { label: t('endDestination.label.country'), value: endDestination.countryName },
    status: { label: t('endDestination.label.status'), value: endDestination.status }
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
  showStatusReason.value = !showStatusReason.value;
  let payload = {
    status,
    rejectedReason,
    id: endDestination.id
  };
  const { useAPI } = useApi();
  const result = await useAPI(VERIFIER.END_DESTINATION_UPDATE, 'PATCH', payload);
  if (!result.error) {
    snackbarStore.showMessage(t('verifier.success.statusChanged'), 'success');
    router.push({ name: 'VerifyEndDestinationList' });
  }
};
const showLogHistory = (productId: number) => {
  showHistory.value = !showHistory.value;
  logId.value = productId;
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
      { title: t('endDestination.head.list'), href: '/verify/end-destination' },
      { title: t('compensationRequest.head.view'), href: '' }
    ]);
  } else {
    updateBreadcrumb?.([
      { title: '', href: '' },
      { title: t('endDestination.head.list'), href: '/end-destinations' },
      { title: t('endDestination.head.view'), href: '' }
    ]);
  }
};
const navigateBack = () => {
  const targetRoute = isVerifier.value ? '/verify/end_destination' : '/end-destinations';
  router.push(targetRoute);
};
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('endDestination.head.list'), href: '/end-destinations' },
    { title: t('endDestination.head.view'), href: '' }
  ]);
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
});
</script>

<template>
  <div class="d-flex justify-space-between align-center mb-6 pt-5">
    <h3 class="text-h3 text-center mb-0">{{ $t('endDestination.head.view') }}</h3>
    <div class="d-flex">
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
      <v-btn
        v-else-if="endDestination.status !== STATUSENUM.APPROVED && !isVerifier"
        class="mr-2 text-capitalize"
        style="background-color: #2196F3;color: white; border-color: #2196F3;height: 30px;"
        :to="{ name: 'UpdateEndDestination', query: { id: endDestination.id } }"
        >{{ $t('endDestination.button.update') }}</v-btn
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
                      v-if="value.label && value.label === t('endDestination.label.status')"
                      class="d-flex text-capitalize"
                      :style="{ color: getStatusColor(value.value?.toString() ?? '') }"
                      > {{ t(`status.${value.value?? 'Nil'}`) }}

                      <!-- <span v-if="value.value?.toString().toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
                        <Popover position="below" id="item">
                          <template v-slot:activator>
                            <InfoCircleOutlined />
                          </template>
                          <div>{{ endDestination.rejectedReason }}</div>
                        </Popover>
                      </span> -->
                      <span v-if="value.value?.toString().toLowerCase() === STATUSENUM.REJECTED || isVerifier" class="ml-2">
                      <v-tooltip>
                        <template #activator="{ props }">
                          <span v-bind="props" style="cursor: pointer; text-decoration: underline">
                            <div class="ml-2 icon">
                              <InfoCircleOutlined @click="showLogHistory(endDestinationId?Number(endDestinationId):0)" />
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
    </v-card-text>
  </v-card>
  <ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')">
    <RejectReasonForm @submit="submitRejectReason" />
  </ModalPopup>
  <ModalPopup v-model="showHistory" max-width="60%" :title="$t('logHistory.title')">
    <LogHistory :id="logId" :objectTypeId="OBJECTTYPE.END_DESTINATION" />
  </ModalPopup>
</template>
