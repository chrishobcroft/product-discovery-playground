import { ApolloProvider } from "@apollo/client";
import { IdProvider } from "@radix-ui/react-id";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { L1_CHAIN, DEFAULT_CHAIN, INFURA_KEY } from "lib/chains";
import rainbowTheme from "constants/rainbowTheme";
import Layout from "layouts/main";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";
import "react-circular-progressbar/dist/styles.css";
import { CookiesProvider } from "react-cookie";
import { WagmiConfig, createClient, configureChains } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { useApollo } from "../apollo";
import "video-react/dist/video-react.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

function App({ Component, pageProps }) {
  const client = useApollo(pageProps.initialApolloState);

  const { route } = useRouter();

  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const { wagmiClient, chains, layoutKey } = useMemo(() => {
    const { provider, chains } = configureChains(
      [isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN],
      [infuraProvider({ infuraId: INFURA_KEY }), publicProvider()]
    );

    const { connectors } = getDefaultWallets({
      appName: "Livepeer",
      chains,
    });

    const wagmiClient = createClient({
      autoConnect: true,
      connectors,
      provider,
    });

    return {
      wagmiClient,
      chains,
      layoutKey: chains.map((e) => e.id).join(","),
    };
  }, [isMigrateRoute]);

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Product Discovery</title>
      </Head>
      <ApolloProvider
        key={layoutKey} // triggers a re-render of the entire app, to make sure that the chains are not memo-ized incorrectly
        client={client}
      >
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider
            showRecentTransactions={false}
            appInfo={{
              appName: "Livepeer",
              learnMoreUrl: "https://livepeer.org/primer",
            }}
            theme={rainbowTheme}
            chains={chains}
          >
            <ChakraProvider
              theme={extendTheme({
                styles: {
                  global: {
                    // styles for the `body`
                    body: {
                      bg: "hsl(155 7% 8.4%)",
                      color: "white",
                    },
                  },
                },
              })}
            >
              <CookiesProvider>
                <IdProvider>
                  {getLayout(<Component {...pageProps} />)}
                </IdProvider>
              </CookiesProvider>
            </ChakraProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </ApolloProvider>
    </>
  );
}

export default App;
