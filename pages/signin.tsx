import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";

const Signin = () => {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      void signIn("deckassistant");
    } else if (status === "authenticated") {
      void router.push("/");
    }
  }, [status]);

  return <div></div>;
}

export default Signin;
