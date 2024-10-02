
import { reactive } from 'vue';

export default interface endDestinationDto {
    id: number;
    orgName: string;
    orgType: string | null;
    companyRegNo: string;
    companyId: number;
    companyName: string;
    phone: string;
    email: string;
    contactPerson: string;
    address: string;
    cityName: string;
    city: number | null;
    countryName: string;
    country: number | null;
    status: string;
    rejectedReason: string;
    createdAt: string;
}