import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowRight, Check, LogOut, Package } from "lucide-react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/queries";
import { money } from "@/lib/utils";
import { ErrorState, ProductImage } from "@/components/shared";
import { Button } from "@/components/ui/button";
export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (session.isPending)
    return (
      <div className="page-width py-20" role="status">
        Checking your session…
      </div>
    );
  if (session.isError)
    return (
      <div className="page-width py-20">
        <ErrorState error={session.error} retry={() => session.refetch()} />
      </div>
    );
  if (!session.data)
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  return children;
}
export function AccountPage() {
  const session = useSession();
  const client = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    mutationFn: api.logout,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
      client.setQueryData(["session"], null);
      navigate("/");
    },
  });
  return (
    <RequireAuth>
      <section className="page-width max-w-3xl py-16">
        <p className="eyebrow mb-4">YOUR LITTLE CORNER</p>
        <h1 className="font-display text-4xl">Hello, {session.data?.name}.</h1>
        <p className="mt-4 text-muted-foreground">Good to have you here.</p>
        <div className="my-8 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">Email address</p>
          <p className="mt-1">{session.data?.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/orders">
              View your orders <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            variant="outline"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut size={16} />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </div>
        {logout.isError && (
          <div className="mt-5">
            <ErrorState error={logout.error} />
          </div>
        )}
      </section>
    </RequireAuth>
  );
}
export function OrdersPage() {
  return (
    <RequireAuth>
      <OrderList />
    </RequireAuth>
  );
}
function OrderList() {
  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.orders()).data,
  });
  const [params] = useSearchParams();
  const placed = params.get("placed");
  return (
    <section className="page-width max-w-4xl py-16">
      <p className="eyebrow mb-4">CHOSEN BY YOU</p>
      <h1 className="font-display text-4xl">Your orders.</h1>
      <p className="mb-8 mt-3 text-muted-foreground">
        Good finds, all in one place.
      </p>
      {placed && orders.data?.some((o) => o.id === placed) && (
        <div
          role="status"
          className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"
        >
          <Check size={20} /> Your order has been placed. Thank you for shopping
          with Jorval.
        </div>
      )}
      {orders.isPending ? (
        <p role="status">Loading your orders…</p>
      ) : orders.isError ? (
        <ErrorState error={orders.error} retry={() => orders.refetch()} />
      ) : !orders.data.length ? (
        <div className="empty-state rounded-xl border">
          <Package size={36} strokeWidth={1} />
          <h3>Your story starts here.</h3>
          <p>Your orders will appear here once you find something you love.</p>
          <Button asChild>
            <Link to="/">
              Explore the store <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.data.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-xl border"
            >
              <div className="flex flex-wrap justify-between gap-3 border-b bg-muted/50 p-5">
                <div>
                  <h2 className="text-sm font-medium">
                    Order{" "}
                    <span className="font-mono">
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.details.products.reduce((n, i) => n + i.quantity, 0)}{" "}
                    items
                  </p>
                </div>
                <p className="font-medium">{money(order.details.total)}</p>
              </div>
              <div className="divide-y px-5">
                {order.details.products.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <ProductImage
                      product={item.Product}
                      className="!w-16 shrink-0 rounded-lg"
                    />
                    <div className="flex-1">
                      <Link
                        to={`/products/${item.Product.slug}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {item.Product.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Qty {item.quantity} · {money(item.Product.price)} each
                      </p>
                    </div>
                    <span className="text-sm">
                      {money(item.quantity * item.Product.price)}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
