import type { CompanyProfileResponseProps } from "@/components/company/CompanyProfileForm.vue";
import { VERIFIER } from "@/composables/apiEndpoints";
import { useApi } from "@/composables/useApi";
import { routeLocationKey } from "vue-router";

export function formatNumberWithCommas(value: number): string {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  

  