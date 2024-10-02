import { useApi } from '@/composables/useApi';
import { COMMON } from '@/composables/apiEndpoints';
import type {Country} from '@/composables/country';
import type {Port} from '@/composables/port';
import type {City} from '@/composables/city';

interface ApiResponse {
    count: number;
    rows: any[];
  }
  
async function getCountries(): Promise<Country[] | undefined> {
    try {
      const { useAPI } = useApi();
      const result = await useAPI<ApiResponse>(COMMON.COUNTRY, 'GET');
      
      if (result && result.data) {
        // Assuming result.data.rows contains the list of countries
        return result.data.rows.map((country: any) => ({
          id: country.id,
          name: country.name
        }));
      }
    } catch (error) {
      console.error('Failed to get countries:', error);
    }
  }

  async function getCities(countryId: number): Promise<City[] | undefined> {
    try {
      const { useAPI } = useApi();
      const result = await useAPI<ApiResponse>(`${COMMON.CITY}/${countryId}`, 'GET');
      
      if (result && result.data) {
        // Assuming result.data.rows contains the list of countries
        return result.data.rows.map((city: any) => ({
          id: city.id,
          name: city.name
        }));
      }
    } catch (error) {
      console.error('Failed to get cities:', error);
    }
  }

  async function getPorts(): Promise<Port[] | undefined> {
    try {
      const { useAPI } = useApi();
      const result = await useAPI<ApiResponse>(COMMON.PORTS, 'GET');
      
      if (result && result.data) {
        // Assuming result.data.rows contains the list of countries
        const ports = result.data.rows.map((port: any) => ({
          id: port.id,
          portname: port.portname
        }));

        const sortedPorts = ports.sort((a, b) => {
          if (a.id === 1) return -1; // `id` 1 should come first
          if (b.id === 1) return 1;  // `id` 1 should come first
          if (a.id === 2) return -1; // `id` 2 should come second
          if (b.id === 2) return 1;  // `id` 2 should come second
          return 0; // keep the original order for the rest
        });
  
        return sortedPorts;
      }
    } catch (error) {
      console.error('Failed to get cities:', error);
    }
  }

export { getCountries, getCities, getPorts };