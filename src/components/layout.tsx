import { ArrowUpRight, ShoppingBag, UserRound } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "./ui/button";
import { useCart, useSession } from "@/lib/queries";
import { useUI } from "@/stores/ui";
import { CartDrawer } from "./cart-drawer";
export function Layout() {
  const session = useSession();
  const cart = useCart();
  const setCartOpen = useUI((s) => s.setCartOpen);
  const count =
    cart.data?.CartItems.reduce((n, item) => n + item.quantity, 0) || 0;
  return (
    <>
      <div className="announcement">
        A little more considered. A little more you.{" "}
        <span>
          Discover Jorval <ArrowUpRight size={12} />
        </span>
      </div>
      <header className="site-header">
        <div className="page-width flex h-22 items-center justify-between gap-4">
          <Link to="/" className="wordmark" aria-label="Jorval home">
            jorval<span>®</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex items-center gap-5 sm:gap-8"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              The store
            </NavLink>
            <NavLink to="/orders" className="nav-link hidden sm:block">
              Your orders
            </NavLink>
          </nav>
          <div className="flex gap-1">
            <Button asChild variant="ghost" size="icon">
              <Link
                to={session.data ? "/account" : "/login"}
                aria-label={session.data ? "Your account" : "Sign in"}
              >
                <UserRound size={20} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="relative"
              size="icon"
              onClick={() => setCartOpen(true)}
              aria-label={`Open bag, ${count} items`}
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] text-white">
                  {count}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="page-width footer">
        <div>
          <Link to="/" className="wordmark">
            jorval<span>®</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            Good things. Everyday living.
          </p>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/">Explore the store</Link>
          <Link to="/orders">Your orders</Link>
          <Link to="/account">Account</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Jorval Store
        </p>
      </footer>
      <CartDrawer />
    </>
  );
}
