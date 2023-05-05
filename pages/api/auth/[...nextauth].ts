import NextAuth, { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

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

if(process.env.CUSTOM_OAUTH_URL) {
  providers.push(
    {
      id: "deckassistant",
      name: "DeckAssistant",
      type: "oauth",
      scope: '',
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
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: null
        }
      },
    }
  );
}

export const authOptions: NextAuthOptions = {
  providers: providers,
  session: { strategy: 'jwt' },
};

export default NextAuth(authOptions);
