import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
}: FormFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === "password";

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-light-100 font-medium">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                className="bg-dark-200 border-dark-200 text-light-100 rounded-xl px-4 py-3 focus:border-purple-600 transition-all pr-12"
                type={isPasswordType ? (showPassword ? "text" : "password") : type}
                placeholder={placeholder}
                {...field}
              />
              {isPasswordType && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-light-400 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-red-500 text-xs" />
        </FormItem>
      )}
    />
  );
};

export default FormField;
