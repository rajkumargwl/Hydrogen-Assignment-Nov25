// // Virtual entry point for the app
// import {storefrontRedirect} from '@shopify/hydrogen';
// import {createRequestHandler} from '@shopify/hydrogen/oxygen';
// import {createHydrogenRouterContext} from '~/lib/context';

// /**
//  * Export a fetch handler in module format.
//  */
// export default {
//   /**
//    * @param {Request} request
//    * @param {Env} env
//    * @param {ExecutionContext} executionContext
//    * @return {Promise<Response>}
//    */
//   async fetch(request, env, executionContext) {
//     try {
//       const hydrogenContext = await createHydrogenRouterContext(
//         request,
//         env,
//         executionContext,
//       );

//       /**
//        * Create a Remix request handler and pass
//        * Hydrogen's Storefront client to the loader context.
//        */
//       const handleRequest = createRequestHandler({
//         // eslint-disable-next-line import/no-unresolved
//         build: await import('virtual:react-router/server-build'),
//         mode: process.env.NODE_ENV,
//         getLoadContext: () => hydrogenContext,
//       });

//       const response = await handleRequest(request);

//       if (hydrogenContext.session.isPending) {
//         response.headers.set(
//           'Set-Cookie',
//           await hydrogenContext.session.commit(),
//         );
//       }

//       if (response.status === 404) {
//         /**
//          * Check for redirects only when there's a 404 from the app.
//          * If the redirect doesn't exist, then `storefrontRedirect`
//          * will pass through the 404 response.
//          */
//         return storefrontRedirect({
//           request,
//           response,
//           storefront: hydrogenContext.storefront,
//         });
//       }

//       return response;
//     } catch (error) {
//       console.error(error);
//       return new Response('An unexpected error occurred', {status: 500});
//     }
//   },
// };


// Virtual entry point for the app
import {storefrontRedirect} from '@shopify/hydrogen';
import {createRequestHandler} from '@shopify/hydrogen/oxygen';
import {createHydrogenRouterContext} from '~/lib/context';
// 🚨 Import the Admin client function
import {shopifyAdminClient} from './app/lib/shopifyAdminClient';

/**
 * Export a fetch handler in module format.
 */
export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} executionContext
   * @return {Promise<Response>}
   */
  async fetch(request, env, executionContext) {
    try {
      // 1. Create the initial context (Storefront, Cart, Session)
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      // 2. 🚨 CRITICAL: Initialize and inject the Admin Client
      // The credentials must be available on the environment (env) object.
      const storeDomain = env.PUBLIC_STORE_DOMAIN || env.SHOPIFY_SHOP_DOMAIN;
      const accessToken = env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
      const apiVersion = env.SHOPIFY_ADMIN_API_VERSION;

      // Attach the Admin Client to the context
      hydrogenContext.admin = shopifyAdminClient({
        storeDomain,
        accessToken,
        apiVersion,
      });

      // console.log("ADMIN CONTEXT INITIALIZED:", !!hydrogenContext.admin);
      // You should see 'true' in your worker logs now.


      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client and now the Admin client to the loader context.
       */
      const handleRequest = createRequestHandler({
        // eslint-disable-next-line import/no-unresolved
        build: await import('virtual:react-router/server-build'),
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};