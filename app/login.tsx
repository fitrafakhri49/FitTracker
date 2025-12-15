import { supabase } from "@/lib/supabase"; // Import supabase client
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [userInfo, setUserInfo] = useState<any>(null);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Warning", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await AsyncStorage.setItem(
          "sb-session",
          JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: {
              id: data.user.id,
              email: data.user.email,
              name:
                data.user.user_metadata?.full_name ||
                data.user.email?.split("@")[0],
              avatar_url: data.user.user_metadata?.avatar_url,
            },
          })
        );

        console.log("Login successful:", data.user.email);

        Alert.alert("Access Granted", "Welcome to the Arena!");
        router.replace("/(tabs)/home");
      } else {
        throw new Error("No session returned");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      Alert.alert("Access Denied", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header dengan efek sporty */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <FontAwesome5 name="dumbbell" size={32} color="#1D24CA" />
        </View>
        <Text style={styles.title}>
          FIT<Text style={styles.titleAccent}>TRACKER</Text>
        </Text>
      </View>

      {/* Form Container dengan efek neon */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <MaterialIcons name="login" size={24} color="#1D24CA" />
          <Text style={styles.formTitle}></Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputField}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="EMAIL"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          {email ? (
            <View style={styles.inputStatus}>
              <FontAwesome5 name="check-circle" size={16} color="#00FF00" />
            </View>
          ) : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputField}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="lock" size={20} color="#666" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialIcons
              name={showPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#1D24CA"
            />
          </TouchableOpacity>
        </View>

        {/* Login Button dengan animasi */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          onPressIn={startPulseAnimation}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>MULAI LATIHAN</Text>
                <FontAwesome5
                  name="running"
                  size={16}
                  color="#000"
                  style={styles.buttonIcon}
                />
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ATAU LOGIN DENGAN</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register Section */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Baru Mulai NgeGym?</Text>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push("/register")}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>JOIN THE TEAM</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#1D24CA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 FITTRACKER</Text>
        <Text style={styles.footerSubText}>PUSH YOUR LIMITS</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoBadge: {
    backgroundColor: "#111",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#1D24CA",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 3,
    textShadowColor: "#1D24CA",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleAccent: {
    color: "#1D24CA",
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: 20,
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "#888",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 25,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 30,
    shadowColor: "#1D24CA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 25,
  },
  formTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  inputIcon: {
    padding: 15,
    backgroundColor: "#1a1a1a",
  },
  input: {
    flex: 1,
    padding: 15,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  inputStatus: {
    paddingHorizontal: 15,
  },
  eyeButton: {
    padding: 15,
    backgroundColor: "#1a1a1a",
  },
  rememberContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  rememberCheck: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#1D24CA",
    justifyContent: "center",
    alignItems: "center",
  },
  rememberText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  forgotText: {
    color: "#1D24CA",
    fontSize: 12,
    fontWeight: "700",
  },
  loginButton: {
    backgroundColor: "#1D24CA",
    borderRadius: 10,
    paddingVertical: 18,
    marginBottom: 25,
    shadowColor: "#1D24CA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  dividerText: {
    color: "#666",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    paddingHorizontal: 10,
  },
  socialGrid: {
    flexDirection: "row",
    gap: 15,
    marginBottom: 25,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 10,
  },
  googleButton: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  appleButton: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#333",
  },
  socialText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  appleText: {
    color: "#FFF",
  },
  quickLogin: {
    marginBottom: 25,
  },
  quickText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 1,
  },
  quickButtons: {
    flexDirection: "row",
    gap: 10,
  },
  quickButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  quickButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  registerSection: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  registerText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  registerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  registerButtonText: {
    color: "#1D24CA",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: "#444",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  footerSubText: {
    color: "#1D24CA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 5,
  },
});
