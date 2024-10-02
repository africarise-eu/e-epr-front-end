export default interface compensationDto {
    materialId: number;
    material: string;
    requestedCompensationKgs: number;
    compensationStatus: string;
    actualTotalKgs: number;
    actualTotalTae: number;
    actualTotalTaePaid: number;
    compensationViable: string;
    repaymentStatus: string;
}

export const mapApiResponseToCompensationDto = (response: any): compensationDto => {
    return {
      materialId: response.materialId ?? null,
      material: response.materialName ?? '',
      requestedCompensationKgs: response.deliveredKgs ?? 0, 
      compensationStatus: response.status ?? 'Approved', 
      actualTotalKgs: response.totalCombined ?? 0, 
      actualTotalTae: 0, 
      actualTotalTaePaid: 0, 
      compensationViable: '',
      repaymentStatus: response.deliveredKgs ===0 ? 'Nil' : 'Paid' 
    };
};