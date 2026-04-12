export const formatCurrency = (amountPence) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(amountPence / 100);
