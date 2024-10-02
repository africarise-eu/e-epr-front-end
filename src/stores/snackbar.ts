import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'

interface SnackbarDto {
  message: Ref<string>;
  color: Ref<string>;
  show: Ref<boolean>;
}
export const useSnackbarStore = defineStore('snackbar',{
    state: (): SnackbarDto => ({
        message: ref(''),
        color: ref('success'),
        show: ref(false),
      }),
      actions: {
        showMessage(message: string, color: string = 'success') {
          this.message = message
          this.color = color
          this.show = true
        },
        hideMessage() {
          this.show = false
        },
      },
})
