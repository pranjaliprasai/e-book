import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};
export const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error);
    throw error;
  }
};

export const generateToken = (userId, name, email, role) => {
  try {
    const token = jwt.sign(
      { userId, name, email, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    throw error;
  }
};

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
