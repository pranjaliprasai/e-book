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
import { login as loginService, register, forgotPassword, resetPassword, googleLogin } from "../components/services/authServices";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
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

// ─── Google OAuth config ──────────────────────────────────────────────────────
// This redirect URI must be added to your Google Cloud Console web client's
// "Authorized redirect URIs" list: com.smartshelf.app://google-auth
const GOOGLE_WEB_CLIENT_ID = '179153186138-iicioq24309qj7ccv79pi4nljcjf0p55.apps.googleusercontent.com';
// Forced HTTPS Proxy URI for Google Auth (Required for SDK 54+ Expo Go)
const GOOGLE_REDIRECT_URI = 'https://auth.expo.io/@pranjaliprasai/SmartShelf';
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

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

  // Uses AuthSession directly
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: GOOGLE_REDIRECT_URI,
      usePKCE: true,
      extraParams: { access_type: 'offline' },
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (__DEV__) {
        console.log('🔄 [Google Auth] PROXY REDIRECT URI:');
        console.log('🔗', GOOGLE_REDIRECT_URI);
        console.log('⚠️ [Action] Paste this into Google Console > Authorized redirect URIs');
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      const codeVerifier = request?.codeVerifier;
      if (__DEV__) console.log('✅ [Google Auth] Code received:', code ? 'YES' : 'NO');
      if (code) {
        handleGoogleLogin(code, codeVerifier);
      } else {
        Alert.alert('Google Login Failed', 'No authorization code received.');
      }
    } else if (response?.type === 'error') {
      if (__DEV__) console.error('❌ [Google Auth] Session Error:', response.error);
      Alert.alert('Google Login Error', response.error?.message || 'Something went wrong.');
    } else if (response?.type === 'cancel') {
        if (__DEV__) console.log('🚫 [Google Auth] User cancelled.');
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

  const handleGoogleLogin = async (code: string, codeVerifier?: string) => {
    setIsLoading(true);
    if (__DEV__) console.log('🚀 [Google Login] Initiating backend exchange...');
    try {
      const res = await googleLogin(code, codeVerifier, GOOGLE_REDIRECT_URI);
      if (__DEV__) console.log('🔍 [Google Login Service Response]:', res);

      if (res.success) {
        await login(res.user, res.token);
        if (__DEV__) console.log('🔄 [Google Login] Session synced. Redirecting to home...');
        router.replace("/");
      } else {
        Alert.alert("Google Login Failed", res.message || 'Please try again.');
      }
    } catch (error: any) {
      if (__DEV__) console.error('🚨 [Google Login] Catch error:', error);
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
          // 1. Sync session
          await login(res.user, res.token);
          
          // 2. Allow a short stabilization period
          if (__DEV__) console.log('🔄 [Login] Session synced. Stabilizing for 2s...');
          
          // 3. Complete login after 2s delay
          setTimeout(() => {
            router.replace("/");
          }, 2000);
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
    display: authMode === 'signin' ? 'flex' : 'none'
  }));

  const signupFormStyle = useAnimatedStyle(() => ({
    opacity: interpolate(modeAnim.value, [0.5, 1], [0, 1], Extrapolate.CLAMP),
    transform: [
      { translateX: interpolate(modeAnim.value, [0, 1], [width, 0], Extrapolate.CLAMP) },
      { scale: interpolate(modeAnim.value, [0, 1], [0.9, 1], Extrapolate.CLAMP) }
    ],
    display: authMode === 'signup' ? 'flex' : 'none'
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
            <Image
              source={require('../assets/images/mainapplogo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
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
    backgroundColor: "#F9F9F7",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
    // Add a very subtle elevation/glow effect if it's a transparency-heavy logo
    shadowColor: "#4F7942",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2F4F4F",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B7D6B",
    marginTop: 4,
    fontWeight: "600",
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "700",
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
    fontWeight: "600",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotText: {
    color: "#4F7942",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: "#4F7942",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F7942",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
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
    fontWeight: "900",
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
    fontSize: 15,
    fontWeight: "700",
  },
  forgotTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#2F4F4F",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  forgotSubtitle: {
    fontSize: 15,
    color: "#8B7D6B",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
    fontWeight: "600",
  },
  backToLogin: {
    marginTop: 20,
    alignItems: "center",
  },
  backToLoginText: {
    color: "#4F7942",
    fontSize: 16,
    fontWeight: "700",
  },
});
