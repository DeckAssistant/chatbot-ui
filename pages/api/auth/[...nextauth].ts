import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import OAuthConfig from 'next-auth/providers/oauth';
import redirect from 'nextjs-redirect'

const providers = [];
if (process.env.GOOGLE_CLIENT_ID) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      // Needed to be able to select a different google accounts each time.
      authorization: {
        params: {
          prompt: 'login',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  );
}
if (process.env.GITHUB_CLIENT_ID) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  );
}

function CustomOAuthProvider(options: Partial<import('next-auth/providers/oauth').OAuthConfig<any>>): import('next-auth/providers/oauth').OAuthConfig<any>;
function CustomOAuthProvider(options : Partial<import('next-auth/providers/oauth').OAuthConfig<any>>): import('next-auth/providers/oauth').OAuthConfig<any> {
  return {
    id: "deckassistant",
    name: "DeckAssistant",
    type: "oauth",
    clientId: process.env.CUSTOM_OAUTH_CLIENT_ID,
    clientSecret: process.env.CUSTOM_OAUTH_CLIENT_SECRET,
    authorization: {
      url: process.env.CUSTOM_OAUTH_URL + "/oauth/authorize",
      params: {
        scope: ""
      }
    },
    token: process.env.CUSTOM_OAUTH_URL + "/oauth/token",
    userinfo: process.env.CUSTOM_OAUTH_URL + "/api/oauth/user/me",
    profile(profile : any) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        image: null
      }
    },
  };
}

if(process.env.CUSTOM_OAUTH_URL) {
  providers.push(CustomOAuthProvider({
    id: "deckassistant",
  }));
}

export const authOptions: NextAuthOptions = {
  providers: providers,
  session: {
    strategy: 'jwt',
    maxAge: 3 * 24 * 60 * 60,
  },
};

export default NextAuth(authOptions);
