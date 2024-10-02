<script setup>
import { useRoute } from 'vue-router';
import { computed} from 'vue';

const props = defineProps({ item: Object, level: Number });
const route = useRoute();

const hasOpenedChildren = computed(() => {
  const children = props.item.children || [];
  return children.length > 0 && children.some(child => route.path.includes(child.to));
});
</script>

<template>
  <!---Single Item-->
  <v-list-item
    :to="item.to?item.to:''"
    rounded
    class="mb-1"
    color="primary"
    :disabled="item.disabled || !item.to"
    :target="item.type === 'external' ? '_blank' : ''"
    :class="{ 'v-list-item--active text-primary': route.path.includes(item.to) || hasOpenedChildren }"
  >
    <!---If icon-->
    <template v-slot:prepend>
      <component :is="props.item.icon" class="iconClass" :level="props.level"></component>
    </template>
    <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
    <!---If Caption-->
    <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
      {{ $t(item.subCaption) }}
    </v-list-item-subtitle>
    <!---If any chip or label-->
    <template v-slot:append v-if="item.chip">
      <v-chip
        label
        :color="item.chipColor"
        class="sidebarchip hide-menu"
        size="small"
        :variant="item.chipVariant"
        :prepend-icon="item.chipIcon"
      >
        {{ item.chip }}
      </v-chip>
    </template>
  </v-list-item>
</template>
