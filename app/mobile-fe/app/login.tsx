import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/auth-context";
import GoogleLogo from "@/components/google-logo";
// import FacebookLogo from "@/components/facebook-logo";
import Logo from "@/components/logo";
// import { useFacebookAuth } from "@/hooks/use-facebook-auth";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { useGoogleAuthWeb } from "@/hooks/use-google-auth-web";

export default function LoginScreen() {
  const { login, loading, error } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn: googleSignIn } = useGoogleAuth();
  const { signIn: googleSignInWeb, isReady: isWebReady } = useGoogleAuthWeb();
  // const { promptAsync: promptFacebookAsync } = useFacebookAuth();

  const handleGoogleSignIn = async () => {
    try {
      if (Platform.OS === 'web') {
        const result = await googleSignInWeb();
        if (result) {
          Alert.alert(
            "Google Sign-In Success", 
            `Welcome ${result.user.name}!\n\nEmail: ${result.user.email}\n\nNote: Backend integration needed to complete login.`
          );
        }
      } else {
        const userInfo = await googleSignIn();
        Alert.alert(
          "Google Sign-In", 
          `Welcome ${userInfo?.data?.user?.name || 'User'}!\n\nNote: Backend integration needed to complete login.`
        );
      }
    } catch (error: any) {
      Alert.alert("Google Sign-In Failed", error.message || "Unable to sign in with Google");
    }
  };

  const onSubmit = async () => {
    if (!email || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Unable to login");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Logo width={40} height={40} color="#fff" />
          </View>
          <Text style={styles.title}>Inventory Manager</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              placeholder="you@example.com"
              placeholderTextColor="#6a7282"
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              placeholder="Enter your password"
              placeholderTextColor="#6a7282"
              onChangeText={setPassword}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={styles.primaryButton}
          disabled={submitting || loading}
          onPress={onSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
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
            onPress={handleGoogleSignIn}
            disabled={Platform.OS === 'web' && !isWebReady}
          >
            <View style={styles.socialContent}>
              <GoogleLogo width={20} height={20} />
              <Text style={styles.socialText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.socialButton}
            onPress={() => promptFacebookAsync()}
          >
            <View style={styles.socialContent}>
              <FacebookLogo width={20} height={20} />
              <Text style={styles.socialText}>Continue with Facebook</Text>
            </View>
          </TouchableOpacity> */}
        </View>

        <TouchableOpacity style={styles.signupButton} onPress={() => router.push("/signup")}>
          <Text style={styles.signupText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    width: "100%",
    maxWidth: 480,
  },
  header: { alignItems: "center", marginBottom: 16 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4, fontFamily: "Inter_400Regular" },
  formGroup: { marginTop: 16 },
  label: { fontSize: 12, marginBottom: 8, color: "#374151", fontFamily: "Inter_600SemiBold" },
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
  },
  input: { 
    fontSize: 16, 
    fontFamily: "Inter_400Regular",
    outlineWidth: 0,
  },
  error: { color: "#b91c1c", marginTop: 8, fontFamily: "Inter_400Regular" },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 16,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orText: { color: "#6b7280", fontSize: 12, fontFamily: "Inter_400Regular" },
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
  socialText: { color: "#111827", fontFamily: "Inter_600SemiBold" },
  signupButton: { marginTop: 14, alignItems: "center" },
  signupText: { color: "#007bff", fontFamily: "Inter_400Regular" },
});
