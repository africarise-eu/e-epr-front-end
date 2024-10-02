import { defineStore } from 'pinia';

export const useFilterStore = defineStore('filterStore', {
  state: () => ({
    search: localStorage.getItem('filter-search') || '',
    selectedStatuses: JSON.parse(localStorage.getItem('filter-selectedStatuses') || '[]'),
    companyId: Number(localStorage.getItem('filter-companyId') || 0),
  }),
  actions: {
    setSearch(query: string) {
      this.search = query;
      localStorage.setItem('filter-search', query);
    },
    setSelectedStatuses(statuses: string[]) {
      this.selectedStatuses = statuses;
      localStorage.setItem('filter-selectedStatuses', JSON.stringify(statuses));
    },
    setSelectedCompany(companyId: number) {
      this.companyId = companyId;
      localStorage.setItem('filter-companyId', companyId.toString());
    },
    clearFIlters()
    {
      this.search = '';
      this.selectedStatuses = [];
      this.companyId = 0;

      localStorage.removeItem('filter-search');
      localStorage.removeItem('filter-selectedStatuses');
      localStorage.removeItem('filter-companyId');
    }
  },
});