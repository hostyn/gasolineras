import * as Select from "@radix-ui/react-select";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../services/backend";
import { queryClient } from "../store/queryClient";
import type { Product } from "@repo/database";
import type { ProductsResponse } from "../pages/api/products";
import { useStore } from "@nanostores/react";
import { $product } from "../store/product";
import { ChevronDownIcon, StarIcon } from "./icons";

const STARRED_PRODUCTS = ["Gasoleo A", "Gasolina 95 E5", "Gasolina 98 E5"];

const GROUPS: { type: Product; label: string }[] = [
  { type: "diesel", label: "Diesel" },
  { type: "gasoline", label: "Gasolina" },
  { type: "other", label: "Otros" },
];

export const ProductSelect = () => {
  const selectedProduct = useStore($product);

  const { data: products } = useQuery(
    {
      queryKey: ["products"],
      queryFn: getProducts,
    },
    queryClient
  );

  const groupedProducts = products?.reduce(
    (acc, product) => {
      acc[product.type] = acc[product.type] || [];
      acc[product.type].push(product);
      return acc;
    },
    {} as Record<Product, ProductsResponse>
  );

  return (
    <Select.Root
      value={selectedProduct.toString()}
      onValueChange={(value) => $product.set(Number(value))}
    >
      <Select.Trigger className="flex py-2 px-4 items-center justify-between rounded bg-gray-50 text-slate-800 hover:bg-gray-50 w-full">
        <Select.Value placeholder="Selecciona un producto" />
        <Select.Icon className="size-6 fill-slate-800">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          align="start"
          className="overflow-hidden p-4 z-50 rounded-md bg-white w-[var(--radix-popper-anchor-width)] shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]"
        >
          <Select.Viewport>
            {GROUPS.map((group) => (
              <Select.Group key={group.type} className="mb-2">
                <Select.Label className="text-sm tracking-tight font-semibold text-slate-600">
                  {group.label}
                </Select.Label>
                {groupedProducts?.[group.type]?.map((product) => (
                  <SelectItem value={product.id.toString()}>
                    <span className="flex items-center gap-1">
                      {product.name}
                      {STARRED_PRODUCTS.includes(product.name) && (
                        <StarIcon className="size-4 fill-amber-400" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </Select.Group>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

const SelectItem: React.FC<React.PropsWithChildren<{ value: string }>> = ({
  children,
  ...props
}) => {
  return (
    <Select.Item
      className="cursor-pointer text-slate-800 p-2 rounded relative flex select-none items-center data-[disabled]:pointer-events-none data-[highlighted]:bg-slate-100 data-[highlighted]:outline-none"
      {...props}
    >
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
};
