<script setup lang="ts">
import { ref, reactive, defineProps, watch, h, type PropType } from 'vue';
import { Upload, Modal as AModal, Button } from 'ant-design-vue';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { useSnackbarStore } from '@/stores/snackbar';
import { useI18n } from 'vue-i18n';

export interface FileModel {
    uid?: string;
    name?: string;
    status?: string;
    url?: string;  
    type?: string;
    isNew: boolean;
  }

const props = defineProps({
  fileList: {
    type: Array as () => FileModel[],
    default: () => [],
  },
   handleFileList:{
    type: Function as PropType<(newFileList: FileModel[]) => void>,
    required: true
  }
});


const {t} = useI18n();
const snackbarStore = useSnackbarStore();
const previewVisible = ref(false);
const previewPdf = ref(false);
const previewImage = ref('');
const fileList = ref([...props.fileList]);

// Watch for changes to props.fileList and update local fileList
watch(() => props.fileList, (newFileList : any) => {
  fileList.value = [...newFileList];
}, { immediate: true });



const handleCancel = () => {
  previewVisible.value = false;
  previewPdf.value = false;
};

const beforeUpload = (file: File) => {
  const isAllowedType = file.type === 'application/pdf' || file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png';
  
  if (!isAllowedType) {
    console.error('product.error.invalidFileType');
    snackbarStore.showMessage(t('imageUpload.info.isAllowedType'), 'error');
  }
  const isLt5M = file.size / 1024 / 1024 < 5;
  const isLt1MForPDF = file.type === 'application/pdf' ? file.size / 1024 / 1024 < 1 : true; 

  if (!isLt5M) {
    console.error('product.error.imageTooLarge');
    snackbarStore.showMessage(t('imageUpload.info.isLt5M'), 'error');
  }
   if (file.type === 'application/pdf' && !isLt1MForPDF) {
    console.error('product.error.pdfTooLarge');
    snackbarStore.showMessage(t('imageUpload.info.isLt1MForPDF'), 'error');
    return false;
  }
  return isAllowedType && isLt5M;
};

const handlePreview = async (file: any) => {
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (fileExtension === 'pdf') {
    previewPdf.value = true;
    previewImage.value = file.url || URL.createObjectURL(file.originFileObj);
  } else {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    previewImage.value = file.url || file.preview;
    previewVisible.value = true;
  }
};

const handleChange = async (info: any) => {
  const updatedFileList = [...fileList.value];

  if (info.file) {
      // Add the new file
      updatedFileList.push({
        uid: info.file.uid,
        name: info.file.name,
        status: 'done', // Adjust status as needed
        url: URL.createObjectURL(info.file),        
        type: info.file.type,
        isNew: true
      });

    // Update the fileList
    fileList.value = updatedFileList;
    props.handleFileList(fileList.value);
  }
};

const handleRemove = (file: any) => {
  const updatedFileList = fileList.value.filter((f: any) => f.uid !== file.uid);
  fileList.value = updatedFileList;
  props.handleFileList(fileList.value);
};

const getBase64 = (file: File) => {
  return new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = (error) => reject(error);
  });
};

</script>



<template>
  <div class="clearfix">
    <a-upload
      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
      list-type="picture"
      :before-upload="beforeUpload"
      :file-list="fileList"
      :custom-request="handleChange"
      @preview="handlePreview"
      :on-remove="handleRemove"
      :remove-icon="() => h(CloseOutlined)"
    >
    <div :style="fileList.length >= 5 ? 'height:26px;' : ''">
      <div v-if="fileList.length < 5">
        <Button >
        <PlusOutlined  />    Upload
      </Button>
      </div>
    </div>
    </a-upload>
    <a-modal :open="previewVisible"  :footer="null"  @cancel="handleCancel">
      <img alt="example" style="width: 100%" :src="previewImage" />
    </a-modal>
    <a-modal :open="previewPdf"  :footer="null"  width="50%" @cancel="handleCancel">
      <iframe :src="`${previewImage}#toolbar=0`" frameborder="0" style="width: 100%; height: 60vh;"></iframe>
    </a-modal>
  </div>
</template>