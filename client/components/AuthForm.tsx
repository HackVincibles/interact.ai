"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Lock, Mail, User as UserIcon } from "lucide-react";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp, forgotPassword, verifyOTP, resetPassword } from "@/lib/actions/auth.action";
import FormField from "./FormField";
import { FormType } from "@/types";

type AuthMode = FormType | "forgot-password" | "otp-verify" | "new-password";

const authFormSchema = (mode: AuthMode) => {
  return z.object({
    name: mode === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: (mode === "sign-in" || mode === "sign-up" || mode === "new-password") ? z.string().min(3) : z.string().optional(),
    confirmPassword: (mode === "sign-up" || mode === "new-password") ? z.string().min(3) : z.string().optional(),
    otp: mode === "otp-verify" ? z.string().length(6) : z.string().optional(),
  }).refine((data) => {
    if ((mode === "sign-up" || mode === "new-password") && data.password !== data.confirmPassword) {
      return false;
    }
    return true;
  }, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>(type);
  const [resetEmail, setResetEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");

  const formSchema = authFormSchema(mode);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (mode === "sign-up") {
        const { name, email, password } = data;
        const result = await signUp({ name: name!, email, password });
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        toast.success("Account created successfully. Please sign in.");
        setMode("sign-in");
      } else if (mode === "sign-in") {
        const { email, password } = data;
        const result = await signIn({ email, password });
        if (result.success) {
          toast.success("Signed in successfully.");
          window.location.href = "/";
        } else {
          toast.error(result.message || "Invalid credentials.");
        }
      } else if (mode === "forgot-password") {
        const result = await forgotPassword(data.email);
        if (result.success) {
          setResetEmail(data.email);
          setMode("otp-verify");
          toast.success("OTP sent to your email.");
        } else {
          toast.error(result.message);
        }
      } else if (mode === "otp-verify") {
        const result = await verifyOTP(resetEmail, data.otp!);
        if (result.success) {
          setOtpValue(data.otp!);
          setMode("new-password");
          toast.success("OTP verified.");
        } else {
          toast.error(result.message);
        }
      } else if (mode === "new-password") {
        const result = await resetPassword({ email: resetEmail, otp: otpValue, password: data.password });
        if (result.success) {
          toast.success("Password updated! You can now sign in.");
          setMode("sign-in");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error: any) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isSignIn = mode === "sign-in";
  const isSignUp = mode === "sign-up";
  const isForgotPassword = mode === "forgot-password";
  const isOtpVerify = mode === "otp-verify";
  const isNewPassword = mode === "new-password";

  return (
    <div className="bg-dark-100 border border-dark-200 rounded-3xl shadow-2xl lg:min-w-[566px] overflow-hidden">
      <div className="flex flex-col gap-8 py-14 px-10 relative">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-600/20">
            <Image src="/logo.svg" alt="logo" height={40} width={40} className="drop-shadow-lg" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-light-100 font-bold text-3xl tracking-tight">Interact.ai</h2>
            <p className="text-light-400 text-sm">
              {isOtpVerify ? "Verify your identity" : isNewPassword ? "Secure your account" : "Elevate your professional career"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
            {isSignUp && (
              <FormField control={form.control} name="name" label="Full Name" placeholder="John Doe" type="text" />
            )}

            {(isSignIn || isSignUp || isForgotPassword) && (
              <FormField control={form.control} name="email" label="Email Address" placeholder="name@company.com" type="email" />
            )}

            {isOtpVerify && (
              <FormField control={form.control} name="otp" label="Verification Code" placeholder="Enter 6-digit OTP" type="text" />
            )}

            {(isSignIn || isSignUp || isNewPassword) && (
              <div className="space-y-4">
                <FormField control={form.control} name="password" label={isNewPassword ? "New Password" : "Password"} placeholder="••••••••" type="password" />
                
                {(isSignUp || isNewPassword) && (
                  <FormField control={form.control} name="confirmPassword" label="Confirm Password" placeholder="••••••••" type="password" />
                )}

                {isSignIn && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setMode("forgot-password")} className="text-xs text-purple-600 hover:text-purple-500 font-medium transition-colors">
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {(isSignIn || isSignUp) && (
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-dark-200"></div>
                <span className="flex-shrink mx-4 text-xs text-light-400 uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-dark-200"></div>
              </div>
            )}

            {(isSignIn || isSignUp) && (
              <Button
                type="button"
                variant="outline"
                className="w-full py-6 bg-dark-200 hover:bg-dark-200/80 border-dark-200 text-light-100 rounded-xl flex items-center justify-center gap-3 transition-all group"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'}/api/auth/google`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="group-hover:text-purple-600 transition-colors">Continue with Google</span>
              </Button>
            )}

            <Button
              className={`w-full py-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                isNewPassword ? "bg-success-100 hover:bg-success-100/90" : "bg-purple-600 hover:bg-purple-700"
              } text-white`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignIn && "Sign In to Dashboard"}
                  {isSignUp && "Create Professional Account"}
                  {isForgotPassword && "Send Verification Code"}
                  {isOtpVerify && "Verify Code"}
                  {isNewPassword && "Update Password"}
                </>
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-light-400">
          {isForgotPassword || isOtpVerify || isNewPassword ? (
            <button onClick={() => setMode("sign-in")} className="text-purple-600 font-bold hover:underline">
              Return to Sign In
            </button>
          ) : (
            <>
              {isSignIn ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setMode(isSignIn ? "sign-up" : "sign-in")}
                className="text-purple-600 font-bold ml-2 hover:underline"
              >
                {isSignIn ? "Create one now" : "Sign in here"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
