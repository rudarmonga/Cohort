"use client";

import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/store/authSlice";
import toast from "react-hot-toast";

export default function EditProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    userName: "",
    email: "",
    age: "",
    });

    useEffect(() => {
    if (user) {
        setForm({
        name: user.name || "",
        userName: user.userName || "",
        email: user.email || "",
        age: user.age ? String(user.age) : "",
        });
    }
    }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(
        updateUser({
          name: form.name,
          userName: form.userName,
          email: form.email,
          age: form.age ? Number(form.age) : null,
        })
      ).unwrap(); 

      toast.success("Profile updated successfully ✨");

      router.push("/me");
    } catch (err: any) {
      toast.error(err?.message || err || "Update failed ❌");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-10 text-[#b8b2a9]">No user found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#eae6df] px-6 py-16">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">

        {/* LEFT → PROFILE PREVIEW */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#161a20]/70 backdrop-blur-md border border-[#3a2f2a] rounded-2xl p-8"
        >
          <h2
            className="text-3xl mb-6 text-[#f5efe6]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Preview
          </h2>

          <div className="flex flex-col items-center text-center">

            <div className="relative mb-6">
              <img
                src={user.profileImage}
                alt={user.name}
                className="w-40 h-40 rounded-full object-cover border border-[#3a2f2a]"
              />

              <button className="absolute bottom-0 right-0 px-3 py-1 text-xs rounded-full bg-linear-to-br from-[#ffe0be] via-[#ffb36b] to-[#d84c0b] text-[#1c1f26]">
                Edit
              </button>
            </div>

            <h3 className="text-2xl text-[#f5efe6]">{form.name}</h3>
            <p className="text-[#b8b2a9]">@{form.userName}</p>

            <div className="mt-6 space-y-2 text-sm text-[#b8b2a9]">
              <p>{form.email}</p>
              {form.age && <p>Age {form.age}</p>}
            </div>
          </div>
        </motion.div>

        {/* RIGHT → EDIT FORM */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#161a20]/70 backdrop-blur-md border border-[#3a2f2a] rounded-2xl p-8"
        >
          <h2
            className="text-3xl mb-6 text-[#f5efe6]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Edit Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="text-sm text-[#b8b2a9]">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-[#0f1115] border border-[#3a2f2a] focus:border-[#c6a98b] outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-[#b8b2a9]">Username</label>
              <input
                name="userName"
                value={form.userName}
                onChange={handleChange}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-[#0f1115] border border-[#3a2f2a] focus:border-[#c6a98b] outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-[#b8b2a9]">Email</label>
              <input
                name="email"
                disabled
                value={form.email}
                onChange={handleChange}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-[#0f1115] border border-[#3a2f2a] focus:border-[#c6a98b] outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-[#b8b2a9]">Age</label>
              <input
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-[#0f1115] border border-[#3a2f2a] focus:border-[#c6a98b] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-3 rounded-lg font-semibold transition-all duration-300
              ${loading 
                ? "bg-[#92776a] text-[#b8b2a9] cursor-not-allowed opacity-70" 
                : "bg-linear-to-r from-[#c6a98b] to-[#a8896a] text-[#1c1f26] shadow-lg hover:scale-[1.02]"
              }`}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </motion.div>

      </div>
    </div>
  );
}