<template>
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
            {{ title }}
            <v-btn variant="text" icon @click="close">
              <CloseOutlined  :style="{ color: 'rgb(var(--v-theme-secondary))' }"/>
            </v-btn>
          </v-card-title>
        <v-card-text>{{ message }}</v-card-text>
  
        <!-- <v-card-actions> -->
        <div class="d-flex justify-start align-center pa-5">
          <v-spacer></v-spacer>
          <v-btn color="secondary" @click="close">{{ cancelButtonText }}</v-btn>
          <v-btn color="primary" class="ml-2" @click="confirm">{{ confirmButtonText }}</v-btn>
        </div>
        <!-- </v-card-actions> -->
      </v-card>
    </v-dialog>
  </template>
  
  <script setup lang="ts">
  import { defineEmits, defineProps, ref, watch } from 'vue';
  import { CloseOutlined } from '@ant-design/icons-vue';

  export interface ConfirmationPopupProps {
    title?: string;
    message?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    show: boolean;
    type: string;
  }
  const props = defineProps({
    title: {
      type: String,
      default: 'Confirm',
    },
    message: {
      type: String,
      default: 'Are you sure you want to proceed?',
    },
    confirmButtonText: {
      type: String,
      default: 'Yes',
    },
    cancelButtonText: {
      type: String,
      default: 'No',
    },
    show: {
      type: Boolean,
      required: true,
    },
  });
  
  const emit = defineEmits(['confirm', 'cancel', 'update:show']);
   
  const dialog = ref(props.show);
  
  watch(() => props.show, (newVal:any) => {
    dialog.value = newVal;
  });
  
  const confirm = () => {
    emit('confirm');
    close();
  };
  
  const close = () => {
    dialog.value = false;
    emit('cancel');
    emit('update:show', false);
  };
  </script>
  