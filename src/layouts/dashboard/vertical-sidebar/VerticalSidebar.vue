<script setup lang="ts">
import { useCustomizerStore } from '../../../stores/customizer';
import NavItem from './NavItem/NavItem.vue';
import NavCollapse from './NavCollapse/NavCollapse.vue';
import Logo from '../logo/LogoDark.vue';
import { getMenuItems, PageType, type MenuItem } from '@/router/permissions';
import { useFilterStore } from '@/stores/filter';
import { ref, watch, onMounted, computed } from 'vue';
import { useApi } from '@/composables/useApi';
import { ROLE } from '@/composables/role';
import { VERIFIER } from '@/composables/apiEndpoints';

// interface MenuItem {
//   title?: string;
//   children?: MenuItem[];
// }

const customizer = useCustomizerStore();
const filterStore = useFilterStore();

const submenuList = ref<MenuItem[]>([]);
const selectedRole = ref<number>(0);
const loading = ref<boolean>(false);

const showChild = ref<boolean>(!customizer.mini_sidebar);


const handleSubtitleClick = async (item: MenuItem) => {
  showChild.value= true;
  if(!item.children)
  {
      loading.value = true;
      filterStore.clearFIlters();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      loading.value = false;
  }
};


watch(
  () => selectedRole.value,
  (newRole :any) => {
    submenuList.value = getMenuItems(newRole) || [];
  },
  { immediate: true }
);

const handleHover = (isHovering: boolean) => {
  if(customizer.mini_sidebar){
  showChild.value = isHovering;
  }
};

watch(
  () => customizer.mini_sidebar,
  (newMiniSidebar: any) => {
    showChild.value = !newMiniSidebar;
  }
);

onMounted(() => {
  const roleSelection = localStorage.getItem('user');
  if (roleSelection) {
    try {
      const user = JSON.parse(roleSelection);
      selectedRole.value = user.roleId;
      submenuList.value = getMenuItems(selectedRole.value) || [];
      if(selectedRole.value === ROLE.VERIFIER){
        const {useAPI} = useApi();
        useAPI<any>(VERIFIER.VERIFIER, 'GET').then((result)=>{
          if(result.data){
            submenuList.value.forEach((item: MenuItem)=>{
              switch(item.pageType){
                case PageType.COMPANY:
                  item.chip = result.data.companyCount;
                break;
                case PageType.PRODUCT:
                  item.chip = result.data.productCount;
                break;
                case PageType.PRODUCTION:
                  item.chip = result.data.productionPlanCount;
                break;
                case PageType.IMPORTS:
                  item.chip = result.data.importsCount;
                break;
                case PageType.END_DESTINATION:
                  item.chip = result.data.endDestinationCount;
                break;
                case PageType.LATE_TAE_PAYMENTS:
                  item.chip = result.data.lateTaePayment;
                break;
                case PageType.COMPENSATIONS:
                  item.chip = result.data.compensationCount
;
                break;
                default:
                  break;
              }
            })
          }
        });
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage', error);
    }
  }
});
</script>

<template>
  <div>
    <v-navigation-drawer left v-model="customizer.Sidebar_drawer" elevation="0" rail-width="60" mobile-breakpoint="lg"
      app class="leftSidebar" :rail="customizer.mini_sidebar"
      @mouseover="handleHover(true)"
      @mouseleave="handleHover(false)" expand-on-hover>
      <div class="px-0 py-2">
        <Logo />
      </div>
      <!-- ---------------------------------------------- -->
      <!---Navigation -->
      <!-- ---------------------------------------------- -->
      <perfect-scrollbar class="scrollnavbar">
        <v-list aria-busy="true" aria-label="menu list">
          <!---Menu Loop -->
          <template v-for="(item, i) in submenuList" :key="i">
            <!---If Has Child -->
            <NavCollapse class="leftPadding" :item="item" :level="0" v-if="item.children && showChild"
              @click="handleSubtitleClick(item)" />
            <!---Item Sub Header -->
            <NavItem :item="item" v-else-if="item.title" :key="item.title" @click="handleSubtitleClick(item)" />
          </template>
        </v-list>
      </perfect-scrollbar>
    </v-navigation-drawer>

    <div v-if="loading" class="loader-overlay">
      <v-progress-circular indeterminate color="primary" class="loader"></v-progress-circular>
    </div>
  </div>
</template>


<style lang="scss" scoped>
.loader-overlay {
  position: fixed;
  top: 0;
  left: 260px; 
  width: calc(100% - 260px); 
  height: 100%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999; 
}
.loader {
  z-index: 10000; 
}
</style>
