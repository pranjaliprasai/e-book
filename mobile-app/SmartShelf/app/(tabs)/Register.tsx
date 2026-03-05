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
    backgroundColor: "#F5F5DC",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#6B8E23",
    letterSpacing: 0.5,
  },
  authContainer: {
    flexDirection: "row",
    backgroundColor: "#E8E4D9",
    borderRadius: 25,
    marginBottom: 20,
    padding: 4,
    position: "relative",
    height: 50,
  },
  authSlider: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#8BA86B",
    borderRadius: 22,
    top: 4,
    left: 4,
  },
  authButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  authText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  authTextActive: {
    color: "#FFFFFF",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8E4D9",
    fontSize: 16,
    color: "#333",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#6B8E23",
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: "#6B8E23",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  googleButton: {
    borderColor: "#6B8E23",
    borderWidth: 2,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  googleButtonText: {
    color: "#6B8E23",
    fontSize: 16,
    fontWeight: "600",
  },
});
