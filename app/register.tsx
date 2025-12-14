import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
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

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

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

  async function handleRegister() {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Warning", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Warning", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Warning", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://192.168.18.247:3000/api/v1/auth/register",
        {
          name,
          email,
          password,
        }
      );

      const session = res.data.session;
      if (session?.access_token) {
        await AsyncStorage.setItem("sb-token", session.access_token);
      }
      console.log(AsyncStorage.getItem("sb-token"));

      Alert.alert("Registration Successful", "Welcome to Fittracker!");
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err.response?.data?.error || "Something went wrong"
      );
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
          <FontAwesome5 name="user-plus" size={32} color="#1D24CA" />
        </View>
        <Text style={styles.title}>
          JOIN <Text style={styles.titleAccent}>FITTRACKER</Text>
        </Text>
        <Text style={styles.tagline}>MULAI PERJALANAN FITNESSMU</Text>
      </View>

      {/* Form Container */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <MaterialIcons name="how-to-reg" size={24} color="#1D24CA" />
          <Text style={styles.formTitle}>CREATE YOUR ACCOUNT</Text>
        </View>

        {/* Name Input */}
        <View style={styles.inputField}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="FULL NAME"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
          {name ? (
            <View style={styles.inputStatus}>
              <FontAwesome5 name="check-circle" size={16} color="#00FF00" />
            </View>
          ) : null}
        </View>
        {/* Email Input */}
        <View style={styles.inputField}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="email" size={20} color="#666" />
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

        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <View style={styles.passwordStrength}>
            <Text style={styles.strengthLabel}>Password Strength:</Text>
            <View style={styles.strengthBar}>
              <View
                style={[
                  styles.strengthFill,
                  {
                    width: `${Math.min(password.length * 10, 100)}%`,
                    backgroundColor:
                      password.length >= 8
                        ? "#00FF00"
                        : password.length >= 6
                        ? "#FFD700"
                        : "#FF0000",
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.strengthText,
                {
                  color:
                    password.length >= 8
                      ? "#00FF00"
                      : password.length >= 6
                      ? "#FFD700"
                      : "#FF0000",
                },
              ]}
            >
              {password.length >= 8
                ? "Strong"
                : password.length >= 6
                ? "Medium"
                : "Weak"}
            </Text>
          </View>
        )}

        {/* Confirm Password Input */}
        <View style={styles.inputField}>
          <View style={styles.inputIcon}>
            <MaterialIcons name="lock-outline" size={20} color="#666" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="CONFIRM PASSWORD"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <MaterialIcons
              name={showConfirmPassword ? "visibility" : "visibility-off"}
              size={20}
              color="#1D24CA"
            />
          </TouchableOpacity>
        </View>

        {/* Password Match Indicator */}
        {confirmPassword.length > 0 && password.length > 0 && (
          <View style={styles.matchIndicator}>
            <MaterialIcons
              name={password === confirmPassword ? "check-circle" : "error"}
              size={16}
              color={password === confirmPassword ? "#00FF00" : "#FF0000"}
            />
            <Text
              style={[
                styles.matchText,
                { color: password === confirmPassword ? "#00FF00" : "#FF0000" },
              ]}
            >
              {password === confirmPassword
                ? "Passwords match"
                : "Passwords do not match"}
            </Text>
          </View>
        )}

        {/* Terms and Conditions */}
        <View style={styles.termsContainer}>
          <TouchableOpacity style={styles.termsCheck}>
            <View style={styles.checkbox}>
              <MaterialIcons name="check" size={12} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.termsText}>
            I agree to the{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>

        {/* Register Button dengan animasi */}
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          onPressIn={startPulseAnimation}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            {loading ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                <FontAwesome5
                  name="dumbbell"
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
          <Text style={styles.dividerText}>OR REGISTER WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Register */}
        <View style={styles.socialGrid}>
          <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
            <FontAwesome5 name="google" size={20} color="#1D24CA" />
            <Text style={styles.socialText}>Google</Text>
          </TouchableOpacity>
        </View>

        {/* Login Section */}
        <View style={styles.loginSection}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>SIGN IN</Text>
            <MaterialIcons name="login" size={16} color="#1D24CA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 FITTRACKER</Text>
        <Text style={styles.footerSubText}>BUILD YOUR LEGACY</Text>
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
    fontSize: 36,
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
    marginBottom: 15,
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
  passwordStrength: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  strengthLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
  },
  strengthBar: {
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 5,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "600",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  termsCheck: {
    marginTop: 2,
    marginRight: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#1D24CA",
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    flex: 1,
    color: "#888",
    fontSize: 12,
    lineHeight: 16,
  },
  termsLink: {
    color: "#1D24CA",
    fontWeight: "700",
  },
  registerButton: {
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
    color: "#FFF",
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
  loginSection: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  loginText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
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
