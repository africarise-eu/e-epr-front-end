<template>
  <Snackbar></Snackbar>
  <RouterView></RouterView>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import Snackbar from './components/shared/Snackbar.vue';
</script>
