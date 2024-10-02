import type importShipmentProductDto from '@/composables/imports/importShipmentProduct';
import type {Country} from '@/composables/country';
import type {Port} from '@/composables/port';

export default interface importShipmentDto {
  id: number;
  cdNo: string;
  etaDate: string;
  arrivalPort: number;
  countryId: number;
  countries:Country;
  arrivalPorts: Port;
  fromPort: string;
  productUnits: number;
  payStatus: string;  
  status:string;
  rejectedReason: string;
  taeValue: number;
  products: importShipmentProductDto[]
}