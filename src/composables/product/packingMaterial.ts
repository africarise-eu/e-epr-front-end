export default interface packingMaterialDto {
  id: number;
  materialId:number|null,
  material: string;
  weight: number;
  TAE_KG: number;
  TAE_Total: number;
  verification: string;
  rejectedReason?: string
  addPackingMaterialHandler?: (packingMaterialDto: packingMaterialDto) => void
}
