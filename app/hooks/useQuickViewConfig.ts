// /home/gwl/Hydrogen-Friday/metaobject/hydrogen-storefront/app/hooks/useQuickViewConfig.ts
export function useQuickViewConfig() {
  const parseMetaobjectConfig = (metaobjectNodes: any) => {
    console.log('🔍 [useQuickViewConfig] RAW METAOBJECT NODES:', metaobjectNodes);

   
    if (!metaobjectNodes || 
        (!metaobjectNodes.nodes && !metaobjectNodes.length) || 
        (metaobjectNodes.nodes && metaobjectNodes.nodes.length === 0) ||
        (Array.isArray(metaobjectNodes) && metaobjectNodes.length === 0)) {
      console.log('❌ No metaobject found, using default config');
      return getDefaultConfig();
    }

    // Handle different data structures
    let configNode;
    if (metaobjectNodes.nodes && metaobjectNodes.nodes.length > 0) {
      configNode = metaobjectNodes.nodes[0];
    } else if (Array.isArray(metaobjectNodes) && metaobjectNodes.length > 0) {
      configNode = metaobjectNodes[0];
    } else {
      console.log('❌ Invalid metaobject structure, using default config');
      return getDefaultConfig();
    }

    const fields = configNode.fields || [];
    
    console.log('🔍 [useQuickViewConfig] ALL FIELDS:', fields);

    // Parse individual fields
    const config = {
      enabled: getFieldValue(fields, 'enabled') === 'true',
      buttonText: getFieldValue(fields, 'button_text') || 'Quick View',
      buttonPlacement: getFieldValue(fields, 'button_placement') || 'bottom-right',
      
      // ✅ Color Settings
      colors: {
        backgroundColor: getFieldValue(fields, 'background_color') || '#ffffff',
        textColor: getFieldValue(fields, 'text_color') || '#000000',
        buttonColor: getFieldValue(fields, 'button_color') || '#000000',
        buttonHoverColor: getFieldValue(fields, 'button_hover_color') || '#333333',
      },
      
      // Popup Config
      popupConfig: {
        elementOrder: parseJSONField(fields, 'popup_element_order') || ['image', 'title', 'price', 'variants', 'addToCart'],
        typography: parseJSONField(fields, 'typography_settings') || {
          titleSize: 'text-2xl',
          priceSize: 'text-xl'
        }
      }
    };

    const validPlacements = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
    if (!validPlacements.includes(config.buttonPlacement)) {
      console.warn(`Invalid button placement: ${config.buttonPlacement}. Using default: bottom-right`);
      config.buttonPlacement = 'bottom-right';
    }

    console.log('✅ [useQuickViewConfig] FINAL CONFIG:', config);
    return config;
  };

  const getFieldValue = (fields: any[], key: string) => {
    const field = fields.find((f: any) => f.key === key);
    return field?.value || null;
  };

  const parseJSONField = (fields: any[], key: string) => {
    const value = getFieldValue(fields, key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error(`Error parsing ${key}:`, e);
      return null;
    }
  };

  const getDefaultConfig = () => ({
    enabled: true,
    buttonText: 'Quick View',
    buttonPlacement: 'bottom-right',
    colors: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#000000',
      buttonHoverColor: '#333333',
    },
    popupConfig: {
      elementOrder: ['image', 'title', 'price', 'variants', 'addToCart'],
      typography: {
        titleSize: 'text-2xl',
        priceSize: 'text-xl'
      }
    }
  });

  return {
    parseMetaobjectConfig,
    getDefaultConfig
  };
}