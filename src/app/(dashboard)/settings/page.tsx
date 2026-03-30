"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/auth.store";
import { useUpdateSettings } from "@/hooks/use-settings";
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
import { User, Mail, Shield } from "lucide-react";
import { settingsSchema, type SettingsInput } from "@/types/auth";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const updateSettings = useUpdateSettings();

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    defaultValues: {
      name: user?.name || "",
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateSettings.reset();
    updateSettings.mutate(data, {
      onSuccess: (updatedUser) => {
        setUser({
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        });
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message,
        });
      },
    });
  });

  React.useEffect(() => {
    if (updateSettings.isSuccess) {
      const timeout = setTimeout(() => {
        updateSettings.reset();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [updateSettings.isSuccess, updateSettings]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <FormProvider {...form}>
            <Form onSubmit={onSubmit} className="space-y-4">
              {form.formState.errors.root && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {form.formState.errors.root.message}
                </div>
              )}

              <FormField label="Name" error={form.formState.errors.name}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...form.register("name")}
                    id="name"
                    className="pl-10"
                    placeholder="Your name"
                  />
                </div>
              </FormField>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="role"
                    value={user?.role}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>

              <FormButton type="submit" loading={updateSettings.isPending}>
                Save Changes
              </FormButton>
            </Form>
          </FormProvider>

          {updateSettings.isSuccess && (
            <div
              className="p-3 text-sm bg-green-100 text-green-800 rounded-md"
              role="status"
              aria-live="polite"
            >
              Settings saved successfully
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
