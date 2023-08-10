import Head from "next/head";
import { type AppType } from "next/app";

import { Toaster } from "@/features/shared/components/ui/toaster";

import { api } from "@/server/lib/api";

import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>🤙 Contribute to great products together</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="Monto" />
        <meta
          property="og:description"
          content="⚡ Contribute to great projects together"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.montoapp.com/" />
      </Head>
      <ClerkProvider
        {...pageProps}
        appearance={{
          layout: {
            socialButtonsVariant: "blockButton",
            logoPlacement: "outside",
          },
          variables: {
            colorPrimary: "#9ca3af",
            borderRadius: "4px",
          },
          elements: {
            card: "shadow-none border-slate-200 rounded-md",
          },
        }}
      >
        <Component {...pageProps} />
        <Toaster />
      </ClerkProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
