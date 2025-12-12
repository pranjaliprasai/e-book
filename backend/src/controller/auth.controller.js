import { registerService } from "../service/auth.service";

export const registerUserController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerService({ name, email, password });
    res
      .status(201)
      .json({ message: "User registered successfully", data: user });
  } catch (error) {
    console.error("Error in registerUserController:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
