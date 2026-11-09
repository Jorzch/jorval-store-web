import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Layout } from "./components/layout";
import { Catalog } from "./pages/catalog";
import { Button } from "./components/ui/button";
const ProductPage = lazy(() =>
  import("./pages/product").then((m) => ({ default: m.ProductPage })),
);
const AuthPage = lazy(() =>
  import("./pages/auth").then((m) => ({ default: m.AuthPage })),
);
const AccountPage = lazy(() =>
  import("./pages/account").then((m) => ({ default: m.AccountPage })),
);
const OrdersPage = lazy(() =>
  import("./pages/account").then((m) => ({ default: m.OrdersPage })),
);
function RouteContent() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <Suspense
      fallback={
        <div className="page-width py-20" role="status">
          Loading…
        </div>
      }
    >
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Catalog />} />
          <Route
            path="products/:slug"
            element={<ProductPage key={pathname} />}
          />
          <Route path="login" element={<AuthPage key="login" />} />
          <Route path="signup" element={<AuthPage key="signup" signup />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route
            path="*"
            element={
              <div className="page-width empty-state">
                <h1 className="font-display text-4xl">
                  A little off the beaten path.
                </h1>
                <p>We couldn’t find that page.</p>
                <Button asChild>
                  <Link to="/">Back to the store</Link>
                </Button>
              </div>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <RouteContent />
    </BrowserRouter>
  );
}
