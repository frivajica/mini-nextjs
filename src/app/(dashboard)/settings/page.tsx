"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/stores/auth.store";
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
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

type SettingsInput = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    defaultValues: {
      name: user?.name || "",
    },
  });

  const onSubmit = async (data: SettingsInput) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage("Settings saved successfully");
    } catch {
      form.setError("root", {
        message: "Failed to save settings",
      });
    }
  };

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
            <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    className="pl-10"
                    placeholder="Your name"
                  />
                </div>
              </FormField>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
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
                <label className="text-sm font-medium">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={user?.role}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
              </div>

              <FormButton type="submit" loading={form.formState.isSubmitting}>
                Save Changes
              </FormButton>
            </Form>
          </FormProvider>

          {successMessage && (
            <div className="p-3 text-sm bg-green-100 text-green-800 rounded-md">
              {successMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
