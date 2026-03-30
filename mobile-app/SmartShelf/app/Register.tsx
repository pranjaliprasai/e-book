import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  const authSlideAnim = useRef(new Animated.Value(1)).current; // Start at 1 for signup
  const roleSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(authSlideAnim, {
      toValue: authMode === "signin" ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [authMode]);

  useEffect(() => {
    Animated.spring(roleSlideAnim, {
      toValue: role === "user" ? 0 : 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [role]);

  const authTranslateX = authSlideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 165],
  });

  const handleRegister = () => {
    console.log("Register:", { fullName, email, password });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>

        {/* Sign In / Sign Up Slider */}
        <View style={styles.authContainer}>
          <Animated.View
            style={[
              styles.authSlider,
              {
                transform: [{ translateX: authTranslateX }],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => setAuthMode("signin")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.authText,
                authMode === "signin" && styles.authTextActive,
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => setAuthMode("signup")}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.authText,
                authMode === "signup" && styles.authTextActive,
              ]}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full Name Input - Only shown in Sign Up mode */}
        {authMode === "signup" && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor="#8B7D6B"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            autoCapitalize="words"
          />
        )}

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#8B7D6B"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
        />

        {/* Password Input */}
        <TextInput
          placeholder="Password"
          placeholderTextColor="#8B7D6B"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          autoCapitalize="none"
        />

        {authMode === "signup" ? (
          <>
            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={handleRegister}
            >
              <Text style={styles.actionButtonText}>Create Account</Text>
            </TouchableOpacity>

            {/* Google Sign Up Button */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <Text style={styles.googleButtonText}>Register with Google</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.8}>
              <Text style={styles.actionButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Google Sign In Button */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F9F9F7",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    paddingVertical: 40,
    backgroundColor: "#F9F9F7",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 30,
    color: "#2F4F4F",
    letterSpacing: -1,
  },
  authContainer: {
    flexDirection: "row",
    backgroundColor: "#EBE9E2",
    borderRadius: 25,
    marginBottom: 20,
    padding: 4,
    position: "relative",
    height: 54,
  },
  authSlider: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#4F7942",
    borderRadius: 22,
    top: 4,
    left: 4,
    shadowColor: "#4F7942",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  authButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  authText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8B7D6B",
  },
  authTextActive: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#EBE9E2",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#4F7942",
    fontSize: 14,
    fontWeight: "700",
  },
  actionButton: {
    backgroundColor: "#4F7942",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#4F7942",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  googleButton: {
    borderColor: "#EBE9E2",
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "700",
  },
});
