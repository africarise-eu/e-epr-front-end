<template>
    <div class="d-flex flex-column align-center justify-center py-10">
        <v-btn size="x-large" class="text-capitalize" color="primary" @click="submitValue">{{submitButtonText}}</v-btn>
        <v-list-item-title class="mt-8">{{description}}</v-list-item-title>
    </div>
  </template>
  
  <script setup lang="ts">
  import { defineEmits, defineProps} from 'vue';
  
  const emit = defineEmits(['submit'])
const prop = defineProps({
  submitButtonText: {
    type: String,
    required: true,
    default: '',
  },
  description:{
    type: String,
    required: true,
    default: '',
  }
})

  const submitValue= () => {
      emit('submit');
  };
  </script>