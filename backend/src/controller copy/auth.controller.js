import {
  forgetPasswordService,
  googleAuthService,
  googleCallbackService,
  loginService,
  registerService,
  resetPasswordService,
} from "../service/auth.service.js";
import successResponse from "../utils/success.response.js";

export const registerUserController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerService(name, email, password);
    successResponse(
      { success: true, message: "Register successful", data: user },
      res
    );
  } catch (error) {
    console.error("Error in registerUserController:", error);
    next(error);
  }
};

export const loginUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    const { token, user } = await loginService(email, password);

    successResponse(
      { success: true, message: "Login successful", data: { token, user } },
      res
    );
  } catch (error) {
    console.error(`Login failed for ${req.body.email}:`, error.message);
    next(error);
  }
};

export const forgetPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;

    await forgetPasswordService(email);

    successResponse(
      {
        success: true,
        message: "OTP sent to your email for password reset",
        data: null,
      },
      res
    );
  } catch (error) {
    console.error("Error in forgetPasswordController:", error);
    next(error);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    await resetPasswordService(otp, newPassword);
    successResponse(
      {
        success: true,
        message: "Password reset successful",
        data: null,
      },
      res
    );
  } catch (error) {
    console.error("Error in resetPasswordController:", error);
    next(error);
  }
};

export const googleAuthController = async (req, res, next) => {
  try {
    const { redirectUrl } = req.query;
    const data = await googleAuthService(redirectUrl);
    successResponse(
      {
        success: true,
        message: "Google authentication successful",
        data,
      },
      res
    );
  } catch (error) {
    next(error);
  }
};

export const googleCallbackController = async (req, res, next) => {
  try {
    const { code, redirect_uri } = req.query;
    const { resData, token } = await googleCallbackService(code, redirect_uri);
    successResponse(
      {
        success: true,
        message: "Google callback successful",
        data: { ...resData, token },
      },
      res
    );
  } catch (error) {
    console.error("Error in googleCallbackController:", error);
    next(error);
  }
};
