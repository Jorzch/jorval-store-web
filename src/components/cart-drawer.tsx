import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ErrorState, ProductImage } from "./shared";
import { useUI } from "@/stores/ui";
import { useCart, useCartChange, useSession } from "@/lib/queries";
import { api } from "@/lib/api";
import { cartTotal, money } from "@/lib/utils";
export function CartDrawer() {
  const { cartOpen, setCartOpen } = useUI();
  const session = useSession();
  const cart = useCart();
  const change = useCartChange();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const checkout = useMutation({
    mutationFn: api.checkout,
    onSuccess: async (response) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["cart"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["products"] }),
        client.invalidateQueries({ queryKey: ["product"] }),
      ]);
      setCartOpen(false);
      setConfirm(false);
      navigate(`/orders?placed=${encodeURIComponent(response.data.id)}`);
    },
  });
  const items = cart.data?.CartItems || [];
  const busy = change.isPending || checkout.isPending;
  return (
    <Dialog
      open={cartOpen}
      onOpenChange={(open) => {
        if (!checkout.isPending) {
          setCartOpen(open);
          setConfirm(false);
          checkout.reset();
          change.reset();
        }
      }}
    >
      <DialogContent>
        <DialogTitle className="font-display text-3xl">
          Your bag
          <span className="ml-2 text-base text-muted-foreground">
            ({items.reduce((n, i) => n + i.quantity, 0)})
          </span>
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-muted-foreground">
          A few good things, chosen by you.
        </DialogDescription>
        <div className="mt-6 flex-1 overflow-y-auto">
          {session.isPending ? (
            <p>Checking your session…</p>
          ) : session.isError ? (
            <ErrorState error={session.error} retry={() => session.refetch()} />
          ) : !session.data ? (
            <div className="empty-state">
              <ShoppingBag size={36} strokeWidth={1} />
              <h3>Make yourself at home.</h3>
              <p>Sign in to add your favorites to your bag.</p>
              <Button asChild>
                <Link to="/login" onClick={() => setCartOpen(false)}>
                  Sign in <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          ) : cart.isPending ? (
            <p>Loading your bag…</p>
          ) : cart.isError ? (
            <ErrorState error={cart.error} retry={() => cart.refetch()} />
          ) : items.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={36} strokeWidth={1} />
              <h3>Room for something good.</h3>
              <p>Your bag is empty. Let’s find your next favorite.</p>
              <Button
                onClick={() => {
                  setCartOpen(false);
                  navigate("/");
                }}
              >
                Explore the store
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b py-5">
                <ProductImage
                  product={item.Product}
                  className="!aspect-square !w-24 shrink-0 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/products/${item.Product.slug}`}
                    onClick={() => setCartOpen(false)}
                    className="font-medium"
                  >
                    {item.Product.title}
                  </Link>
                  <p className="mt-1 text-sm">{money(item.Product.price)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="!size-8"
                      aria-label={`Remove one ${item.Product.title}`}
                      disabled={busy}
                      onClick={() => {
                        setConfirm(false);
                        change.mutate({
                          action: "remove",
                          slug: item.Product.slug,
                          quantity: 1,
                        });
                      }}
                    >
                      <Minus size={13} />
                    </Button>
                    <span className="text-sm">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="!size-8"
                      aria-label={`Add one ${item.Product.title}`}
                      disabled={busy || item.quantity >= item.Product.stock}
                      onClick={() => {
                        setConfirm(false);
                        change.mutate({
                          action: "add",
                          slug: item.Product.slug,
                          quantity: 1,
                        });
                      }}
                    >
                      <Plus size={13} />
                    </Button>
                    <Button
                      className="ml-auto !size-8"
                      variant="ghost"
                      size="icon"
                      disabled={busy}
                      aria-label={`Remove ${item.Product.title} from bag`}
                      onClick={() => {
                        setConfirm(false);
                        change.mutate({
                          action: "remove",
                          slug: item.Product.slug,
                          quantity: item.quantity,
                        });
                      }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {change.isError && <ErrorState error={change.error} />}
        {checkout.isError && <ErrorState error={checkout.error} />}
        {session.data && items.length > 0 && !cart.isError && (
          <div className="mt-4 border-t pt-5">
            <div className="flex justify-between text-lg font-medium">
              <span>Total</span>
              <span>{money(cartTotal(items))}</span>
            </div>
            <p className="my-3 text-xs leading-relaxed text-muted-foreground">
              {confirm
                ? "Ready? Confirming will place your order and empty your bag."
                : "Review your items before placing your order. No payment is collected here."}
            </p>
            <Button
              className="w-full"
              disabled={busy || cart.isFetching}
              onClick={() => (confirm ? checkout.mutate() : setConfirm(true))}
            >
              {checkout.isPending
                ? "Placing order…"
                : confirm
                  ? "Confirm & place order"
                  : "Review order"}
              <ArrowRight size={16} />
            </Button>
            {confirm && (
              <Button
                variant="ghost"
                className="mt-2 w-full"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Continue editing
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
