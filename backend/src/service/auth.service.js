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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists with this email");
    }
    const passwordHash = await bcrypt(password, 10);

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

    const token = generateToken(user._id, user.name, user.email);
    return token;
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
      token = generateToken(user._id, user.name, user.email);
      const resData = {
        name: user.name,
        email: user.email,
        picture,
      };
      return { resData, token };
    } else {
      newUser = await userModel.create({
        name,
        email,
        isGoogle: true,
      });
    }

    token = generateToken(newUser?._id, name, email);
    const resData = {
      name,
      email,
      picture,
    };
    return { resData, token };
  } catch (error) {
    throw error;
  }
};
