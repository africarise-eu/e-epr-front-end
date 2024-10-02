<template>
    <v-dialog v-model="dialogModel" max-width="500px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          {{ title }}
          <v-btn variant="text" icon @click="closeDialog">
            <CloseOutlined  :style="{ color: 'rgb(var(--v-theme-secondary))' }"/>
          </v-btn>
        </v-card-title>
        <v-card-text class="pt-0">
          <slot></slot>
        </v-card-text>
      </v-card>
    </v-dialog>
  </template>

<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue';
import { computed, defineEmits, defineProps, withDefaults } from 'vue';

interface Props {
  title?: string;
  modelValue: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Modal Title'
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const closeDialog = () => {
  dialogModel.value = false;
};
</script>