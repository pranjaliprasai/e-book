import userModel from "../model/user.model.js";
import {
  comparePassword,
  generateOtp,
  generateToken,
  hashPassword,
} from "../helper/auth.helper.js";
import { AppError } from "../utils/error.js";
import otpModel from "../model/otp.model.js";
import { sendMail } from "../utils/sendEmail.js";
import { OAuth2Client } from "google-auth-library";

export const registerService = async (name, email, password) => {
  try {
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      throw new AppError("User already exists with this email", 400);
    }
    const passwordHash = await hashPassword(password);

    // Create new user
    const newUser = await userModel.create({
      name,
      email,
      password: passwordHash,
    });
    await newUser.save();
    return newUser;
  } catch (error) {
    console.error("Error in registerService:", error);
    throw error;
  }
};

export const loginService = async (email, password) => {
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new AppError("User not found", 400);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid password", 400);
    }

    const token = generateToken(user._id, user.name, user.email, user.role);
    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture,
        favorites: user.favorites || [],
      },
    };
  } catch (error) {
    throw error;
  }
};

export const forgetPasswordService = async (email) => {
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      throw new AppError("User not found", 400);
    }

    const otp = await generateOtp();

    const expireAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpModel.create({
      code: otp,
      user: user._id,
      expireAt,
    });

    await sendMail({
      email: user.email,
      subject: "Password Reset OTP",
      message: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
    });

    return true;
  } catch (error) {
    throw error;
  }
};

export const resetPasswordService = async (otp, newPassword) => {
  try {
    const otpRecord = await otpModel.findOne({ code: otp });
    if (!otpRecord) {
      throw new AppError("Invalid OTP", 400);
    } else if (otpRecord.expireAt < new Date()) {
      throw new AppError("OTP has expired", 400);
    }

    const user = await userModel.findById(otpRecord.user);
    if (!user) {
      throw new AppError("User not found", 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();
    return true;
  } catch (error) {
    throw error;
  }
};

export const googleAuthService = async (redirectUrl) => {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
    });
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return googleAuthUrl;
  } catch (error) {
    throw error;
  }
};

export const googleCallbackService = async (code, redirect_uri) => {
  try {
    let newUser;
    let token;

    if (!code) {
      throw new AppError("Authorization code not provided", 400);
    }

    const googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL
    );
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: redirect_uri
        ? redirect_uri
        : process.env.GOOGLE_REDIRECT_URL,
    });
    googleClient.setCredentials(tokens);

    const userInfo = await googleClient.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const { email, name, picture } = userInfo.data;

    const user = await userModel.findOne({ email });

    if (user) {
      token = generateToken(user._id, user.name, user.email, user.role);
      const resData = {
        id: user._id,
        name: user.name,
        email: user.email,
        picture,
        role: user.role,
        favorites: user.favorites || [],
      };
      return { resData, token };
    } else {
      newUser = await userModel.create({
        name,
        email,
        isGoogle: true,
      });
    }

    token = generateToken(newUser?._id, name, email, "user");
    const resData = {
      id: newUser?._id,
      name,
      email,
      picture,
      role: "user",
      favorites: newUser?.favorites || [],
    };
    return { resData, token };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify a Google ID Token obtained directly by the mobile app (expo-auth-session id_token flow).
 * No code exchange needed — the id_token is a signed JWT we can verify locally.
 */
export const googleIdTokenService = async (idToken) => {
  try {
    if (!idToken) {
      throw new AppError("ID token not provided", 400);
    }

    const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Verify the token signature and audience
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("Invalid Google ID token", 401);
    }

    const { email, name, picture } = payload;

    // Find existing user or register them automatically
    let user = await userModel.findOne({ email });

    if (!user) {
      user = await userModel.create({ name, email, isGoogle: true });
    }

    const token = generateToken(user._id, user.name, user.email, user.role);
    const resData = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: picture || user.picture,
      role: user.role,
      favorites: user.favorites || [],
    };

    return { resData, token };
  } catch (error) {
    throw error;
  }
};

/**
 * PKCE Code Exchange — receives { code, codeVerifier, redirectUri } from the mobile app.
 * The codeVerifier proves the exchange belongs to the original auth request.
 * No native client IDs required — uses the web client with PKCE.
 */
export const googleCodeService = async (code, codeVerifier, redirectUri) => {
  try {
    if (!code) {
      throw new AppError("Authorization code not provided", 400);
    }

    const googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Exchange the auth code using PKCE verifier
    let tokens;
    try {
        const exchangeResults = await googleClient.getToken({
            code,
            codeVerifier,   // PKCE — Google verifies this matches the challenge sent earlier
            redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URL,
        });
        tokens = exchangeResults.tokens;
    } catch (exchangeError) {
        console.error('❌ [Google Code Service] getToken exchange failed:', exchangeError.response?.data || exchangeError.message);
        throw new AppError(exchangeError.response?.data?.error_description || "Failed to exchange Google code. Check redirect URIs.", 401);
    }
    googleClient.setCredentials(tokens);

    // Fetch user profile using the access token
    const userInfo = await googleClient.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    const { email, name, picture } = userInfo.data;

    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({ name, email, isGoogle: true });
    }

    const token = generateToken(user._id, user.name, user.email, user.role);
    const resData = {
      id: user._id,
      name: user.name,
      email: user.email,
      picture: picture || user.picture,
      role: user.role,
      favorites: user.favorites || [],
    };

    return { resData, token };
  } catch (error) {
    throw error;
  }
};
