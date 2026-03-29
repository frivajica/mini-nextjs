"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormProvider,
  zodResolver,
  Form,
  FormField,
  FormButton,
  Input,
} from "@/components/ui/form";
import { loginSchema, type LoginInput } from "@/types/auth";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiResponse, AuthResponse } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setRefreshToken } = useAuthStore();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", data }),
      });

      const json: ApiResponse<AuthResponse> = await response.json();

      if (!json.success || !json.data) {
        throw new Error(json.error || "Login failed");
      }

      setUser({
        id: json.data.user.id,
        email: json.data.user.email,
        name: json.data.user.name,
        role: json.data.user.role as "USER" | "ADMIN",
      });
      setRefreshToken(json.data.refreshToken);
      router.push("/users");
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {form.formState.errors.root && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField label="Email" error={form.formState.errors.email}>
                <Input
                  type="email"
                  {...form.register("email")}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </FormField>

              <FormField
                label="Password"
                error={form.formState.errors.password}
              >
                <Input
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </FormField>

              <FormButton
                type="submit"
                loading={form.formState.isSubmitting}
                className="w-full"
              >
                Sign In
              </FormButton>

              <p className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </Form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
