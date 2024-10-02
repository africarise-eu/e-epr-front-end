<script setup lang="ts">
import { computed, inject, onMounted, onUpdated, reactive, ref, type Ref} from 'vue';
import avatar from '@/assets/images/users/avatar-1.png';
import { type CompanyProfileFormProps, type CompanyProfileResponseProps } from '@/components/company/CompanyProfileForm.vue';
import { useApi } from '@/composables/useApi';
import { COMPANY } from '@/composables/apiEndpoints';
import { useI18n } from 'vue-i18n';
import InviteUserForm from '@/components/company/InviteUserForm.vue';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import { DefaultTheme } from '@/theme/LightTheme';
import NoProfileCreateCompany from '@/components/company/NoProfileCreateCompany.vue';
import { useRouter } from 'vue-router';
import {SearchOutlined, FilterFilled, FilterOutlined} from '@ant-design/icons-vue';
import TeamFilterForm from '@/components/company/TeamFilterForm.vue';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import type { breadCrumbDto } from '@/layouts/dashboard/DashboardLayout.vue';
import { STATUSENUM } from '@/composables/status';
export interface CompanyUserDto{
    id: number,
    firstName: string,
    lastName: string,
    email: string,
    password?: string,
    inviteLink?: string,
    roleId?: number,
    imagePath?: string,
    status?: string,
    isActive: boolean,
    isVerified: boolean,
    otp?: string,
    otpExpiration?: string,
    otpToken?: string,
    accessToken?: string,
    inviteLinkExpiration: string,
    createdAt: string,
    updatedAt: string,
    Company:{
            id: number,
            userId: number,
            companyId: number,
            createdAt: string,
            updatedAt: string,
            deletedAt?: string
        }[]
}
interface FormattedUser {
    [key: string]: string;
}
const router=useRouter();
const statusFilter=ref<string>('')
const isSubmitting = ref(false);
const {t} = useI18n();
const isInvited=ref(false);
const isCompanyAdded = ref(false);
const showInviteUserModal = ref(false);
const showFilterModal = ref(false);
const userList = ref<CompanyUserDto[]>([]);
const companyVerifiedStatus = ref(false);
const regForm:Ref<CompanyProfileFormProps>= ref({
    companyName: '',
      logo: avatar,
      type:[],
      registrationNumber:'',
      activityCode:'',
      address:'',
      city:{id:0, name:''},
      country:{id:1, name:'Mozambique'},
      companyPhoneNumber:'',
      website:'',
      bankAccount:'',
      imagePath:avatar,
      isImageUpload:false
});



const search = ref('');
const headers = computed((): DataTableHeader[] => [
  { title: t('common.name'), key: 'name', align: 'start' },
  { title: t('common.email'), key: 'email', align: 'start'},
  { title: t('common.status'), key: 'status', align: 'center'},
]);
const loading= ref(false);
const pageOptions = ref({
  page: 1,
  itemsPerPage: 10,
  totalItems: 10,
  pageCount:1,
  sortBy: ['firstName'],
  sortDesc: [false],
});

