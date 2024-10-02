<script setup lang="ts">
import { onMounted, computed, ref, type Ref, inject } from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import {
  type cityListResponseDto,
  type CompanyProfileFormProps,
  type CompanyProfileResponseProps
} from '@/components/company/CompanyProfileForm.vue';
import { useApi } from '@/composables/useApi';
import { COMPANY, FILE } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import Popover from '@/components/shared/Popover.vue';
import { InfoCircleOutlined, PictureOutlined } from '@ant-design/icons-vue';
import { DefaultTheme } from '@/theme/LightTheme';
import { getStatusColor, Status, STATUSENUM } from '@/composables/status';
import RejectReasonForm from '@/components/shared/RejectReasonForm.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { ROLE } from '@/composables/role';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';

export interface CompanyDetailDto {
  companyName: string;
  logo: File | string;
  type: string[];
  registrationNumber: string;
  activityCode?: string;
  address: string;
  city: cityListResponseDto;
  country: cityListResponseDto;
  companyPhoneNumber: string;
  website: string;
  bankAccount: string;
  isImageUpload: boolean;
  imagePath: string;
  rejectedReason: string;
}

const router = useRouter();
const isSubmitting = ref(false);
const { t } = useI18n();
const isCompanyAdded = ref(false);
const companyVerifiedStatus = ref('');
const imageUrl: Ref<string> = ref(avatar);
const user = JSON.parse(localStorage.getItem('user')!);
const regForm: Ref<CompanyDetailDto> = ref({
  companyName: '',
  type: [],
  registrationNumber: '',
  activityCode: '',
  address: '',
  city: { id: 0, name: '' },
  country: { id: 1, name: 'Mozambique' },
  companyPhoneNumber: '',
  website: '',
  bankAccount: '',
  isImageUpload: false,
  imagePath: '',
  logo: '',
  rejectedReason: ''
});
const fetchCompanyProfile = async () => {
  isSubmitting.value = true;
  try {
    const { useAPI } = useApi();
    const result = await useAPI<CompanyProfileResponseProps>(COMPANY.COMPANY_PROFILE, 'GET');
    isSubmitting.value = false;
    if (!result.error) {
      if (result.data) {
        const user = localStorage.getItem('user');
        let userJson = JSON.parse(user!);
        userJson.isProfileExist = true;
        userJson.isProfileVerified = result.data.status === STATUSENUM.APPROVED;
        localStorage.setItem('user', JSON.stringify(userJson));
        companyVerifiedStatus.value = result.data.status;
        isCompanyAdded.value = true;
        regForm.value.companyName = result.data.companyName ?? '';
        regForm.value.registrationNumber = result.data.registrationNumber ?? '';
        regForm.value.activityCode = result.data.activityCode ?? 0;
        regForm.value.address = result.data.address ?? '';
        regForm.value.city = result.data.cities ?? { id: 0, name: '' };
        regForm.value.companyPhoneNumber = result.data.phoneNumber ?? '';
        regForm.value.website = result.data.website ?? '';
        regForm.value.bankAccount = result.data.bankAccount ?? '';
        regForm.value.rejectedReason = result.data.rejectedReason ?? '';
        regForm.value.type = [];
        result.data.isImporter ? regForm.value.type.push('Importer') : null;
        result.data.isProducer ? regForm.value.type.push('Producer') : null;
        if (result.data.logo) {
          const image = await useAPI(FILE.GET_FILE, 'GET', undefined, { path: result.data.logo });
          if (!image.error) {
            regForm.value.logo = (image.data ?? '') as string;
            imageUrl.value = (image.data ?? '') as string;
          }
        }
      } else {
        isCompanyAdded.value = false;
      }
    }
  } catch (error) {
    console.error(t('company.error.failedToFetch'), error);
    isSubmitting.value = false;
  } finally {
    isSubmitting.value = false;
  }
};
const formattedCompanyData = computed(() => {
  return {
    companyName: { label: t('company.label.companyName'), value: regForm.value.companyName },
    type: { label: t('company.label.type'), value: regForm.value.type.join(', ') },
    registrationNumber: { label: t('company.label.registrationNumber'), value: regForm.value.registrationNumber },
    activityCode: { label: t('company.label.activityCode'), value: regForm.value.activityCode },
    address: { label: t('company.label.address'), value: regForm.value.address },
    city: { label: t('company.label.city'), value: regForm.value.city.name ?? '-' },
    phoneNumber: { label: t('company.label.companyPhoneNumber'), value: regForm.value.companyPhoneNumber },
    bankAccount: { label: t('company.label.bankAccount'), value: regForm.value.bankAccount },
    website: { label: t('company.label.website'), value: regForm.value.website },
    status: { label: t('company.label.status'), value:companyVerifiedStatus.value }
  };
});
const absoluteUrl = computed(() => {
  if (regForm.value.website.startsWith('http://') || regForm.value.website.startsWith('https://')) {
    return regForm.value.website;
  }
  return `https://${regForm.value.website}`;
});
const showStatusReason = ref(false);
const changeStatus = async () => {
  showStatusReason.value = !showStatusReason.value;
};
const createCompany = async () => {
  router.push({ name: 'AddCompanyProfile' });
};

