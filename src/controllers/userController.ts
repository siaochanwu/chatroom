import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel";
import { authenticate } from "../middlewares/authMiddleware";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";
const { JWT_SECRET, EMAIL_SERVICE_USER, EMAIL_SERVICE_PASSWORD } = process.env;

export const signup = async (req: Request, res: Response) => {
  const { username, password, email, avatar } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  //check if user already exists
  const user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ message: "User already exists" });
  }

  try {
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      avatar,
    });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET as string, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }
};

export const forgetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET as string, {
      expiresIn: "1h",
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 600000); // 10 min
    await user.save();

    // send email with resetToken
    const resetUrl = `http://localhost:3000/reset/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_SERVICE_USER,
        pass: EMAIL_SERVICE_PASSWORD,
      },
    });

    // dynamic html template
    const templatepPath = path.resolve(__dirname, "src/views/mail.html");
    const templateSource = fs.readFileSync("src/views/mail.html", "utf8");
    const template = handlebars.compile(templateSource);
    const htmlTemplate = template({ resetUrl, username: user.username });

    const mailOptions = {
      from: EMAIL_SERVICE_USER,
      to: user.email,
      subject: "GreenDoctor App Password Reset",
      html: htmlTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Email could not be sent" });
      } else {
        console.log("Email sent: " + info.response);
        return res.status(200).json({ message: "Password reset Email sent" });
      }
    });
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { password, token } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ message: "Something went wrong" });
  }
};
