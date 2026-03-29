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
import { registerSchema, type RegisterInput } from "@/types/auth";
import { useAuthStore } from "@/stores/auth.store";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setRefreshToken } = useAuthStore();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", data }),
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || "Registration failed");
      }

      setUser(json.data.user);
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
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Sign up to access the dashboard</CardDescription>
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

              <FormField label="Name" error={form.formState.errors.name}>
                <Input
                  type="text"
                  {...form.register("name")}
                  placeholder="John Doe"
                  autoComplete="name"
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
                  autoComplete="new-password"
                />
              </FormField>

              <FormButton
                type="submit"
                loading={form.formState.isSubmitting}
                className="w-full"
              >
                Create Account
              </FormButton>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </Form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
