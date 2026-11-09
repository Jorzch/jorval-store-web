import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  ArrowDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState, LoadingCards, ProductCard } from "@/components/shared";
export function Catalog() {
  const [params, setParams] = useSearchParams();
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const form = useForm<{ search: string }>({ values: { search } });
  const products = useQuery({
    queryKey: ["products", { search, category, page }],
    queryFn: () => api.products({ search, category, page }),
    placeholderData: keepPreviousData,
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.categories()).data,
  });
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  return (
    <>
      <section className="page-width hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> THE EVERYDAY, ELEVATED
          </p>
          <h1>
            Good things.
            <br />
            Better <em>everydays.</em>
          </h1>
          <p className="hero-description">
            Find the pieces that feel like you. Discover a thoughtful collection
            for the way you live.
          </p>
          <Button asChild className="mt-7">
            <a href="#collection">
              Find your next favorite <ArrowDown size={16} />
            </a>
          </Button>
          <div className="hero-note">
            <span className="tiny-star" aria-hidden="true">✳</span>
            <span>A little intention goes a long way.</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="art-orbit" />
          <div className="art-vase">
            <div className="vase-neck" />
            <div className="vase-body" />
          </div>
          <div className="art-ball" />
          <div className="art-plinth" />
          <span className="art-label">
            Objects of
            <br />
            <em>everyday affection.</em>
          </span>
          <span className="art-corner">
            THE JORVAL EDIT <ArrowUpRight size={18} />
          </span>
        </div>
      </section>
      <div className="values-strip">
        <div className="page-width">
          <span>Less ordinary. More you.</span>
          <span>Thoughtful finds</span>
          <span>Everyday favorites</span>
          <span>A fresh perspective</span>
        </div>
      </div>
      <section id="collection" className="page-width collection">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3">THE COLLECTION</p>
            <h2>Meet your next favorite.</h2>
          </div>
          <p className="max-w-64 text-sm leading-relaxed text-muted-foreground">
            Explore the collection. Make it your own.
          </p>
        </div>
        <div className="catalog-toolbar">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={!category ? "default" : "ghost"}
              onClick={() => update("category", "")}
            >
              All finds
            </Button>
            {categories.data?.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={category === c.id ? "default" : "ghost"}
                onClick={() => update("category", c.id)}
              >
                {c.name}
              </Button>
            ))}
          </div>
          <Button
            className="shrink-0"
            size="sm"
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={14} /> Search
          </Button>
        </div>
        {categories.isError && (
          <div className="mb-4">
            <ErrorState
              error={categories.error}
              retry={() => categories.refetch()}
            />
          </div>
        )}
        {(filtersOpen || search) && (
          <form
            className="mb-6 flex max-w-lg gap-2"
            onSubmit={form.handleSubmit((data) =>
              update("search", data.search.trim()),
            )}
          >
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3.5 text-muted-foreground"
                size={16}
              />
              <Input
                aria-label="Search products"
                placeholder="Find something good…"
                className="pl-10"
                {...form.register("search")}
              />
            </div>
            <Button type="submit">Search</Button>
            {search && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => update("search", "")}
              >
                <X size={18} />
              </Button>
            )}
          </form>
        )}
        {search && (
          <p className="mb-5 text-sm text-muted-foreground">
            Results for “{search}”
          </p>
        )}
        {products.isPending ? (
          <LoadingCards />
        ) : products.isError ? (
          <ErrorState error={products.error} retry={() => products.refetch()} />
        ) : products.data.data.length === 0 ? (
          <div className="empty-state border border-dashed">
            <Search size={32} strokeWidth={1} />
            <h3>
              {search || category
                ? "No finds just yet."
                : "Good things are on their way."}
            </h3>
            <p>
              {search || category
                ? "Try another search or explore the full collection."
                : "The collection is empty. Check back soon for new arrivals."}
            </p>
            {(search || category) && (
              <Button variant="outline" onClick={() => setParams({})}>
                View all finds
              </Button>
            )}
          </div>
        ) : (
          <div
            className={`grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 ${products.isPlaceholderData ? "opacity-60" : ""}`}
            aria-busy={products.isFetching}
          >
            {products.data.data.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
        {products.data && (products.data.pagination?.total || 0) > 1 && (
          <nav
            aria-label="Product pages"
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={page === 1 || products.isPlaceholderData}
              onClick={() => update("page", String(page - 1))}
            >
              <ChevronLeft size={18} />
            </Button>
            <span className="text-sm">
              Page {page} of {products.data.pagination?.total}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={
                page >= (products.data.pagination?.total || 1) ||
                products.isPlaceholderData
              }
              onClick={() => update("page", String(page + 1))}
            >
              <ChevronRight size={18} />
            </Button>
          </nav>
        )}
      </section>
      <section className="page-width closing-note">
        <span className="tiny-star" aria-hidden="true">✳</span>
        <h2>
          Make room for
          <br />
          <em>the things you love.</em>
        </h2>
        <p>A considered collection. An everyday kind of joy.</p>
        <a
          href="#collection"
          className="inline-flex items-center gap-2 border-b border-current pb-1 text-sm"
        >
          Explore Jorval <ArrowUpRight size={16} />
        </a>
      </section>
    </>
  );
}
