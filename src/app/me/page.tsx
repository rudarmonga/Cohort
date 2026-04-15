"use client";

import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Pencil } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return <div className="p-10 text-[#b8b2a9]">Loading...</div>;
  }

  if (!user) {
    return <div className="p-10 text-[#b8b2a9]">No user found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-[#eae6df]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-linear-to-br from-[#3a2f2a]/40 to-[#1c1f26]/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 -left-20 w-80 h-80 rounded-full bg-linear-to-tr from-[#2f2a24]/40 to-[#2a2f38]/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.2, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 sm:px-12 sm:py-24">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-12 bg-linear-to-r from-[#c6a98b]/60 to-transparent" />
              <span className="text-sm tracking-[0.2em] uppercase text-[#b8b2a9]">
                Profile
              </span>
            </div>

            <button
              onClick={() => window.location.href = "/me/edit"}
              className="flex items-center gap-2 px-4 py-2 rounded-full 
              text-white text-sm font-medium cursor-pointer
              transition-all duration-300"
            >
              <Pencil size={16} />
            </button>
          </div>

          <h1
            className="text-6xl sm:text-7xl lg:text-8xl mb-2 text-[#f5efe6]"
            style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
          >
            {user.name}
          </h1>

          {user.userName && (
            <p className="text-xl text-[#b8b2a9]">@{user.userName}</p>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-12 mb-32">

          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-br from-[#c6a98b]/20 to-[#2a2f38]/10 rounded-3xl blur-2xl" />

              <img
                src={user.profileImage}
                alt={user.name}
                className="relative w-full aspect-square object-cover rounded-2xl shadow-2xl border border-[#2a2f38]"
              />

              {user?.age != null && (
                <motion.div
                  className="absolute -bottom-6 -right-6 bg-[#1c1f26]/80 backdrop-blur-md text-[#f5efe6] px-8 py-4 rounded-full border border-[#3a2f2a] shadow-xl"
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                >
                  <p className="text-sm tracking-wider">Age {user.age}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-7 flex flex-col justify-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-8">

              <div>
                <h3 className="text-2xl mb-2 text-[#c6a98b]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Contact
                </h3>
                <p className="text-xl text-[#f5efe6]">{user.email}</p>
              </div>

              <div className="h-px w-full bg-linear-to-r from-[#3a2f2a]/50 via-[#3a2f2a]/20 to-transparent" />

              <div>
                <h3 className="text-2xl mb-4 text-[#c6a98b]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Overview
                </h3>

                <div className="grid grid-cols-2 gap-6">

                  <div className="bg-[#161a20]/70 backdrop-blur-sm rounded-2xl p-6 border border-[#3a2f2a]">
                    <p className="text-4xl mb-2 text-[#f5efe6] font-semibold">
                      {user.projects.length}
                    </p>
                    <p className="text-sm tracking-wider uppercase text-[#b8b2a9]">
                      Total Projects
                    </p>
                  </div>

                  <div className="bg-[#161a20]/70 backdrop-blur-sm rounded-2xl p-6 border border-[#3a2f2a]">
                    <p className="text-4xl mb-2 text-[#f5efe6] font-semibold">
                      {user.projects.filter(p => p.role === "ADMIN").length}
                    </p>
                    <p className="text-sm tracking-wider uppercase text-[#b8b2a9]">
                      As Admin
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {
        user?.projects.length != 0 &&
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-12">
            <h2
              className="text-5xl sm:text-6xl text-[#f5efe6]"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}
            >
              Projects
            </h2>
            <div className="h-px flex-1 ml-8 bg-linear-to-r from-[#3a2f2a]/50 to-transparent" />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {user.projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group relative bg-[#161a20]/70 backdrop-blur-sm rounded-2xl p-8 border border-[#3a2f2a] hover:border-[#c6a98b]/40 transition-all duration-300"
              >
              <div className="absolute top-6 right-6">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs uppercase backdrop-blur-md transition-all duration-300 hover:scale-105
                  ${
                    project.role === "ADMIN"
                      ? "bg-linear-to-br from-[#ffe0be] via-[#ffb36b] to-[#d84c0b] text-[#1c1f26] border border-[#d84c0b] shadow-[0_6px_18px_rgba(216,76,11,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] hover:shadow-[0_8px_24px_rgba(216,76,11,0.7),inset_0_1px_0_rgba(255,255,255,0.5)]"
                      : "bg-linear-to-br from-[#f5efe6]/40 via-[#2a2f38] to-[#1c1f26] text-[#f5efe6] border border-[#3a2f2a] shadow-[0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(245,239,230,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(245,239,230,0.35)]"
                  }`}
                >
                  {project.role}
                </span>
              </div>

                <div className="mt-2">
                  <h3 className="text-3xl mb-4 pr-24 text-[#f5efe6]">
                    {project.name}
                  </h3>
                  <p className="text-[#b8b2a9] leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <motion.div className="absolute bottom-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute w-full h-full bg-linear-to-tl from-[#c6a98b]/10 to-transparent rounded-tl-full rounded-br-2xl" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        }
      </div>
    </div>
  );
}