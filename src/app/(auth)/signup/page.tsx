"use client";

import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { signupUser } from "@/store/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import Image from "next/image";
import toast from "react-hot-toast";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect, useState } from "react";
import pic2 from "#/public/pic2.jpeg";

interface Inputs {
  name: string;
  userName: string;
  email: string;
  password: string;
}

export default function Signup() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.auth);

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      const resultAction = await dispatch(signupUser(data));

      if (signupUser.fulfilled.match(resultAction)) {
        toast.success("Account created!");

        router.replace("/home");
      } else {
        toast.error(
          (resultAction.payload as string) || "Signup failed"
        );
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    }
  };

  const images = [pic2];
  const [randomIndex, setRandomIndex] = useState<number | null>(null);

  useEffect(() => {
    if (images.length === 0) return;
    const index = Math.floor(Math.random() * images.length);
    setRandomIndex(index);
  }, []);

  return (
    <div className="relative h-screen w-full text-white">
      {images.length > 0 && randomIndex !== null && (
        <Image
          src={images[randomIndex]}
          alt="background"
          fill
          priority
          className="object-cover"
        />
      )}

      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-5 bg-black/50 backdrop-blur-lg p-8 rounded-2xl border border-white/20 shadow-xl"
        >
          <h2 className="text-2xl font-semibold text-center">
            Create Account
          </h2>

          {[
            { label: "Name", name: "name" },
            { label: "Username", name: "userName" },
            { label: "Email", name: "email" },
          ].map((field) => (
            <div key={field.name}>
              <label className="text-sm text-gray-300">
                {field.label}
              </label>
              <input
                className="w-full mt-1 p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#c7a88a]"
                {...register(field.name as keyof Inputs, {
                  required: `${field.label} is required`,
                })}
              />
              {errors[field.name as keyof Inputs] && (
                <p className="text-red-400 text-sm mt-1">
                  {
                    errors[field.name as keyof Inputs]
                      ?.message as string
                  }
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="text-sm text-gray-300">
              Password
            </label>
            <input
              type="password"
              className="w-full mt-1 p-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#c7a88a]"
              {...register("password", {
                required: "Password is required",
              })}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#c7a88a] text-black hover:opacity-90"
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-300">
            Already registered?{" "}
            <Link
              href="/login"
              className="text-[#c7a88a] hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}