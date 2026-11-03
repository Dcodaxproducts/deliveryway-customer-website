export const getCheckoutOrderTime = ({
  orderTime,
  preorderEnabled,
}: {
  orderTime: string | null | undefined;
  preorderEnabled: boolean;
}) => (preorderEnabled ? orderTime : null);

export const getCheckoutTipAmount = ({
  tipAmount,
  tipsEnabled,
}: {
  tipAmount: number;
  tipsEnabled: boolean;
}) => (tipsEnabled ? Math.max(0, tipAmount) : 0);
