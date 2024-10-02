<template>
  <div class="logo">
    <RouterLink to="/dashboard" aria-label="logo">
      <img width="120px" src="@/assets/images/logo.svg" alt="TAE" />
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
const primary = ref('rgb(var(--v-theme-primary))');
const darkprimary = ref('rgb(var(--v-theme-darkprimary))');
</script>
