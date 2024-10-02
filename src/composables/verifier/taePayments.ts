export default interface taePaymentDto {
    companyName: string;
    paymentType: string;
    createdAt: Date | string; 
    total_value: number;      
    payStatus: string;         
    pendingTAE: number;       
    deadline: Date | string;   
    remindOwner: boolean;    
  }