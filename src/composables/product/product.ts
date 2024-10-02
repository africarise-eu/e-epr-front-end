import type packingMaterialDto from '@/composables/product/packingMaterial';
import type {Country} from '@/composables/country';
import { reactive } from 'vue';

export default interface productDto {
  id: number;
  productName: string;
  productCategory: string;
  image: string;
  actualImageUrl: string;
  production: string;
  manufacturerCompany: string;
  countries:Country;
  countryOfManufacture: number;
  brandName: string;
  productModelTypeVolume: string;
  barcode: string;
  internalArticleCode: string;
  rejectedReason?: string;
  packingMaterials: packingMaterialDto[]
  status: string
}
  
export const mapApiResponseToProductDto = (response: any): productDto => {
  return {
    id: response.id,
    productName: response.productName,
    productCategory: response.productCategory,
    image: response.image || '',
    actualImageUrl: response.actualImageUrl || '',
    production: response.production,
    manufacturerCompany: response.manufacturerCompany,
    countryOfManufacture: response.countryOfManufacture, // Ensure this is a number as per productDto
    countries: response.countries as Country, // Cast to Country if response is of type Country
    brandName: response.brandName,
    productModelTypeVolume: response.productModelTypeVolume,
    barcode: response.barcode,
    internalArticleCode: response.internalArticleCode,
    rejectedReason: response.rejectedReason,
    packingMaterials: response.ProductMaterials.map((material: any): packingMaterialDto => ({
      id: material.id,
      materialId: material.materialId,
      material: material.TaeFee.material, 
      weight: material.weight || 0,
      TAE_KG: material.taeKg || 0,
      TAE_Total: material.taeTotal || 0,
      verification: material.verification ,
      rejectedReason: material.rejectedReason
    })),
    status: response.status,
  };
};

// Initialize with empty values or default values for a new product
export const initializedProduct = reactive<productDto>({
  id: 0,
  productName: '',
  productCategory: '',
  image: '',
  actualImageUrl: '',
  production: '',
  manufacturerCompany: '',
  countryOfManufacture: 1,
  countries: { id: 0, name: '' },
  brandName: '',
  productModelTypeVolume: '',
  barcode: '',
  internalArticleCode: '',
  rejectedReason: '',
  packingMaterials: [{
    id: 0,
    materialId: 0,
    material: '',
    weight: 0,
    TAE_KG: 0,
    TAE_Total: 0,
    verification: ''
  }],
  status: '',
});