import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockData } = await api.get<Stock>(`/stock/${productId}`);


      if (stockData.amount > 0) {

        const result = [...cart];

        const foundIndex = result.findIndex(item => item.id === productId);

        if (foundIndex !== -1) {
          const currentItem = result[foundIndex];

          result[foundIndex] = { ...currentItem, amount: currentItem.amount + 1 }
        } else {
          const { data: productData } = await api.get<Product>(`/product/${productId}`);

          result.push(productData);
        }

        setCart(result);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(item => item.id === productId));

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get(`/stock/${productId}`);

      if (amount <= data.amount) {
        if (amount > 0) {
          setCart(cart.map(item => item.id === productId ? { ...item, amount: amount } : item));

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        } else {
          return
        }
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