const fetchCompanyProfile = async () => {
  loading.value = true;
  isSubmitting.value = true;
  try {
    const { useAPI } = useApi();
    const result  = await useAPI<CompanyProfileResponseProps>(COMPANY.COMPANY_PROFILE, 'GET');
    loading.value = false;
    isSubmitting.value=false;
    if(!result.error){
        if (result.data) {
            companyVerifiedStatus.value = (result.data.status === STATUSENUM.APPROVED || result.data.status === STATUSENUM.PENDING || result.data.status === STATUSENUM.IMPROVED) ?true:false;
        isCompanyAdded.value = true;
        regForm.value.companyName = result.data.companyName ?? '';
        // regForm.value.profileImage = result.data.profileImage??'';
        // regForm.value.person = result.data.person??'';
        regForm.value.registrationNumber = result.data.registrationNumber??'';
        regForm.value.activityCode = result.data.activityCode??0;
        regForm.value.address = result.data.address??'';
        regForm.value.city = result.data.cities??'';
        regForm.value.companyPhoneNumber = result.data.phoneNumber??'';
        regForm.value.website = result.data.website??'';
        regForm.value.bankAccount = result.data.bankAccount??'';
        regForm.value.type=[]
        result.data.isImporter? regForm.value.type.push('Importer'): null
        result.data.isProducer? regForm.value.type.push('Producer'): null
        return true;
        }else{
            isCompanyAdded.value = false;
            return false;
        }
    }else{ 
        return false;
    }
  } catch (error) {
    loading.value = false;
    console.error( t('company.error.failedToFetch'), error);
    isSubmitting.value = false;
    return false;
  } finally {
    loading.value = false;
    isSubmitting.value = false;
  }
};
const fetchTeam = async (search:string, limit:number, page:number, status?:string) => {
  isSubmitting.value = true;
  loading.value = true;
  try {
    const { useAPI } = useApi();
    let payload:{search?:string, limit?:number, page?:number, status?:string} = {};
    if(search){
        payload.search = search;
    }
    if(limit){
        payload.limit = limit;
    }
    if(page){
        payload.page = page;
    }
    if(status){
        payload.status = status;
    }
    const result  = await useAPI<{count: number, rows:CompanyUserDto[]}>(COMPANY.LIST_USERS, 'GET',null,payload);
    isSubmitting.value=false;
    loading.value = false;
    if(!result.error){   
        pageOptions.value.page=page, 
        pageOptions.value.totalItems=result.data.count,
        pageOptions.value.pageCount= Math.ceil(result.data.count/pageOptions.value.itemsPerPage),
        userList.value = result.data.rows; 
    }
  } catch (error) {
    console.error( t('company.error.failedToFetch'), error);
    loading.value = false;
    isSubmitting.value = false;
  } finally {
    loading.value = false;
    isSubmitting.value = false;
  }
};
const searchUser = async () => {
  fetchTeam(search.value, pageOptions.value.itemsPerPage, pageOptions.value.page,statusFilter.value);
}
const UpdateCompanyUser = async (status:string, id:number) => {
  isSubmitting.value = true;
  const payload = {status:status, userId:id}
  try {
    const { useAPI } = useApi();
    const result  = await useAPI(COMPANY.COMPANY_STATUS, 'PATCH',payload);
    isSubmitting.value=false;
    if(!result.error){
        // fetchTeam(search.value, pageOptions.value.itemsPerPage, pageOptions.value.page);
    }
  } catch (error) {
    console.error( t('company.error.failedToFetch'), error);
    isSubmitting.value = false;
  } finally {
    isSubmitting.value = false;
  }
};
const inviteSent = () => {
    isInvited.value=true;
}

const formattedUserData = computed<FormattedUser[]>(() => {
  return userList.value.map((item: CompanyUserDto) => ({
    name: String ((item.firstName || '') + ' ' + (item.lastName || '')),
    // firstName: String(item.firstName || ''),
    // lastName: String(item.lastName || ''),
    email: String(item.email || ''),
    id: String(item.id || 0),
    status: String(item.status || '')
  }));
});
const updatePage = (pageNumber:number)=>{
    pageOptions.value.page=pageNumber;
    fetchTeam(search.value, pageOptions.value.itemsPerPage, pageOptions.value.page, statusFilter.value);
}
const applyFilter = async (filter: any) => {
  statusFilter.value = filter.status;
  showFilterModal.value = false;
  fetchTeam(search.value, pageOptions.value.itemsPerPage, pageOptions.value.page, statusFilter.value);
}
const createCompany = async () => {
  router.push({name: 'AddCompanyProfile'})
}
const updateBreadcrumb = inject<(items: breadCrumbDto[]) => void>('updateBreadcrumb');
onMounted(async () => {
  updateBreadcrumb?.([
    { title: '', href: '' },
    { title: t('company.head.team'), href: `/company/user` },
  ]);
    if(await fetchCompanyProfile()){
        fetchTeam(search.value, pageOptions.value.itemsPerPage, pageOptions.value.page);
    }
});
onUpdated(() => {
    if(showInviteUserModal.value){
        isInvited.value=false;
    }
    if(isInvited.value){
        pageOptions.value.page=1;
        search.value='';
        statusFilter.value='';
        fetchTeam(search.value, pageOptions.value.itemsPerPage, pageOptions.value.page);
    }
})
</script>

