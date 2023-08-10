import { type NextPage } from "next";

import { Button } from "@/features/shared/components/ui/button";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex h-screen items-center justify-center px-4 text-center sm:px-8 ">
        <div className="-mt-6 flex max-w-[770px] flex-col items-center justify-center gap-2 text-center">
          <div className="animate-shake text-6xl md:text-7xl">🤙</div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
            Contribute to great products together.
          </h1>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link href="/issues">
              <Button size="lg">Get started</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
