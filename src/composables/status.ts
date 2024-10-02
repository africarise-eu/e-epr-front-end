import { DefaultTheme } from "@/theme/LightTheme";

export enum STATUSENUM{
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    ENABLED = 'enabled',
    DISABLED = 'disabled',
    VERIFIED = 'verified',
    PAID = 'paid',
    NOT_PAID = 'notpaid',
    OVERDUE = 'overdue',
    IMPROVED = 'improved',
    DELAYED = 'delayed',
    NOTYETCLEARED = 'notyetcleared',
    CLEARED = 'cleared',
}
export const Status: {[key: string]: string} = {
    [STATUSENUM.PENDING]: 'status.pending',
    [STATUSENUM.APPROVED]: 'status.verified',
    [STATUSENUM.REJECTED]: 'status.rejected',
    [STATUSENUM.ENABLED]: 'status.enabled',
    [STATUSENUM.DISABLED]: 'status.disabled',
    [STATUSENUM.IMPROVED]: 'status.improved',
    [STATUSENUM.DELAYED]: 'status.delayed',
    [STATUSENUM.NOTYETCLEARED]: 'status.notyetcleared',
    [STATUSENUM.CLEARED]: 'status.cleared'
};
export const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case STATUSENUM.APPROVED:
      case STATUSENUM.PAID:
      case STATUSENUM.VERIFIED:
      case STATUSENUM.CLEARED:
        return DefaultTheme.colors.success;
      case STATUSENUM.REJECTED:
      case STATUSENUM.NOT_PAID:
      case STATUSENUM.OVERDUE:
      case 'notyetcleared':
        return DefaultTheme.colors.error;
      case STATUSENUM.PENDING:
      case STATUSENUM.IMPROVED:
      case STATUSENUM.DELAYED:
        return DefaultTheme.colors.warning;
      default:
        return '';
    }
  };