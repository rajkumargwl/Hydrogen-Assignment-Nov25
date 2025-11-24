export interface QuickViewConfig {
  enabled: boolean;
  buttonText: string;
  buttonPlacement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  popupConfig: {
    elementOrder: string[];
    typography: {
      titleSize: string;
      priceSize: string;
    };
  };
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    id: string;
    altText?: string;
    url: string;
    width: number;
    height: number;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    nodes: Array<{
      id: string;
      availableForSale: boolean;
      price: {
        amount: string;
        currencyCode: string;
      };
      compareAtPrice?: {
        amount: string;
        currencyCode: string;
      };
      selectedOptions: Array<{
        name: string;
        value: string;
      }>;
      image?: {
        url: string;
        altText?: string;
      };
    }>;
  };
  options: Array<{
    name: string;
    values: string[];
  }>;
  images: {
    nodes: Array<{
      url: string;
      altText?: string;
    }>;
  };
  description?: string;
}

export interface QuickViewPopupConfig {
  elementOrder: string[];
  typography: {
    titleSize: string;
    priceSize: string;
  };
}