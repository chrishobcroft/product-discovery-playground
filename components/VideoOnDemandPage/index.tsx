import Spinner from "@components/Spinner";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link,
  Text,
  TextField,
} from "@livepeer/design-system";
import { ArrowTopRightIcon, CheckCircledIcon } from "@modulz/radix-icons";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { MistPlayer } from "@components/MistPlayer";
import { CreateResponse, SignedVideo } from "pages/api/asset/create";
import { LivepeerApiResponse } from "pages/api/asset/[id]";
import { ethers } from "ethers";
import { DOMAIN } from "constants/typedData";
import { l1Provider } from "@lib/chains";
import { CodeBlock } from "@components/CodeBlock";

export const VideoOnDemandPage = ({
  originalIpfsHash,
}: {
  originalIpfsHash?: string;
}) => {
  const account = useAccount();

  const [isImporting, setIsImporting] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [errorImport, setErrorImport] = useState("");
  const [playbackUrl, setPlaybackUrl] = useState("");

  const [ipfsHash, setIpfsHash] = useState<string>(originalIpfsHash || "");

  const [signedVideo, setSignedVideo] = useState<SignedVideo | null>(null);
  const [blockNumber, setBlockNumber] = useState(15015024);

  const [addressAndEnsName, setAddressAndEnsName] = useState({
    address: "",
    ens: "",
  });

  const onSubmitIpfs = async (hash: string) => {
    setIsImporting(true);

    try {
      const res = await fetch("/api/asset/create", {
        method: "POST",
        body: JSON.stringify({
          hash: hash,
        }),
      });
      if (res.ok) {
        const json: CreateResponse = await res.json();

        if (json.outputAssetId) {
          const assetId = json.outputAssetId;

          const signedVideo = json.signedVideo;

          setSignedVideo(json.signedVideo);

          const addr = ethers.utils.verifyTypedData(
            DOMAIN,
            signedVideo.signatureTypes,
            signedVideo.body,
            signedVideo.signature
          );

          let name = "";
          try {
            name = await l1Provider.lookupAddress(addr);
          } catch (e) {}

          setAddressAndEnsName({
            ens: name,
            address: addr,
          });

          const intervalId = setInterval(async () => {
            if (assetId) {
              const res = await fetch(`/api/asset/${assetId}`, {
                method: "GET",
              });

              if (res.ok) {
                const json: LivepeerApiResponse = await res.json();

                if (json?.playbackUrl) {
                  setPlaybackUrl(json?.playbackUrl);

                  clearInterval(intervalId);

                  setIsImporting(false);
                } else if (
                  typeof json.status !== "string" &&
                  json.status?.phase === "failed"
                ) {
                  setIsImporting(false);
                  setErrorImport("Error importing, please try again.");
                  clearInterval(intervalId);
                }
              }
            } else {
              setIsImporting(false);
              setErrorImport("Error importing, please try again.");
              clearInterval(intervalId);
            }
          }, 3000);
        } else {
          setErrorImport(json.error);
          setIsImporting(false);
        }
      } else {
        setErrorImport("Error importing, please try again.");
        setIsImporting(false);
      }
    } catch (e) {
      console.error(e);
      setIsImporting(false);
    }
  };

  useEffect(() => {
    setIpfsHash(originalIpfsHash);
  }, [originalIpfsHash]);

  useEffect(() => {
    (async () => {
      if (signedVideo?.body?.creationBlockHash) {
        const block = await l1Provider.getBlock(
          signedVideo?.body.creationBlockHash
        );

        if (block?.number) {
          setBlockNumber(block.number);
        }
      }
    })();
  }, [signedVideo?.body?.creationBlockHash]);

  return (
    <>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$3",
            width: "100%",
            "@bp3": {
              mt: "$6",
            },
          }}
        >
          <Box css={{ maxWidth: 600 }}>
            <Heading
              as="h1"
              css={{
                color: "$hiContrast",
                fontSize: "$3",
                fontWeight: 600,
                mb: "$5",
                display: "none",
                alignItems: "center",
                "@bp2": {
                  fontSize: "$7",
                },
                "@bp3": {
                  display: "flex",
                  fontSize: "$7",
                },
              }}
            >
              View VOD
            </Heading>
            <Text css={{ mb: "$3" }}>
              Watch content imported from an IPFS CID using the Livepeer
              protocol.
            </Text>
            <TextField
              placeholder="IPFS CID"
              size="2"
              css={{
                mb: "$2",
              }}
              disabled={isImporting || originalIpfsHash}
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
            />
            <Button
              variant="primary"
              size={2}
              disabled={isImporting || !ipfsHash || ipfsHash.length !== 46}
              onClick={() => ipfsHash.length === 46 && onSubmitIpfs(ipfsHash)}
            >
              Verify & View VOD
            </Button>

            {errorImport ? (
              <Text css={{ color: "$red11", mt: "$3" }}>
                {errorImport || "Error with address."}
              </Text>
            ) : isImporting ? (
              <Box css={{ mt: "$4" }}>
                <Spinner />
              </Box>
            ) : (
              playbackUrl &&
              signedVideo?.body &&
              ipfsHash &&
              (ipfsHash.length === 46 || ipfsHash.length === 59) && (
                <Box css={{ mt: "$2" }}>
                  <Flex css={{ justifyContent: "flex-end" }}>
                    <Link
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://infura-ipfs.io/ipfs/${ipfsHash}`}
                    >
                      <Button variant="primary">
                        View signature metadata{" "}
                        <Box as={ArrowTopRightIcon} css={{ ml: "$1" }} />
                      </Button>
                    </Link>
                  </Flex>
                  <CodeBlock id="signatureBody" css={{ mt: "$2" }}>
                    {JSON.stringify(signedVideo, null, 2)}
                  </CodeBlock>
                  <Box css={{ mt: "$2", mb: "$8" }}>
                    <Box css={{ position: "relative" }}>
                      <MistPlayer src={playbackUrl} />
                      <Box
                        css={{
                          position: "absolute",
                          top: 6,
                          left: 12,
                        }}
                      >
                        <Box>
                          {signedVideo?.body?.metadata?.name && (
                            <Flex css={{ justifyContent: "flex-start" }}>
                              <Text
                                size="2"
                                css={{
                                  mt: "$1",
                                  fontWeight: 600,
                                }}
                              >
                                {signedVideo?.body?.metadata?.name}
                              </Text>
                            </Flex>
                          )}
                          {signedVideo?.body?.metadata?.description && (
                            <Flex css={{ justifyContent: "flex-start" }}>
                              <Text
                                size="1"
                                css={{
                                  fontWeight: 400,
                                }}
                              >
                                {signedVideo?.body?.metadata?.description}
                              </Text>
                            </Flex>
                          )}
                          {signedVideo?.body?.metadata?.ownerAddress && (
                            <Flex css={{ justifyContent: "flex-start" }}>
                              <Text
                                size="1"
                                css={{
                                  fontWeight: 400,
                                }}
                              >
                                {signedVideo?.body?.metadata?.ownerAddress}
                              </Text>
                            </Flex>
                          )}
                          {signedVideo?.body?.metadata?.externalId && (
                            <Flex css={{ justifyContent: "flex-start" }}>
                              <Text
                                size="1"
                                css={{
                                  fontWeight: 400,
                                }}
                              >
                                {signedVideo?.body?.metadata?.externalId}
                              </Text>
                            </Flex>
                          )}
                        </Box>
                      </Box>
                      <Box
                        css={{
                          position: "absolute",
                          top: 10,
                          right: 12,
                        }}
                      >
                        <Box>
                          <Flex
                            css={{
                              color: "white",
                              "&:hover": {
                                color: "hsla(0,100%,100%,.85)",
                              },
                              cursor: "pointer",
                              justifyContent: "flex-end",
                            }}
                            align="center"
                            onMouseEnter={() => setIsHover(true)}
                            onMouseLeave={() => setIsHover(false)}
                          >
                            <Box
                              css={{
                                fontSize: "$2",
                                mr: "$1",
                                fontWeight: 600,
                              }}
                            >
                              {addressAndEnsName.ens
                                ? addressAndEnsName.ens
                                : addressAndEnsName.address?.replace(
                                    addressAndEnsName.address?.slice(5, 38),
                                    "…"
                                  ) ?? ""}
                            </Box>
                            <Box as={CheckCircledIcon} />
                          </Flex>
                          <Flex css={{ justifyContent: "flex-end" }}>
                            {isHover && signedVideo?.body?.creationBlockHash && (
                              <Text
                                size="2"
                                css={{
                                  fontWeight: 600,
                                }}
                              >
                                Creation Block #: {blockNumber}
                              </Text>
                            )}
                          </Flex>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};
