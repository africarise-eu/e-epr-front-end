<template>
    <div>
    
    <v-menu
      v-model="menu"
      :target="'#'+id"
      max-width="400"
      :close-on-content-click="false"
      :nudge-width="200"
    >
    <template v-slot:activator="{ props: menu }">
        <!-- <v-tooltip location="top">
          <template v-slot:activator="{ props: tooltip }">v-bind="mergeProps(menu, tooltip)" -->
        
            <span @click="toggleMenu()"  style="cursor:pointer" :id="id">
                <slot name="activator"></slot></span>
          <!-- </template>
          <span v-if="toolTipText">{{ displayText }}</span>
        </v-tooltip> -->
      </template>
      <v-card>
        <v-card-text style="max-height: 200px; overflow-y: auto;">
          <slot>{{ content }}</slot>
        </v-card-text>
      </v-card>
    </v-menu>
</div>
  </template>
  
  <script setup>
  import { ref, mergeProps, computed } from 'vue';
  import { InfoCircleOutlined} from '@ant-design/icons-vue/lib/icons';
  
  const props = defineProps({
    content: {
      type: String,
      required: false,
    },
    toolTipText: {
      type: String,
      required: false,
    },
    id:{
        type: String,
        required:true
    },
    position: {
      type: String,
      default: 'below',
      validator: value => ['above', 'below'].includes(value),
    },
  });
  
    const fullText = ref(props.toolTipText);
    const displayText = computed(() =>{ 
      return fullText.value.length > 50 ? fullText.value.slice(0, 50) + '...' : fullText.value
    });
  const menu = ref(false);
  
  const toggleMenu = () => {
    menu.value = !menu.value;
  };
  </script>
  