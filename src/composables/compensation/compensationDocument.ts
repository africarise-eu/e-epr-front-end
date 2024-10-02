import type{FileModel} from '@/composables/filemodel';

export default interface compensationDocumentDto {
    id: string;
    documentUrl: string;
    documentName: string;
    description: string;
  }

  export const mapApiResponseToCompensationDocumentDto = (response: any): compensationDocumentDto => {
    return {
      id: response.id,
      documentUrl: response.documentUrl,
      documentName: response.documentName,
      description: response.description,
    };
  };