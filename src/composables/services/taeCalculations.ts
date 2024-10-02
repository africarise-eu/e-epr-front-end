function calculateTotalTae(weightInGrams : any, taeKg: any) {
    if (weightInGrams != null && taeKg != null) {
      return parseFloat((weightInGrams * (taeKg) / 1000).toFixed(2));
    }
    return 0;
}

export { calculateTotalTae };