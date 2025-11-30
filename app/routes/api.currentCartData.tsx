import type { Route } from "../+types/root";

export async function loader({ context }: Route.LoaderArgs) {
  let currentCart = await context.cart.get();
  if (!currentCart?.id) {
    return null;
  } else {
    return currentCart;
  }
}