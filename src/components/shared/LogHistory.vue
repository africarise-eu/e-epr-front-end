<script setup lang="ts">
import { ref, computed, onMounted, defineProps } from 'vue';
import { useApi } from '@/composables/useApi';
import { VERIFIER } from '@/composables/apiEndpoints';
import { getStatusColor } from '@/composables/status';
import { formatDate } from '@/utils/date/dateFormat';
import { useI18n } from 'vue-i18n';
import type { DataTableHeader } from '@/composables/dataTableHeader';

 interface logHistoryDto {
    id: number;
    companyName: string;
    userName: string;
    fromStatus: string;
    toStatus: string;
    comment: string;
    createdAt: string;
  }

  const objectTypes = {
    COMPANY: 0,
    PRODUCT: 1,
    COMPENSATION: 2,
    END_DESTINATION: 3,
    IMPORT: 4,
    PRODUCTION: 5
};

const props = defineProps<{ id: number, objectTypeId: number }>();

const {t} = useI18n();
const logHistory = ref<logHistoryDto[]>([]);
const currentPage = ref(1);
const logCount = ref(0);
const itemsPerPage = ref(10);

const headers = computed((): DataTableHeader[] => [
  { title: t('logHistory.tableHeaders.companyName'), key: 'companyName' },
  { title: t('logHistory.tableHeaders.userName'), key: 'userName' },
  { title: t('logHistory.tableHeaders.fromStatus'), key: 'fromStatus' },
  { title: t('logHistory.tableHeaders.toStatus'), key: 'toStatus' },
  { title: t('logHistory.tableHeaders.comment'), key: 'comment' },
  { title: t('logHistory.tableHeaders.createdAt'), key: 'createdAt' }
]);
const getLogHistory = async (limit: number, page: number) => {
  const { useAPI } = useApi();
  const objectType = props.objectTypeId;
  const id =props.id;
  const payload = { limit, page, objectType, id };
  const result = await useAPI<{ count: number; rows: any[] }>(VERIFIER.LOG_HISTORY, 'GET', null, payload);
  if (!result.error) {
    logHistory.value = mapResponseToLogHistoryDto(result.data.rows);
    logCount.value = result.data.count;
  } else {
    console.error('Error on fetching log history');
  }
};

const mapResponseToLogHistoryDto = (response: any[]): logHistoryDto[] => {
  return response.map(item => ({
    id: item.id,
    companyName: item.company.companyName,  // Assuming `objectName` corresponds to `companyName`
    userName: `${item.user.firstName} ${item.user.lastName}`,  // Concatenating first and last name
    fromStatus: item.fromStatus,
    toStatus: item.toStatus,
    comment: item.comment,
    createdAt: item.createdAt
  }));
};

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await getLogHistory(itemsPerPage.value, currentPage.value);
};

onMounted(async () => {
  await getLogHistory(itemsPerPage.value, currentPage.value);
});

</script>

<template>
  <v-container class="">
    <v-card class="pt-1">
      <v-card-text >
        <v-data-table :headers="headers" :items="logHistory" hide-default-footer>
            <template v-slot:item.createdAt="{ item }">
            {{ formatDate(new Date(item.createdAt)) }}
          </template>
         <template v-slot:item.fromStatus="{ item }">
            <span class="text-capitalize" :style="{ color: getStatusColor(item.fromStatus) }">
              {{ t(`status.${item.fromStatus}`) }}
            </span>
          </template>
           <template v-slot:item.toStatus="{ item }">
            <span class="text-capitalize" :style="{ color: getStatusColor(item.toStatus) }">
              {{ t(`status.${item.toStatus}`) }}
            </span>
          </template>
          
        </v-data-table>
      </v-card-text>
    </v-card>
    <v-pagination
     v-if="logCount > itemsPerPage"
      v-model="currentPage"
      :length="Math.ceil(logCount / itemsPerPage)"
      @update:model-value="handlePageChange"
      class="mt-4"
    ></v-pagination>
  </v-container>
</template>
<style lang="scss" scoped>
</style>
