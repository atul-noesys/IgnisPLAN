import { useState } from "react";
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Group,
  Alert,
  Tabs,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { IconAlertCircle } from "@tabler/icons-react";
import { LoginSchema, RegisterSchema } from "../types/auth";
import { useAuth } from "../context/AuthContext";
import { z } from "zod";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string | null>("login");
  const [error, setError] = useState<string | null>(null);

  // Login form
  const loginForm = useForm({
    initialValues: {
      email: import.meta.env.DEV ? "sanjay@noesyssoftware.com" : "",
      password: import.meta.env.DEV ? "9deh$gHE" : "",
    },
    validate: (values) => {
      try {
        LoginSchema.parse(values);
        return {};
      } catch (err) {
        if (err instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          err.issues.forEach((e) => {
            const path = e.path.join(".");
            fieldErrors[path] = e.message;
          });
          return fieldErrors;
        }
        return {};
      }
    },
  });

  // Register form
  const registerForm = useForm({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      company: "",
    },
    validate: (values) => {
      try {
        RegisterSchema.parse(values);
        return {};
      } catch (err) {
        if (err instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          err.issues.forEach((e) => {
            const path = e.path.join(".");
            fieldErrors[path] = e.message;
          });
          return fieldErrors;
        }
        return {};
      }
    },
  });

  const handleLogin = async (values: typeof loginForm.values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleRegister = async (values: typeof registerForm.values) => {
    setError(null);
    try {
      await register({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        firstName: values.firstName,
        lastName: values.lastName,
        company: values.company,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)",
      }}
    >
      <Container size="sm" py="xl">
        <Paper
          withBorder
          p={0}
          radius="lg"
          shadow="md"
          style={{ overflow: "hidden" }}
        >
          <Stack gap={0}>
            {/* Hero Section with Logo and Description */}
            <div
              style={{
                background: "linear-gradient(135deg, #1f1f2e 0%, #2d2d44 100%)",
                padding: "40px 32px 24px 32px",
                textAlign: "center",
                color: "white",
                position: "relative",
              }}
            >
              {/* Flame SVG Logo */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M32 4C32 4 44 18 44 32C44 42 36 52 32 60C28 52 20 42 20 32C20 18 32 4 32 4Z"
                    fill="url(#flame-gradient)"
                  />
                  <defs>
                    <linearGradient
                      id="flame-gradient"
                      x1="32"
                      y1="4"
                      x2="32"
                      y2="60"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stopColor="#FF6A00" />
                      <stop offset="1" stopColor="#FFB347" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <Title order={1} style={{ color: "#FFB347", letterSpacing: 1 }}>
                IgnisPLAN
              </Title>
              <Text
                size="lg"
                mt="xs"
                style={{ color: "white", fontWeight: 500 }}
              >
                Diagnostic Ops for imaging &amp; bed allotment
              </Text>
              <Text size="sm" mt="sm" style={{ color: "white", opacity: 0.85 }}>
                <strong>Ignis</strong> means{" "}
                <span style={{ fontWeight: 600 }}>fire</span> in Latin.
                <br />
                Schedule diagnostics, allot beds, and manage patient queues.
                <br />
                Secure access via Infoveave — same auth as IgnisGTM.
              </Text>
            </div>

            <div
              style={{ padding: "32px 24px 24px 24px", background: "white" }}
            >
              <Stack gap="lg">
                {/* Error Alert */}
                {error && (
                  <Alert icon={<IconAlertCircle />} title="Error" color="red">
                    {error}
                  </Alert>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab}>
                  <Tabs.List grow>
                    <Tabs.Tab value="login">Login</Tabs.Tab>
                    <Tabs.Tab value="register">Register</Tabs.Tab>
                  </Tabs.List>

                  {/* Login Tab */}
                  <Tabs.Panel value="login" pt="lg">
                    <form onSubmit={loginForm.onSubmit(handleLogin)}>
                      <Stack gap="md">
                        <TextInput
                          label="Username or Email"
                          placeholder="your@email.com"
                          {...loginForm.getInputProps("email")}
                        />

                        <PasswordInput
                          label="Password"
                          placeholder="Your password"
                          {...loginForm.getInputProps("password")}
                        />

                        <Button
                          type="submit"
                          fullWidth
                          loading={isLoading}
                          variant="gradient"
                          gradient={{ from: "#FF6A00", to: "#FFB347" }}
                        >
                          Sign In
                        </Button>
                      </Stack>
                    </form>
                  </Tabs.Panel>

                  {/* Register Tab */}
                  <Tabs.Panel value="register" pt="lg">
                    <form onSubmit={registerForm.onSubmit(handleRegister)}>
                      <Stack gap="md">
                        <Group grow>
                          <TextInput
                            label="First Name"
                            placeholder="John"
                            {...registerForm.getInputProps("firstName")}
                          />
                          <TextInput
                            label="Last Name"
                            placeholder="Doe"
                            {...registerForm.getInputProps("lastName")}
                          />
                        </Group>

                        <TextInput
                          label="Email"
                          placeholder="your@email.com"
                          {...registerForm.getInputProps("email")}
                        />

                        <TextInput
                          label="Company"
                          placeholder="Your company"
                          {...registerForm.getInputProps("company")}
                        />

                        <PasswordInput
                          label="Password"
                          placeholder="Create a password"
                          {...registerForm.getInputProps("password")}
                        />

                        <PasswordInput
                          label="Confirm Password"
                          placeholder="Confirm password"
                          {...registerForm.getInputProps("confirmPassword")}
                        />

                        <Button
                          type="submit"
                          fullWidth
                          loading={isLoading}
                          variant="gradient"
                          gradient={{ from: "#FF6A00", to: "#FFB347" }}
                        >
                          Create Account
                        </Button>
                      </Stack>
                    </form>
                  </Tabs.Panel>
                </Tabs>

                {/* Footer */}
                <Text size="xs" c="dimmed" style={{ textAlign: "center" }}>
                  IgnisPLAN • Infoveave
                </Text>
              </Stack>
            </div>
          </Stack>
        </Paper>
      </Container>
    </div>
  );
}
