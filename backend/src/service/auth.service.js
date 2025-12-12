import bcrypt from "bcryptjs";
import userModel from "../model/user.model";

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
