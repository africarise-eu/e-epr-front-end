<script setup lang="ts">
import type packingMaterialDto from '@/composables/product/packingMaterial';
import ModalPopup from '@/components/shared/ModalPopup.vue';
import PackingMaterialForm from '@/components/product/packingMaterialForm.vue';
import { computed, reactive, ref, defineProps, watch, type PropType } from 'vue';
import type { DataTableHeader } from '@/composables/dataTableHeader';
import { useI18n } from 'vue-i18n';
import { DefaultTheme } from '@/theme/LightTheme';
import { EditOutlined, EyeOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons-vue';
import Popover from '@/components/shared/Popover.vue';
import { getStatusColor, STATUSENUM } from '@/composables/status';
import { formatNumberWithCommas } from '@/utils/commonMethods';

const props = defineProps({
  packingMaterialList: {
    type: Array as PropType<packingMaterialDto[]>,
    required: true
  },
  updatePackingMaterials: {
    type: Function as PropType<(updatedMaterials: packingMaterialDto[]) => void>,
    required: true
  },
  errorMessage: {
    type: String,
    required: false
  }
});

const { t } = useI18n();
const headers = computed((): DataTableHeader[] => [
  { title: t('packingMaterial.table.material'), align: 'start', sortable: false, key: 'material' },
  { title: t('packingMaterial.table.weight'), align: 'center', key: 'weight', sortable: false },
  { title: t('packingMaterial.table.TAE_KG'), align: 'center', key: 'TAE_KG', sortable: false },
  { title: t('packingMaterial.table.TAE_Total'), align: 'center', key: 'TAE_Total', sortable: false },
  { title: t('packingMaterial.table.verification'), align: 'center', key: 'verification', sortable: false },
  { title: t('packingMaterial.table.actions'), align: 'center', key: 'actions' }
]);

const showAddPackingMaterialModal = ref(false);
const computedErrorMessage = computed(() => props.errorMessage);
const packingMaterials = reactive([] as packingMaterialDto[]);

const modifyPackingMaterials = (packingMaterial: packingMaterialDto) => {
  const index = packingMaterials.findIndex((pm) => pm.id === packingMaterial.id);
  if (packingMaterial.id === 0) {
    // Assign a new id
    packingMaterial.id = packingMaterials.length + 1;
    packingMaterials.push(packingMaterial);
  } else if (index !== -1) {
    // Update existing packingMaterial
    packingMaterials[index] = packingMaterial;
  }
  resetPackingMaterial();
  showAddPackingMaterialModal.value = false;
};

const defaultPackingMaterial: packingMaterialDto = {
  id: 0,
  materialId: null,
  material: '',
  weight: 0,
  TAE_KG: 0,
  TAE_Total: 0,
  verification: 'pending',
  addPackingMaterialHandler: (packingMaterialDto: packingMaterialDto) => {
    const newPackingMaterial = { ...packingMaterialDto };
    modifyPackingMaterials(newPackingMaterial);
  }
};

const packingMaterial = reactive<packingMaterialDto>({ ...defaultPackingMaterial });

const resetPackingMaterial = () => {
  // Reset packingMaterial to default values without changing the id
  Object.assign(packingMaterial, defaultPackingMaterial);
};

const addNewPackingMaterial = () => {
  // Create a new object based on the defaultPackingMaterial
  resetPackingMaterial();
  Object.assign(packingMaterial, defaultPackingMaterial);
  showAddPackingMaterialModal.value = true;
};
const editPackingMaterial = (editedMaterial: packingMaterialDto) => {
  Object.assign(packingMaterial, editedMaterial);
  showAddPackingMaterialModal.value = true;
};

const deletePackingMaterial = (deletedMaterial: packingMaterialDto) => {
  const index = packingMaterials.findIndex((item) => item.id === deletedMaterial.id);
  if (index !== -1) {
    packingMaterials.splice(index, 1);
  }
};
// Computed properties for summary data
const totalWeight = computed(() => {
  return packingMaterials.reduce((sum, item) => {
    const weight = Number(item.weight) || 0; // Convert to number and treat null or NaN as 0
    return sum + weight;
  }, 0);
});

const totalTAE_KG = computed(() => {
  const sum = packingMaterials.reduce((sum, item) => sum + item.TAE_KG, 0);
  return parseFloat(sum.toFixed(2)); // Convert back to number if needed
});

const totalTAE_Total = computed(() => {
  const sum = packingMaterials.reduce((sum, item) => sum + item.TAE_Total, 0);
  return parseFloat(sum.toFixed(2));
});

watch(
  () => props.packingMaterialList,
  (newVal: any) => {
    // Use splice to modify the reactive array
    packingMaterials.splice(0, packingMaterials.length, ...newVal);
  },
  { deep: true }
);

watch(
  () => packingMaterials,
  (newVal: any) => {
    // Call the method passed from the parent
    props.updatePackingMaterials(newVal);
  },
  { deep: true }
);
</script>

<template>
  <v-row class="mb-4 align-center">
    <v-col cols="12" sm="6">
      <strong class="d-flex justify-start flex-row"
        >{{ $t('packingMaterial.head.packingMaterial') }}
        <Popover class="ml-2" position="below" id="packingmaterial">
          <template v-slot:activator>
            <InfoCircleOutlined />
          </template>
          <div>{{ $t('common.packagingMaterial.info') }}</div>
        </Popover>
      </strong>
      <span v-if="computedErrorMessage" :style="{ color: DefaultTheme.colors?.error, fontSize: '12px' }">{{ computedErrorMessage }}</span>
    </v-col>
    <v-col cols="12" sm="6" class="d-flex justify-end">
      <v-btn color="primary" @click="addNewPackingMaterial()">
        {{ $t('packingMaterial.button.add-packaging-meterial') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-data-table
    :headers="headers"
    :items="packingMaterials"
    density="compact"
    item-key="id"
    hide-default-footer
    v-if="packingMaterials.length > 0"
  >
  <template v-slot:item.material="{ item }">
      {{ t(`common.packagingMaterial.${item.material}`) }}
    </template>
    <!-- action column -->
    <template v-slot:item.actions="{ item }">
      <div class="action-icons">
        <v-tooltip>
          <template #activator="{ props }">
            <span v-bind="props" style="cursor: pointer; text-decoration: underline">
              <EditOutlined @click="editPackingMaterial(item)" class="icon px-3"></EditOutlined>
            </span>
          </template>
          <span>{{ t('common.edit') }}</span>
        </v-tooltip>
        <v-tooltip>
          <template #activator="{ props }">
            <span v-bind="props" style="cursor: pointer; text-decoration: underline">
              <CloseOutlined @click="deletePackingMaterial(item)" class="icon px-3"></CloseOutlined>
            </span>
          </template>
          <span>{{ t('common.delete') }}</span>
        </v-tooltip>
      </div>
    </template>
    <!-- <template v-slot:item.verification="{ item }">
                        <span class="text-capitalize" :style="{ color: getStatusColor(item.verification) }">
                              {{ item.verification }}
                    </span>
                  </template> -->
    <!-- Custom Summary Row -->
    <template v-if="packingMaterials.length > 0" v-slot:body.append>
      <tr>
        <td class="text-left font-weight-black">{{ t('packingMaterial.table.total') }}</td>
        <td class="text-center font-weight-bold">{{ formatNumberWithCommas(totalWeight) }}</td>
        <td class="text-center font-weight-bold">{{ formatNumberWithCommas(totalTAE_KG) }}</td>
        <td class="text-center font-weight-bold">{{ formatNumberWithCommas(totalTAE_Total) }}</td>
        <!-- Add other summary cells as needed -->
      </tr>
    </template>
    <template v-slot:item.weight="{ item }">
      {{ formatNumberWithCommas(item.weight) }}
    </template>
    <template v-slot:item.TAE_KG="{ item }">
      {{ formatNumberWithCommas(item.TAE_KG) }}
    </template>
    <template v-slot:item.TAE_Total="{ item }">
      {{ formatNumberWithCommas(item.TAE_Total) }}
    </template>
    <!--customize the td styles-->
    <template v-slot:item.verification="{ item }">
      <span v-if="item.verification" class="d-flex justify-center text-capitalize" :style="{ color: getStatusColor(item.verification) }">
        {{ t(`status.${item.verification}`) }}
        <span v-if="item.verification.toLowerCase() === STATUSENUM.REJECTED" class="ml-2">
          <Popover position="below" :key="item.id" :id="`status-${item.id}`">
            <template v-slot:activator>
              <InfoCircleOutlined />
            </template>
            <div>{{ item.rejectedReason }}</div>
          </Popover>
        </span>
      </span>
    </template>
  </v-data-table>

  <ModalPopup v-model="showAddPackingMaterialModal" :title="$t('packingMaterial.head.packingMaterial')">
    <PackingMaterialForm :packing-material="packingMaterial" :packing-materials="packingMaterials"></PackingMaterialForm>
  </ModalPopup>
</template>
<style lang="scss" scoped>
.icon {
  font-size: 15px;
  /* Adjust size if needed */
  color: #000;
  /* Default color */
  transition: color 0.3s;
  /* Smooth transition */
}

.icon:hover {
  color: blue;
  /* Hover color */
}

.action-icons {
  display: flex;
  justify-content: center;
}

.action-icons .icon {
  margin: 0 4px;
  /* Adjust spacing between icons if needed */
}
</style>
