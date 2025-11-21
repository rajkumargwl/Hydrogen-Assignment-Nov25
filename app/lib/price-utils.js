

/**
 * @param {object} product 
 * @returns {object} 
 */
export function calculateCustomPrice(product) {
  if (!product) {
    return { customPrice: null, originalPrice: null, appliedDiscountType: null };
  }

  let originalPrice = null;
  let currencyCode = 'INR'; 
  let fixedAmount = 0;
  
  // --- 1. Extract and Parse Base Price ---
  const basePriceMetafieldValue = product.customPrice?.value; 
  
  if (basePriceMetafieldValue) {
    try {
      const parsedBasePriceObject = JSON.parse(basePriceMetafieldValue);
      
      originalPrice = parseFloat(parsedBasePriceObject.amount);
      currencyCode = parsedBasePriceObject.currency_code || currencyCode; 

    } catch (e) {
      console.error("Error parsing base price JSON string:", e);
    }
  }
  
  // If the base price is missing or invalid after parsing, exit gracefully
  if (isNaN(originalPrice) || originalPrice <= 0) {
     return { customPrice: null, originalPrice: null, appliedDiscountType: null };
  }

  let finalPrice = originalPrice;
  let appliedDiscountType = 'None';

  // --- 2. Extract and Parse Discount Values ---
  const percentageValue = parseFloat(product.discountPercentage?.value);
  
  // Fixed Discount Amount (Money type, needs parsing)
  const fixedAmountMetafieldValue = product.discountFixedAmount?.value;
  if (fixedAmountMetafieldValue) {
      try {
          const parsedFixedObject = JSON.parse(fixedAmountMetafieldValue);
          fixedAmount = parseFloat(parsedFixedObject.amount);
      } catch (e) {
          console.error("Error parsing fixed discount JSON string:", e);
      }
  }

  // --- 3. Implement Max Discount Logic ---
  let percentageSavings = 0;
  if (!isNaN(percentageValue) && percentageValue > 0) {
    percentageSavings = (originalPrice * percentageValue) / 100;
  }

  let fixedSavings = fixedAmount;

  if (percentageSavings >= fixedSavings) {
    if (percentageSavings > 0) {
      finalPrice = originalPrice - percentageSavings;
      appliedDiscountType = `${Math.round(percentageValue)}% OFF`;
    }
  } else { 
    finalPrice = originalPrice - fixedSavings;
    appliedDiscountType = `SAVED ${fixedSavings.toFixed(2)} ${currencyCode}`; 
  }

  finalPrice = Math.max(0, finalPrice);

  return {
    customPrice: finalPrice.toFixed(2),
    originalPrice: originalPrice.toFixed(2),
    appliedDiscountType,
  };
}