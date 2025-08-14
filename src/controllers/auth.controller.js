import User from "../models/user.model.js";
import bcrypt from "bcrypt";


export const Signup = async(req,res) => {
    const { name, email, password, age } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "User already exists" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        age
      });

      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        age: newUser.age
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
}

export const Login = async(req,res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Success — in real app, create JWT or session here
    res.json({ message: "Login successful", userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

