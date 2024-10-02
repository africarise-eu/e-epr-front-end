import { reactive, ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import { IMPORT } from '@/composables/apiEndpoints';
import type importShipmentDto from '@/composables/imports/importShipment';

export function useImportShipment(importId: string) {
  const importDetails = reactive<importShipmentDto>({
    id: 0,
    cdNo: '',
    etaDate: '',
    arrivalPort: 1,
    countryId: 1,
    countries:{id: 0, name: ''},
    arrivalPorts: {id: 0, portname: ''},
    fromPort: '',
    productUnits: 0,
    payStatus: '',
    status: '',
    rejectedReason: '',
    taeValue: 0,
    products: [{
      productId: 0,
      productName: '',
      image: '',
      units: 0,
      internalArticleCode: '',
      taeTotalValue: 0,
      perUnitTotalTaeValue: 0
    }]
  });

  const fetchById = async () => {
    try {
      const { useAPI } = useApi();
      const result = await useAPI<importShipmentDto>(`${IMPORT.GETBYID}/${importId}`, 'GET');
      Object.assign(importDetails, mapApiResponseToProductDto(result.data));
    } catch (error) {
      console.error('Failed when getting import by id', error);
    }
  };

  const mapApiResponseToProductDto = (response: any): importShipmentDto => {
    return {
      id: response.id || 0,
      cdNo: response.cdNo,
      etaDate: response.etaDate || '',
      arrivalPort: parseInt(response.arrivalPort) || 1,
      countryId: parseInt(response.countryId) || 1,
      countries:response.countries,
      arrivalPorts: response.arrivalPorts,
      fromPort: response.fromPort || '',
      productUnits: response.productUnits || 0,
      payStatus: response.payStatus || '',
      status: response.status || '',
      rejectedReason: response.rejectedReason || '',
      taeValue: response.taeValue || 0,
      products: (response.products || []).map((product: any) => ({
        productId: product.productId,
        productName: product.product.productName || '',
        image: product.product.actualImageUrl || '',
        units: parseInt(product.units) || 0,
        internalArticleCode: product.product.internalArticleCode || '',
        taeTotalValue: parseFloat(product.taeTotalValue) || 0,
        perUnitTotalTaeValue: parseFloat(product.product.totalAmount[0].totalAmount)
      }))
    };
  };

  onMounted(fetchById);

  return {
    importDetails
  };
}
