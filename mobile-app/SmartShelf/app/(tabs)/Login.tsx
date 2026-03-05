import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { login as loginService, register, forgotPassword, resetPassword, googleLogin } from "../../components/services/authServices";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  // Animation values
  const modeAnim = useSharedValue(0); // 0 for signin, 1 for signup
  const forgotAnim = useSharedValue(0); // 1 when in forgot password mode

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '179153186138-iicioq24309qj7ccv79pi4nljcjf0p55.apps.googleusercontent.com',
    androidClientId: '179153186138-iicioq24309qj7ccv79pi4nljcjf0p55.apps.googleusercontent.com',
    webClientId: '179153186138-iicioq24309qj7ccv79pi4nljcjf0p55.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGoogleLogin(code);
    }
  }, [response]);

  useEffect(() => {
    if (authMode === 'forgot') {
      forgotAnim.value = withSpring(1);
    } else {
      forgotAnim.value = withSpring(0);
      modeAnim.value = withSpring(authMode === "signin" ? 0 : 1);
    }
  }, [authMode]);

  const handleGoogleLogin = async (code: string) => {
    setIsLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri();
      const res = await googleLogin(code, redirectUri);
      if (__DEV__) console.log('🔍 [Google Login Service Response]:', res);

      if (res.success) {
        await login(res.user, res.token);
        router.replace("/");
      } else {
        Alert.alert("Google Login Failed", res.message);
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred during Google Login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async () => {
    if (authMode === "forgot") {
      if (step === 1) {
        if (!email) {
          Alert.alert("Error", "Please enter your email");
          return;
        }
        setIsLoading(true);
        try {
          const res = await forgotPassword(email);
          if (res.success) {
            Alert.alert("Success", "OTP sent to your email");
            setStep(2);
          } else {
            Alert.alert("Error", res.message);
          }
        } catch (error) {
          Alert.alert("Error", "Failed to send OTP");
        } finally {
          setIsLoading(false);
        }
      } else {
        if (!otp || !newPassword) {
          Alert.alert("Error", "Please fill in all fields");
          return;
        }
        setIsLoading(true);
        try {
          const res = await resetPassword(otp, newPassword);
          if (res.success) {
            Alert.alert("Success", "Password reset successful! Please sign in.");
            setAuthMode("signin");
            setStep(1);
          } else {
            Alert.alert("Error", res.message);
          }
        } catch (error) {
          Alert.alert("Error", "Failed to reset password");
        } finally {
          setIsLoading(false);
        }
      }
      return;
    }

    if (!email || !password || (authMode === "signup" && !fullName)) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === "signup") {
        const res = await register(fullName, email, password);
        if (res.success) {
          Alert.alert("Success", "Account created! Please sign in.");
          setAuthMode("signin");
        } else {
          Alert.alert("Registration Failed", res.message);
        }
      } else {
        const res = await loginService(email, password);
        if (__DEV__) console.log('🔍 [Login Service Response]:', res);

        if (res.success) {
          await login(res.user, res.token);
          router.replace("/");
        } else {
          Alert.alert("Login Failed", res.message);
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred";
      Alert.alert("Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Animated Styles
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(modeAnim.value * ((width - 48) / 2 - 4)) }],
    opacity: 1 - forgotAnim.value,
  }));

  const loginFormStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeAnim.value, [0, 0.5], [1, 0], Extrapolate.CLAMP),
    transform: [
      { translateX: interpolate(modeAnim.value, [0, 1], [0, -width], Extrapolate.CLAMP) },
      { scale: interpolate(modeAnim.value, [0, 1], [1, 0.9], Extrapolate.CLAMP) }
    ],
    display: authMode === 'signup' ? 'none' : 'flex'
  }));

  const signupFormStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeAnim.value, [0.5, 1], [0, 1], Extrapolate.CLAMP),
    transform: [
      { translateX: interpolate(modeAnim.value, [0, 1], [width, 0], Extrapolate.CLAMP) },
      { scale: interpolate(modeAnim.value, [0, 1], [0.9, 1], Extrapolate.CLAMP) }
    ],
    display: authMode === 'signin' ? 'none' : 'flex'
  }));

  const forgotFormStyle = useAnimatedStyle(() => ({
    opacity: forgotAnim.value,
    transform: [{ translateY: interpolate(forgotAnim.value, [0, 1], [50, 0], Extrapolate.CLAMP) }],
    display: authMode === 'forgot' ? 'flex' : 'none'
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: 1 - forgotAnim.value,
    transform: [{ translateY: -forgotAnim.value * 20 }],
  }));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        {/* Logo and Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="book-open-page-variant" size={48} color="#4F7942" />
          </View>
          <Text style={styles.title}>SmartShelf</Text>
          <Text style={styles.subtitle}>Your Digital Knowledge Haven</Text>
        </Animated.View>

        {/* Auth Toggle Slider */}
        {authMode !== 'forgot' && (
          <View style={styles.authToggleWrapper}>
            <View style={styles.authToggleButtonContainer}>
              <Animated.View style={[styles.sliderPill, sliderStyle]} />
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setAuthMode("signin")}
              >
                <Text style={[styles.toggleText, authMode === "signin" && styles.activeToggleText]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setAuthMode("signup")}
              >
                <Text style={[styles.toggleText, authMode === "signup" && styles.activeToggleText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Forms Container */}
        <View style={styles.formsContent}>
          {/* Sign In Form */}
          <Animated.View style={[styles.form, loginFormStyle]}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#A99F92"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#A99F92"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => setAuthMode('forgot')}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request || isLoading}>
              <MaterialCommunityIcons name="google" size={20} color="#4F7942" style={{ marginRight: 10 }} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign Up Form */}
          <Animated.View style={[styles.form, signupFormStyle]}>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#A99F92"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#A99F92"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#A99F92"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={() => promptAsync()} disabled={!request || isLoading}>
              <MaterialCommunityIcons name="google" size={20} color="#4F7942" style={{ marginRight: 10 }} />
              <Text style={styles.googleBtnText}>Sign up with Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Forgot Password Form */}
          <Animated.View style={[styles.form, forgotFormStyle]}>
            <Text style={styles.forgotTitle}>Reset Password</Text>
            <Text style={styles.forgotSubtitle}>
              {step === 1 ? "Enter your email and we'll send you an OTP code to reset your password." : "Please enter the 6-digit code and your new password."}
            </Text>

            {step === 1 ? (
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
                <TextInput
                  placeholder="Email Address"
                  placeholderTextColor="#A99F92"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="numeric" size={20} color="#8B7D6B" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#A99F92"
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#8B7D6B" style={styles.inputIcon} />
                  <TextInput
                    placeholder="New Password"
                    placeholderTextColor="#A99F92"
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
              </>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{step === 1 ? "Send OTP" : "Reset Password"}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => {
                setAuthMode('signin');
                setStep(1);
              }}
            >
              <Text style={styles.backToLoginText}>Back to Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F7",
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2F4F4F",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B7D6B",
    marginTop: 4,
  },
  authToggleWrapper: {
    marginBottom: 30,
  },
  authToggleButtonContainer: {
    flexDirection: "row",
    backgroundColor: "#EBE9E2",
    borderRadius: 15,
    padding: 4,
    height: 54,
    position: "relative",
  },
  sliderPill: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#4F7942",
    borderRadius: 12,
    top: 4,
    left: 4,
    shadowColor: "#4F7942",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B7D6B",
  },
  activeToggleText: {
    color: "#FFF",
  },
  formsContent: {
    height: 380,
    overflow: "hidden",
    position: "relative",
  },
  form: {
    width: "100%",
    position: "absolute",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBE9E2",
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: "#4F7942",
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#4F7942",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F7942",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#EBE9E2",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#8B7D6B",
    fontSize: 12,
    fontWeight: "bold",
  },
  googleBtn: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBE9E2",
  },
  googleBtnText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2F4F4F",
    textAlign: "center",
    marginBottom: 10,
  },
  forgotSubtitle: {
    fontSize: 15,
    color: "#8B7D6B",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  backToLogin: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLoginText: {
    color: "#4F7942",
    fontSize: 16,
    fontWeight: "600",
  },
});
