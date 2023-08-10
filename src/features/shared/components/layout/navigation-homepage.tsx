import Link from "next/link";
import Image from "next/image";
import { Button } from "@/features/shared/components/ui/button";
// import { useAuth } from "@clerk/nextjs";
// import { ArrowRight } from "lucide-react";

const NavigationHomepage = () => {
  return (
    <nav className="sticky top-0 z-40 w-full border-b border-b-slate-200 bg-white dark:border-b-slate-700">
      <div className="container m-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex flex-1">
          <Link href="/" className="flex cursor-pointer items-center">
            <div className="flex cursor-pointer items-center gap-2">
              <Image src="/logo.svg" alt="logo" width={85} height={22} />
            </div>
          </Link>
        </div>
        <NavigationRight />
      </div>
    </nav>
  );
};

const NavigationRight = () => {
  return (
    <div className="flex gap-2">
      <Link href="/issues">
        <Button>Get started</Button>
      </Link>
    </div>
  );
  // const { isSignedIn, isLoaded } = useAuth();

  // if (!isLoaded) return null;

  // if (isSignedIn) {
  //   return (
  //     <Link href="/dashboard">
  //       <Button>
  //         Dashboard
  //         <ArrowRight className="ml-2 h-4 w-4" />
  //       </Button>
  //     </Link>
  //   );
  // }

  // return (
  //   <div className="flex gap-2">
  //     <Link href="/sign-in">
  //       <Button variant="ghost">Login</Button>
  //     </Link>
  //     <Link href="/sign-up">
  //       <Button>Sign up</Button>
  //     </Link>
  //   </div>
  // );
};

export { NavigationHomepage };
