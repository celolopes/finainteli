import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Text, TextInput, Button, useTheme, Surface } from "react-native-paper";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as SecureStore from "expo-secure-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "user@demo.com",
      password: "password123",
    },
  });

  const onSubmit = async (data: FormData) => {
    // Mock Auth
    await SecureStore.setItemAsync("auth_token", "demo_token_123");
    router.replace("/(app)/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.primary }]}>
          FinAInteli
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Your Personal AI Finance Assistant
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => <TextInput label="Email" value={value} onChangeText={onChange} mode="outlined" style={styles.input} error={!!errors.email} />}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput label="Password" value={value} onChangeText={onChange} mode="outlined" secureTextEntry style={styles.input} error={!!errors.password} />
          )}
        />

        <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button} contentStyle={{ height: 48 }}>
          Login
        </Button>

        <Button mode="outlined" onPress={() => {}} style={styles.socialButton} icon="google">
          Continue with Google
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  socialButton: {
    marginTop: 8,
  },
});
