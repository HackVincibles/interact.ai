import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  age?: number;
  bio?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  resume?: string;
  resumeName?: string;
  skills: string[];
  resetPasswordOTP?: string;
  resetPasswordOTPExpire?: Date;
  createdAt: Date;
  comparePassword: (password: string) => Promise<boolean>;
  getResetPasswordToken: () => string;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  avatar: { type: String },
  age: { type: Number },
  bio: { type: String },
  phone: { type: String },
  github: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  resume: { type: String },
  resumeName: { type: String },
  skills: { type: [String], default: [] },
  resetPasswordOTP: String,
  resetPasswordOTPExpire: Date,
  createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  const crypto = require('crypto');
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 mins)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

export default mongoose.model<IUser>('User', UserSchema);
