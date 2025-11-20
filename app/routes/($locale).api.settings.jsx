import {
  getSelectedProductOptions
} from '@shopify/hydrogen';
export async function loader({params, context, request}) {
    const SETTINGS_QUERY = `#graphql
    query GetQuickViewSettings {
  
  metaobject(handle:  {
     handle: "settings",
     type: "quick_view_settings"
  }) {
    enable_quick_view: field(key :"enable_quick_view") {
      value
    }
    button_position: field(key: "button_position") {
      value
    }
    title_font_size_desktop: field(key: "title_font_size_desktop") {
      value
    }
    title_font_size_mobile: field(key: "title_font_size_mobile") {
      value
    }
    price_font_size_desktop: field(key: "price_font_size_desktop") {
      value
    }
    price_font_size_mobile: field(key: "price_font_size_mobile") {
      value
    }
    button_font_size_desktop: field(key: "button_font_size_desktop") {
      value
    }
    button_font_size_mobile: field(key: "button_font_size_mobile") {
      value
    }
    element_order: field(key: "element_order") {
      value
    }
  }
}
`;

  const data = await context.storefront.query(
    SETTINGS_QUERY);

      let settings = {};
      let metaobjectsData = data.metaobject;

      // Flatten the metaobject fields into a simple settings object
      Object.keys(data.metaobject).forEach((key) => {
        settings[key] = metaobjectsData[key].value;
      });

  return {
    settings
  };
}