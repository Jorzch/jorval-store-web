import { AlertCircle, ArrowRight, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import type { Product } from "@/lib/types";
import { money } from "@/lib/utils";

export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900"
    >
      <div className="flex items-center gap-2 font-medium">
        <AlertCircle size={18} /> Something needs attention
      </div>
      <p className="mt-2 text-sm">
        {error instanceof Error ? error.message : "Please try again."}
      </p>
      {retry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function ProductImage({
  product,
  className = "",
  index = 0,
}: {
  product: Product;
  className?: string;
  index?: number;
}) {
  return (
    <div className={`product-image tone-${index % 4} ${className}`}>
      <Package
        className="image-placeholder"
        size={52}
        strokeWidth={1}
        aria-hidden="true"
      />
      {product.images[0] && (
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}
export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative overflow-hidden rounded-xl">
        <ProductImage product={product} index={index} />
        <span className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white text-foreground shadow-sm transition-transform group-hover:translate-x-1">
          <ArrowRight size={18} />
        </span>
        {product.stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="font-medium">{product.title}</h3>
        <span className="text-sm tabular-nums">{money(product.price)}</span>
      </div>
      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
        {product.description}
      </p>
    </Link>
  );
}
export function LoadingCards() {
  return (
    <div
      aria-label="Loading products"
      className="grid grid-cols-2 gap-5 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-xl bg-muted" />
          <div className="mt-4 h-4 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
