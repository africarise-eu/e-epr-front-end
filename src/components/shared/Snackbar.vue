<template>
<v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top right">
    {{ $t(snackbar.message) }}
    <template v-slot:actions>
    <v-btn variant="text" @click="snackbar.show = false"><CloseOutlined /></v-btn>
    </template>
</v-snackbar>
</template>
  
<script setup lang="ts">
  import { useSnackbarStore } from '@/stores/snackbar'
  import { CloseOutlined } from '@ant-design/icons-vue/lib/icons'
  const snackbar = useSnackbarStore()
</script>