import {createContext, useContext, useState} from 'react';

const CartContext = createContext();

export function CartProvider({children}) {
  const [cartCount, setCartCount] = useState(0);

  return (
    <CartContext.Provider value={{cartCount, setCartCount}}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
