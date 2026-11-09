import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared";
export const authSchema = (signup: boolean) =>
  z.object({
    name: signup
      ? z.string().trim().min(3, "Use at least 3 characters.").max(255)
      : z.string(),
    email: z
      .email("Enter a valid email address.")
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(6, "Use at least 6 characters.")
      .max(60, "Use 60 characters or fewer."),
  });
type Fields = { name: string; email: string; password: string };
export function AuthPage({ signup = false }: { signup?: boolean }) {
  const [params] = useSearchParams();
  const requested = params.get("redirect") || "/account";
  const redirect =
    requested.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.includes("\\")
      ? requested
      : "/account";
  const client = useQueryClient();
  const navigate = useNavigate();
  const session = useSession();
  const form = useForm<Fields>({
    resolver: zodResolver(authSchema(signup)),
    defaultValues: { name: "", email: "", password: "" },
  });
  const auth = useMutation({
    mutationFn: (data: Fields) =>
      signup
        ? api.signup(data)
        : api.login({ email: data.email, password: data.password }),
    onSuccess: (response) => {
      client.removeQueries({ queryKey: ["cart"] });
      client.removeQueries({ queryKey: ["orders"] });
      client.setQueryData(["session"], response.data.user);
      navigate(redirect, { replace: true });
    },
  });
  if (session.data) return <Navigate to={redirect} replace />;
  return (
    <section className="page-width auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">YOUR EVERYDAY, ELEVATED</p>
        <h1>
          Good to
          <br />
          <em>{signup ? "meet you." : "see you again."}</em>
        </h1>
        <p>
          Your favorites. Your finds.
          <br />A little space that’s yours.
        </p>
        <span className="tiny-star" aria-hidden="true">✳</span>
      </div>
      <div className="auth-form">
        <h2>{signup ? "Make yourself at home." : "Welcome back."}</h2>
        <p className="mb-8 mt-3 text-sm text-muted-foreground">
          {signup
            ? "Create an account to start your collection."
            : "Sign in to pick up where you left off."}
        </p>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((data) => auth.mutate(data))}
        >
          {(signup
            ? (["name", "email", "password"] as const)
            : (["email", "password"] as const)
          ).map((field) => (
            <div key={field}>
              <label htmlFor={field} className="mb-2 block text-sm font-medium">
                {field[0].toUpperCase() + field.slice(1)}
              </label>
              <Input
                id={field}
                type={
                  field === "password"
                    ? "password"
                    : field === "email"
                      ? "email"
                      : "text"
                }
                autoComplete={
                  field === "password"
                    ? signup
                      ? "new-password"
                      : "current-password"
                    : field
                }
                maxLength={field === "password" ? 60 : 255}
                aria-invalid={!!form.formState.errors[field]}
                aria-describedby={
                  form.formState.errors[field] ? `${field}-error` : undefined
                }
                {...form.register(field)}
              />
              {form.formState.errors[field] && (
                <p id={`${field}-error`} className="mt-1 text-xs text-red-700">
                  {form.formState.errors[field]?.message}
                </p>
              )}
            </div>
          ))}
          {auth.isError && <ErrorState error={auth.error} />}
          <Button type="submit" className="w-full" disabled={auth.isPending}>
            {auth.isPending
              ? "One moment…"
              : signup
                ? "Create account"
                : "Sign in"}
            <ArrowRight size={16} />
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {signup ? "Already at home here?" : "New around here?"}{" "}
          <Link
            className="font-medium text-foreground underline underline-offset-4"
            to={`${signup ? "/login" : "/signup"}?redirect=${encodeURIComponent(redirect)}`}
          >
            {signup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </section>
  );
}
