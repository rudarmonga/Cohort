"use client";

import Image from "next/image";
import landingPage from "../../public/landingPage.jpeg";
import logo from "../../public/logo.webp";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0F1113] text-[#E5D3C2] overflow-hidden">

      <div className="fixed top-0 left-0 w-full z-50 backdrop-md bg-black/40">
        <div className="flex items-center justify-between px-10 py-4">
          <div className="flex items-center gap-2">
            <Image src={logo} alt="logo" width={60} height={60} />
            <span className="text-lg font-semibold">COHORT</span>
          </div>

          <div className="flex gap-4">
            <Link href={"/login"}>
              <button className="px-4 py-2 rounded-md hover:bg-amber-50 hover:text-black cursor-pointer"> 
                Login
              </button>
            </Link>
            <Link href={"/signup"}>
              <button className="px-4 py-2 bg-[#C8A98D] hover:bg-[#ffe3ca] text-black rounded-md cursor-pointer">
                Join
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute right-0 top-0 w-[65%] h-full">
        <Image
          src={landingPage}
          alt="landing"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-linear-to-l from-transparent via-[#0F1113]/60 to-[#0F1113]" />
      </div>

      <div className="relative z-10 flex flex-col justify-center min-h-screen px-16 max-w-2xl">
        
        <h1 className="text-6xl font-bold leading-tight">
          Build Something <br />
          <span className="text-[#C8A98D]">Amazing</span>
        </h1>

        <p className="mt-6 text-gray-400">
          Create, collaborate, and launch faster with a modern workspace designed for developers.
        </p>

        <div className="mt-8 flex gap-4">
          <Link href={"/signup"}>
            <button className="px-6 py-3 bg-[#C8A98D] hover:bg-[#ffe3ca] text-black rounded-md cursor-pointer">
              Get Started
            </button>
          </Link>
          <button className="px-6 py-3 border border-gray-600 rounded-md cursor-pointer">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}