<template>
    <div class="d-flex justify-space-between align-center mb-6 pt-5">
      <h3 class="text-h3 text-center mb-0">{{$t('company.head.team')}}</h3>
      <v-btn  v-if="isCompanyAdded && companyVerifiedStatus && userList.length"  class="text-capitalize" color="primary" @click="showInviteUserModal = true">{{$t('company.button.inviteMembers')}}</v-btn>
    </div>
    <div class="d-flex justify-start align-start">
      <v-text-field variant="outlined" v-model="search" @input="searchUser()" :label="$t('company.label.search')" max-width="300px">
        <template v-slot:prepend-inner>
          <SearchOutlined />
        </template>
      </v-text-field>
      <v-btn
        elevation="2" min-width="40px" height="40px" class="ml-4" color="primary" @click="showFilterModal=true"
      ><FilterOutlined :style="{fontSize: '20px'}"/></v-btn>
    </div>
    <v-card>
      <v-card-text v-if="isCompanyAdded && companyVerifiedStatus" class="pa-0">
        <v-data-table :loading="loading" class="rounded-md custom-bordered-table" v-if="userList.length" :headers="headers" :items="formattedUserData" density="default" item-key="id" hide-default-footer>
          <!-- action column -->
          <template v-slot:item.status="{ item }">
            <!-- <span v-if="item.status===''">   -->
            <span class="d-flex justify-center justify-xs-start">  
              <!-- <v-btn color="success" size="small" class="mr-2" @click="UpdateCompanyUser('enabled',Number(item.id))">Enable</v-btn>
              <v-btn color="error" size="small" @click="UpdateCompanyUser('disabled',Number(item.id))">Disable</v-btn>  -->
              <v-switch
                v-model="item.status"
                color="primary"
                hide-details
                @change="UpdateCompanyUser(item.status,Number(item.id))"
                false-value="disabled"
                true-value="enabled"
            ></v-switch>
            </span>
            <!-- <span v-else :style="{ color: item.status!==''?item.status==='enabled' ? theme.colors?.success :theme.colors?.error: '#000000DE', }">
            {{ item.status!==''?item.status==='enabled' ? 'Enabled' : 'Disabled':'-' }}
            </span> -->
          </template>
        </v-data-table>
        <v-container v-else>
            <NoProfileCreateCompany :description="$t('company.other.noUserList')" :submitButtonText="$t('company.button.inviteMembers')" @submit="showInviteUserModal = true"/>
        </v-container>
      </v-card-text>
      <v-container v-else-if="isCompanyAdded && !companyVerifiedStatus">
          <v-list-item-title class="text-center mt-8">{{$t('company.other.notVerified')}}</v-list-item-title>
      </v-container>
      <v-card-text v-else>
        <NoProfileCreateCompany :description="$t('company.other.noCompanyDetails')" :submitButtonText="$t('company.button.createCompany')" @submit="createCompany"/>
      </v-card-text>
    </v-card>
    <v-pagination
      v-if="pageOptions.pageCount > pageOptions.itemsPerPage"
      v-model="pageOptions.page"
      :length="pageOptions.pageCount"
      @update:model-value="updatePage"
      class="mt-4"
    ></v-pagination>
      
  <ModalPopup v-model="showInviteUserModal" :title="$t('company.head.inviteUser')">
    <InviteUserForm @submit="inviteSent"/>
  </ModalPopup>
  <ModalPopup v-model="showFilterModal" :title="$t('company.head.filterTeam')">
    <TeamFilterForm :status="statusFilter" @submit="applyFilter"/>
  </ModalPopup>
</template>
<style lang="scss" scoped>
.v-table{
  ::v-deep .v-table__wrapper table tbody tr td{
            border-bottom: 1px solid rgba(0,0,0,0.05);
          }
        
}
</style>
