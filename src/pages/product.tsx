import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useCart, useCartChange, useSession } from "@/lib/queries";
import { money } from "@/lib/utils";
import { useUI } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { ErrorState, ProductImage } from "@/components/shared";
export function ProductPage() {
  const { slug = "" } = useParams();
  const product = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.product(slug)).data,
  });
  const session = useSession();
  const cart = useCart();
  const change = useCartChange();
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const setCartOpen = useUI((s) => s.setCartOpen);
  const navigate = useNavigate();
  if (product.isPending)
    return (
      <div className="page-width py-16 animate-pulse">
        <div className="h-96 rounded-xl bg-muted" />
      </div>
    );
  if (product.isError)
    return (
      <div className="page-width py-16">
        <ErrorState error={product.error} retry={() => product.refetch()} />
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/">Back to store</Link>
        </Button>
      </div>
    );
  const p = product.data;
  const inCart =
    cart.data?.CartItems.find((i) => i.Product.id === p.id)?.quantity || 0;
  const available = Math.max(0, p.stock - inCart);
  return (
    <section className="page-width py-10 sm:py-16">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} /> Back to the collection
      </Link>
      <div className="grid items-start gap-10 md:grid-cols-2 lg:gap-20">
        <div>
          <ProductImage
            product={{
              ...p,
              images: p.images[imageIndex] ? [p.images[imageIndex]] : [],
            }}
            className="rounded-2xl"
          />
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-auto">
              {p.images.map((src, i) => (
                <button
                  key={src + i}
                  className={`w-20 shrink-0 overflow-hidden rounded-lg border-2 ${imageIndex === i ? "border-primary" : "border-transparent"}`}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={imageIndex === i}
                >
                  <ProductImage product={{ ...p, images: [src] }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="py-4">
          <p className="eyebrow mb-5">A GOOD FIND</p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            {p.title}
          </h1>
          <p className="mt-5 text-2xl">{money(p.price)}</p>
          <p className="my-8 leading-relaxed text-muted-foreground">
            {p.description}
          </p>
          <div className="mb-5 flex items-center gap-2 text-sm">
            <span
              className={`size-2 rounded-full ${p.stock > 0 ? "bg-emerald-600" : "bg-neutral-400"}`}
            />
            {p.stock > 0 ? `${p.stock} in stock` : "Currently sold out"}
          </div>
          <div className="flex gap-3">
            <div className="flex h-11 items-center gap-2 rounded-full border px-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Decrease quantity"
                disabled={quantity <= 1 || change.isPending}
                onClick={() => setQuantity(quantity - 1)}
              >
                <Minus size={15} />
              </Button>
              <span className="min-w-4 text-center text-sm">{quantity}</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Increase quantity"
                disabled={quantity >= available || change.isPending}
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus size={15} />
              </Button>
            </div>
            <Button
              className="flex-1"
              disabled={
                p.stock === 0 ||
                available < quantity ||
                change.isPending ||
                session.isPending ||
                session.isError ||
                (!!session.data && (cart.isPending || cart.isError))
              }
              onClick={() => {
                if (!session.data) {
                  navigate(
                    `/login?redirect=${encodeURIComponent(`/products/${slug}`)}`,
                  );
                  return;
                }
                change.mutate(
                  { action: "add", slug, quantity },
                  { onSuccess: () => setCartOpen(true) },
                );
              }}
            >
              {change.isPending
                ? "Adding…"
                : p.stock === 0
                  ? "Sold out"
                  : available === 0
                    ? "All available items in bag"
                    : session.data
                      ? "Add to bag"
                      : "Sign in to add"}
              <ArrowRight size={16} />
            </Button>
          </div>
          {available > 0 && quantity > available && (
            <p role="status" className="mt-3 text-sm">
              Only {available} more available. Reduce the quantity to continue.
            </p>
          )}
          {session.isError && (
            <div className="mt-4">
              <ErrorState
                error={session.error}
                retry={() => session.refetch()}
              />
            </div>
          )}
          {cart.isError && session.data && (
            <div className="mt-4">
              <ErrorState error={cart.error} retry={() => cart.refetch()} />
            </div>
          )}
          {change.isError && (
            <div className="mt-4">
              <ErrorState error={change.error} />
            </div>
          )}
          {change.isSuccess && (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 text-sm text-emerald-700"
            >
              <Check size={16} /> Added to your bag.
            </p>
          )}
          <div className="mt-10 border-t pt-5 text-sm text-muted-foreground">
            A little intention. An everyday kind of joy.
          </div>
        </div>
      </div>
    </section>
  );
}
