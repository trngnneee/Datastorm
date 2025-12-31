"use client"

import Link from "next/link";
import { Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export default function MapLayout({ children }) {
  const pathName = usePathname();
  const navList = [
    {
      Icon: Home,
      link: "/",
      title: "Home",
    },
    {
      Icon: User,
      link: "/user",
      title: "User",
    },
  ]
  
  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-[20vw] border-r border-r-gray-300 py-5 flex flex-col items-center bg-white z-50">
        <div className="text-[24px] font-bold">
          DOM Team - Dashboard
        </div>
        <div className="w-full mt-5 flex flex-col gap-2">
          {navList.map((item, index) => {
            const isActive = pathName === item.link;

            return (
              <Link
                key={index}
                href={item.link}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3 ml-3 mr-2 rounded transition-colors",
                  isActive
                    ? "bg-[#2B3674] text-white"
                    : "text-black hover:bg-gray-100"
                )}
              >
                <div className={cn(
                  "bg-[#2B3674] w-[5px] absolute -left-3 top-0 bottom-0 rounded-r",
                  pathName === item.link ? "block" : "hidden"
                )}></div>

                <item.Icon />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <div>{children}</div>
    </>
  )
}