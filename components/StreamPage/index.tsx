import { StreamStoredAttributes } from "@components/CreateStreamDialog";
import { MistPlayer } from "@components/MistPlayer";
import Spinner from "@components/Spinner";
import { l1Provider } from "@lib/chains";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
} from "@livepeer/design-system";
import { CheckCircledIcon } from "@modulz/radix-icons";
import { DOMAIN } from "constants/typedData";
import { getAddress, verifyTypedData } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";

export const IPFS_CONTENT_KEY = "ipfs-content";

export const StreamPage = ({
  originalEthAddress,
}: {
  originalEthAddress?: string;
}) => {
  const account = useAccount();

  const [isLoading, setIsLoading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [ethAddress, setEthAddress] = useState({
    address: originalEthAddress ?? "",
    ensName: "",
  });

  const [storedAttributes, setStoredAttributes] =
    useState<StreamStoredAttributes | null>(null);
  const [blockNumber, setBlockNumber] = useState(15015024);

  // const streamParams: SignedStream | null = useMemo(
  //   () =>
  //     streamKey
  //       ? (JSON.parse(
  //           Buffer.from(streamKey, "base64").toString()
  //         ) as SignedStream)
  //       : null,
  //   [streamKey]
  // );

  useEffect(() => {
    setSearch(originalEthAddress);
  }, [originalEthAddress]);

  useEffect(() => {
    if (window && localStorage) {
      const blockHashLocal = localStorage.getItem(IPFS_CONTENT_KEY);

      if (blockHashLocal) {
        return setStoredAttributes(JSON.parse(blockHashLocal));
      }
    }
    setStoredAttributes({
      name: "Awesome Stream",
      description: "An incredible stream",
      ownerAddress: search,
      creationBlockHash:
        "0x5dd148da1733a676f31577bfe815032b7e6c44ee9a77fd10d61cf5980e76523a",
    });
  }, [search]);

  useEffect(() => {
    (async () => {
      if (storedAttributes) {
        const block = await l1Provider.getBlock(
          storedAttributes.creationBlockHash
        );

        if (block?.number) {
          setBlockNumber(block.number);
        }
      }
    })();
  }, [storedAttributes]);

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
              View Stream
            </Heading>
            <Text css={{ mb: "$3" }}>
              Stream live content based on an ENS name or Ethereum address.
            </Text>
            <TextField
              placeholder="Ethereum address (0xab9...)"
              size="2"
              css={{
                mb: "$2",
              }}
              disabled={originalEthAddress}
              defaultValue={originalEthAddress}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              variant="primary"
              size={2}
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                if (search) {
                  setError("");

                  setIsOpen(true);

                  try {
                    if (search.length === 42) {
                      const address = await getAddress(search);
                      const name = await l1Provider.lookupAddress(search);

                      if (name) {
                        setEthAddress((prev) => ({
                          ...prev,
                          address: address,
                          ensName: name,
                        }));
                      } else {
                        const address = await getAddress(search);
                        setEthAddress((prev) => ({
                          ...prev,
                          address: address,
                          ensName: "",
                        }));
                      }
                    } else {
                      const address = await l1Provider.resolveName(search);

                      if (address) {
                        setEthAddress((prev) => ({
                          ...prev,
                          ensName: search,
                          address: address,
                        }));
                      }
                    }
                  } catch (e) {
                    console.error(e);
                    setError("Error with ENS name or address.");
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
            >
              Verify & View Stream
            </Button>

            {isOpen &&
              (isLoading ? (
                <Box css={{ mt: "$4" }}>
                  <Spinner />
                </Box>
              ) : error || (!ethAddress.address && !ethAddress.ensName) ? (
                <Text css={{ color: "$red11", mt: "$3" }}>
                  {error || "Error with address."}
                </Text>
              ) : (
                <Box css={{ mt: "$4" }}>
                  {/* <Text css={{ mb: "$3" }}>Stream parameters:</Text>
                  <CodeBlock id="ethAddress" css={{ mb: "$3" }}>
                    {JSON.stringify(ethAddress, null, 2)}
                  </CodeBlock> */}
                  <Box css={{ position: "relative" }}>
                    <MistPlayer
                      src={`https://playback.livepeer.name/hls/stream+${String(
                        ethAddress.address
                      ).toLowerCase()}/index.m3u8`}
                    />
                    <Box
                      css={{
                        position: "absolute",
                        top: 6,
                        left: 12,
                      }}
                    >
                      <Box>
                        {storedAttributes?.name && (
                          <Flex css={{ justifyContent: "flex-start" }}>
                            <Text
                              size="2"
                              css={{
                                mt: "$1",
                                fontWeight: 600,
                              }}
                            >
                              {storedAttributes?.name}
                            </Text>
                          </Flex>
                        )}
                        {storedAttributes?.description && (
                          <Flex css={{ justifyContent: "flex-start" }}>
                            <Text
                              size="1"
                              css={{
                                fontWeight: 400,
                              }}
                            >
                              {storedAttributes?.description}
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
                            {ethAddress.ensName
                              ? ethAddress.ensName
                              : ethAddress.address?.replace(
                                  ethAddress.address?.slice(5, 38),
                                  "…"
                                ) ?? ""}
                          </Box>
                          <Box as={CheckCircledIcon} />
                        </Flex>
                        <Flex css={{ justifyContent: "flex-end" }}>
                          {isHover && blockNumber && (
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
              ))}
          </Box>
        </Flex>
      </Container>
    </>
  );
};