const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(() => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('company.head.companyProfile'), href: `/company/profile` }
  ]);
  fetchCompanyProfile();
});
</script>

<template>
  <div class="d-flex justify-space-between align-center mb-6 pt-5">
    <h3 class="text-h3 text-center mb-0">{{ $t('company.head.companyProfile') }}</h3>
    <v-btn
      v-if="isCompanyAdded && companyVerifiedStatus !== STATUSENUM.APPROVED"
      class="text-capitalize"
      color="primary"
      :to="{ name: 'UpdateCompanyProfile' }"
      >{{ $t('company.button.updateCompany') }}</v-btn
    >
  </div>

  <v-card class="pt-1" v-if="isCompanyAdded">
    <v-card-text>
      <v-row>
        <v-col cols="6" sm="4" md="4" lg="3">
          <v-img v-if="imageUrl" :src="imageUrl" class="icon-size"></v-img>
          <PictureOutlined v-else class="icon-size" style="color: grey"> </PictureOutlined>
        </v-col>
        <v-col cols="12" sm="8" md="8" lg="9">
          <v-list>
            <v-list-item class="d-grid" v-for="(value, key) in formattedCompanyData" :key="key">
              <v-row class="pb-8">
                <v-col cols="12" sm="12" md="4" lg="4" class="pb-0 pt-2">
                  <v-list-item-content>
                    <v-list-item-title
                      v-if="value.label === t('company.label.status') && value.value?.toLowerCase() === STATUSENUM.REJECTED"
                      class="pt-1 font-weight-bold"
                      >{{ value.label }}</v-list-item-title
                    >
                    <v-list-item-title v-else-if="value.label === t('company.label.status')" class="font-weight-bold py-3">{{
                      value.label
                    }}</v-list-item-title>
                    <v-list-item-title v-else class="font-weight-bold">{{ value.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
                <v-col cols="12" sm="12" md="8" lg="8" class="py-0 pt-2">
                  <v-list-item-content class="align-end">
                    <v-list-item-title v-if="value.label === t('company.label.status')">
                      <span v-if="value.value?.toLowerCase() === STATUSENUM.PENDING && user.roleId === ROLE.VERIFIER" class="d-flex py-3">
                        <v-btn :color="'#52C41A'" size="small" class="d-flex pt-1 text-capitalize" rounded="pill" @click="changeStatus">{{
                          t('verifier.button.approve')
                        }}</v-btn>
                        <v-btn :color="'#ff4d4f'" size="small" class="text-capitalize ml-2" rounded="pill" @click="changeStatus">{{
                          t('verifier.button.reject')
                        }}</v-btn>
                      </span>
                      <span
                        v-else
                        class=" d-flex pt-3"
                        :style="{ color: getStatusColor(value.value ? value.value?.toString() ?? '' : '') }"
                        >{{ t(`status.${value.value}`) }}


                        <span v-if="value.value?.toLowerCase() === STATUSENUM.REJECTED" class="ml-2 d-flex">
                          <Popover position="below" :key="value.value?.toLowerCase()" :id="`status-${value.value?.toLowerCase()}`">
                            <template v-slot:activator>
                              <InfoCircleOutlined />
                            </template>
                            <div>{{ regForm.rejectedReason }}</div>
                          </Popover>
                        </span>
                      </span>
                    </v-list-item-title>
                    <v-list-item-title v-else-if="value.label === 'Photo'">
                      <v-img :src="value.value?.toString()" max-width="400" max-height="400"></v-img>
                    </v-list-item-title>
                    <a
                      target="_blank"
                      v-else-if="value.label === t('company.label.website')"
                      style="fontsize: 16px"
                      :href="absoluteUrl"
                      color="primary"
                      rel="noopener noreferrer"
                      >{{ value.value }}</a
                    >
                    <v-list-item-title v-else class="text-capitalize">{{ value.value }}</v-list-item-title>
                  </v-list-item-content>
                </v-col>
              </v-row>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
  <v-card v-else>
    <v-list>
      <v-list-item>
        <v-list-item-content>
          <NoProfileCreateCompany
            :description="$t('company.other.noCompanyDetails')"
            :submitButtonText="$t('company.button.createCompany')"
            @submit="createCompany"
          ></NoProfileCreateCompany>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-card>
  <ModalPopup v-model="showStatusReason" :title="$t('company.head.reject')">
    <RejectReasonForm @submit="changeStatus" />
  </ModalPopup>
</template>
<style lang="scss" scoped>
.maximum-content {
  flex: 1 1 auto;
}
</style>
