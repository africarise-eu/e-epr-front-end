import type compensationDocumentDto from '@/composables/compensation/compensationDocument'
import {mapApiResponseToCompensationDocumentDto} from '@/composables/compensation/compensationDocument'
import { reactive } from 'vue';

export default interface compensationRequestDto {
    id: number;
    requestedDate: string;
    deliveryToEdDate: string;
    materialId: number | null;
    material: string;
    deliveredKgs: number;
    edOrganisationId: number | null;
    edOrganisation: string;
    edType: string; 
    edOrgStatus:string; 
    status:string;
    rejectedReason: string;
    documents: compensationDocumentDto[]
  }

  export const initializedCompensationRequest = {
    id: 0,
    requestedDate:'',
    deliveryToEdDate: '',
    materialId: null,
    material: '',
    deliveredKgs: 0,
    edOrganisationId: null,
    edOrganisation: '',
    edType: '',
    status:'',
    edOrgStatus:'',
    rejectedReason: '',
    documents: []
  };

  export const mapApiResponseToCompensationRequestDto = (response: any): compensationRequestDto => {
    return {
      id: response.id,
      requestedDate: response.createdAt,
      deliveryToEdDate: response.deliveryToEdDate,
      materialId: response.material.id ?? null,
      material: response.material.materialName ?? '',
      deliveredKgs: response.deliveredKgs ?? 0,
      edOrganisationId: response.edOrganisation.id ?? null,
      edOrganisation: response.edOrganisation.orgName ?? '',
      edType: response.edOrganisation.orgType ?? '',
      edOrgStatus: response.edOrganisation.status ?? '',
      status:response.status,
      rejectedReason: response.rejectedReason ?? '',
      documents:  response.compensationDocuments.map(mapApiResponseToCompensationDocumentDto) ?? []
    };
  };