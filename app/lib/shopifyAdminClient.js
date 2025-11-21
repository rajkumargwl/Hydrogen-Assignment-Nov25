
import {createAdminApiClient} from '@shopify/admin-api-client';

export function shopifyAdminClient({accessToken, apiVersion, storeDomain}) {
  return createAdminApiClient({
    storeDomain,
    apiVersion,
    accessToken,   
  });
}
