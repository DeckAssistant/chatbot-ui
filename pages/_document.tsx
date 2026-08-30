import { DocumentProps, Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

import i18nextConfig from '../next-i18next.config';

type Props = DocumentProps & {
  // add custom document props
};

export default function Document(props: Props) {
  const currentLocale =
    props.__NEXT_DATA__.locale ?? i18nextConfig.i18n.defaultLocale;
  return (
    <Html lang={currentLocale}>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-title"
          content="DeckAssistant - Chatbot UI"
        ></meta>
        <meta
          name="title"
          content="DeckAssistant - AI Assistant for Stream Deck"
        />
        <meta
          name="description"
          content="Stream Deck plugin that puts A.I. at your fingertips. Literally."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="DeckAssistant - AI Assistant for Stream Deck"
        />
        <meta
          property="og:description"
          content="Stream Deck plugin that puts A.I. at your fingertips. Literally."
        />
        <meta
          property="og:image"
          content="https://deckassistant.io/images/poster.png"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:title"
          content="DeckAssistant - AI Assistant for Stream Deck"
        />
        <meta
          property="twitter:description"
          content="Stream Deck plugin that puts A.I. at your fingertips. Literally."
        />
        <meta
          property="twitter:image"
          content="https://deckassistant.io/images/poster.png"
        />
        <Script
          defer
          data-site-id="d383266086e6"
          src="https://konijn.lostdomain.org/api/script.js"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
