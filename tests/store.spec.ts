import { expect, test, type Page } from "@playwright/test";
const product = {
  id: "p1",
  slug: "everyday-vase",
  title: "Everyday vase",
  description: "A considered ceramic vase for everyday living.",
  price: 34,
  stock: 3,
  images: [],
};
const category = { id: "ed03c638-cba2-46b9-91e3-63652cb4e50c", name: "Home" };
async function mockStore(page: Page) {
  let signedIn = false;
  let quantity = 0;
  const orders: unknown[] = [];
  const requests: { path: string; body: unknown }[] = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api", "");
    const body = request.postDataJSON();
    requests.push({ path: path + url.search, body });
    const ok = (data?: unknown, pagination?: unknown) =>
      route.fulfill({ json: { status: "success", data, pagination } });
    if (path === "/auth/me")
      return signedIn
        ? ok({
            user: {
              id: "u1",
              name: "Alex",
              email: "alex@example.com",
              role: "USER",
            },
          })
        : route.fulfill({
            status: 401,
            json: { status: "error", message: "Unauthorized" },
          });
    if (path === "/auth/login" || path === "/auth/signup") {
      signedIn = true;
      return ok({
        user: {
          id: "u1",
          name: "Alex",
          email: "alex@example.com",
          role: "USER",
        },
      });
    }
    if (path === "/auth/logout") {
      signedIn = false;
      return ok();
    }
    if (path === "/products")
      return ok(url.searchParams.get("search") === "missing" ? [] : [product], {
        page: Number(url.searchParams.get("page") || 1),
        total: 2,
      });
    if (path === "/categories") return ok([category]);
    if (path === "/products/everyday-vase") return ok(product);
    if (path === "/cart")
      return ok({
        id: "c1",
        CartItems: quantity ? [{ id: "i1", quantity, Product: product }] : [],
      });
    if (path === "/cart/add") {
      if (body.quantity + quantity > product.stock)
        return route.fulfill({
          status: 400,
          json: { message: "Not enough stock" },
        });
      quantity += body.quantity;
      return ok();
    }
    if (path === "/cart/remove") {
      quantity = Math.max(0, quantity - body.quantity);
      return ok();
    }
    if (path === "/cart/checkout") {
      const order = {
        id: "order-12345678",
        details: {
          total: quantity * product.price,
          products: [{ id: "i1", quantity, Product: product }],
        },
      };
      orders.push(order);
      quantity = 0;
      return ok(order);
    }
    if (path === "/orders") return ok(orders);
    return route.fulfill({ status: 404, json: { message: "Not found" } });
  });
  return requests;
}
test("catalog sends search, category, and pagination to the API and handles no results", async ({
  page,
}) => {
  const requests = await mockStore(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Everyday vase/ })).toBeVisible();
  await page.getByRole("button", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/category=/);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=2/);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("textbox", { name: "Search products" }).fill("missing");
  await page
    .getByRole("button", { name: "Search", exact: true })
    .last()
    .click();
  await expect(page.getByText("No finds just yet.")).toBeVisible();
  expect(
    requests.some((r) => r.path.includes("category=" + category.id)),
  ).toBeTruthy();
  expect(requests.some((r) => r.path.includes("page=2"))).toBeTruthy();
  expect(requests.some((r) => r.path.includes("search=missing"))).toBeTruthy();
  await page.getByRole("button", { name: "View all finds" }).click();
  await expect(page.getByRole("link", { name: /Everyday vase/ })).toBeVisible();
});
test("sign-in, stock limits, cart removal, confirmed checkout, order history, and sign-out", async ({
  page,
}) => {
  const requests = await mockStore(page);
  await page.goto("/products/everyday-vase");
  await page.getByRole("button", { name: "Sign in to add" }).click();
  await page.getByLabel("Email", { exact: true }).fill("alex@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/products\/everyday-vase/);
  await page.getByRole("button", { name: "Add to bag" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Add one Everyday vase" }).click();
  await page.getByRole("button", { name: "Add one Everyday vase" }).click();
  await expect(
    page.getByRole("button", { name: "Add one Everyday vase" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Remove one Everyday vase" }).click();
  await expect(dialog.getByText("$68.00")).toBeVisible();
  await page.getByRole("button", { name: "Review order" }).click();
  expect(requests.some((r) => r.path === "/cart/checkout")).toBeFalsy();
  await page.getByRole("button", { name: "Confirm & place order" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your order has been placed",
  );
  await expect(page.getByText("$68.00").first()).toBeVisible();
  await page.getByRole("button", { name: "Open bag, 0 items" }).click();
  await expect(page.getByText("Room for something good.")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("link", { name: "Your account", exact: true }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.goto("/orders");
  await expect(page).toHaveURL(/login\?redirect=/);
});
test("mobile layout fits viewport and API errors can be retried", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockStore(page);
  await page.route("**/api/products?**", (route) =>
    route.fulfill({
      status: 503,
      json: { message: "Store temporarily unavailable" },
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Store temporarily unavailable",
  );
  await page.unroute("**/api/products?**");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("link", { name: /Everyday vase/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/mobile-catalog.png",
    fullPage: true,
  });
});

test('sign-up validates fields and submits the API contract', async ({ page }) => {
  const requests = await mockStore(page);
  await page.goto('/signup');
  await page.getByLabel('Name', { exact: true }).fill('Al');
  await page.getByLabel('Email', { exact: true }).fill('alex@example.com');
  await page.getByLabel('Password', { exact: true }).fill('123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByText('Use at least 3 characters.')).toBeVisible();
  await expect(page.getByText('Use at least 6 characters.')).toBeVisible();
  expect(requests.some((r) => r.path === '/auth/signup')).toBeFalsy();
  await page.getByLabel('Name', { exact: true }).fill('Alex');
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hello, Alex.' })).toBeVisible();
  expect(requests.find((r) => r.path === '/auth/signup')?.body).toEqual({ name: 'Alex', email: 'alex@example.com', password: 'password123' });
});
