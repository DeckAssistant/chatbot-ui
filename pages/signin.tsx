import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const Signin = () => {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn("deckassistant");
    } else if (status === "authenticated") {
      void router.push("/");
    }
  }, [status, router]);

  return (
  <div>
    <Head>
      <title>DeckAssistant - Logging in..</title>
    </Head>
  </div>);
}

export default Signin;
