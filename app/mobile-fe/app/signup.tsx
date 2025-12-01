import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/auth-context";
import GoogleLogo from "@/components/google-logo";
// import FacebookLogo from "@/components/facebook-logo";
import Logo from "@/components/logo";

export default function SignupScreen() {
  const { signup, error } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const passwordsMatch = password === confirm;

  const onSubmit = async () => {
    if (!passwordsMatch) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await signup(name, email, password);
      Alert.alert("Success", "Account created, please login");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Signup Failed", e.message || "Unable to signup");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Logo width={40} height={40} color="#fff" />
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start managing inventory</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={name}
              placeholder="Jane Doe"
              onChangeText={setName}
              placeholderTextColor="#6a7282"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              onChangeText={setEmail}
              placeholderTextColor="#6a7282"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={password}
              secureTextEntry
              placeholder="Create a password"
              onChangeText={setPassword}
              placeholderTextColor="#6a7282"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirm}
              secureTextEntry
              placeholder="Repeat password"
              onChangeText={setConfirm}
              placeholderTextColor="#6a7282"
            />
          </View>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {!passwordsMatch && confirm !== "" && (
          <Text style={styles.error}>Passwords must match.</Text>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !passwordsMatch && styles.buttonDisabled,
          ]}
          disabled={submitting || !passwordsMatch}
          onPress={onSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.orText}>Or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Alert.alert("Google", "Not implemented on mobile")}
          >
            <View style={styles.socialContent}>
              <GoogleLogo width={20} height={20} />
              <Text style={styles.socialText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.socialButton}
            onPress={() => Alert.alert("Facebook", "Not implemented on mobile")}
          >
            <View style={styles.socialContent}>
              <FacebookLogo width={20} height={20} />
              <Text style={styles.socialText}>Continue with Facebook</Text>
            </View>
          </TouchableOpacity> */}
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.loginText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    maxWidth: 480,
    width: "100%",
  },
  header: { alignItems: "center", marginBottom: 16 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#007bff",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "400" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 12 },
  formGroup: { marginTop: 16 },
  label: { fontSize: 12, fontWeight: "500", marginBottom: 8, color: "#374151" },
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  input: { fontSize: 16 },
  error: { color: "#b91c1c", marginTop: 8, fontSize: 14 },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 20,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: { color: "#6b7280", fontSize: 12 },
  socialRow: { gap: 10 },
  socialButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  socialContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  socialText: { color: "#111827", fontWeight: "500" },
  loginButton: { marginTop: 12, alignItems: "center" },
  loginText: { color: "#007bff", fontSize: 14 },
});
