import type { NextApiRequest, NextApiResponse } from "next";

import FormData from "form-data";
import fetch from "node-fetch";

type IPFSUploadResponse = {
  Hash: string;
  Name: string;
  Size: string;
};

export type UploadResponse = {
  hash?: string;
  error?: string;
};

const requestHandler = async (
  req: NextApiRequest,
  res: NextApiResponse<UploadResponse>
) => {
  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const INFURA_IPFS_ID = process.env.INFURA_IPFS_ID;
    const INFURA_IPFS_SECRET = process.env.INFURA_IPFS_SECRET;

    if (!INFURA_IPFS_ID || !INFURA_IPFS_SECRET) {
      throw new Error("Missing INFURA_IPFS_ID and INFURA_IPFS_SECRET");
    }

    const formData = new FormData();

    formData.append("file", JSON.stringify(body));

    const response = await fetch(
      "https://ipfs.infura.io:5001/api/v0/add?pin=true",
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization:
            "Basic " + btoa(INFURA_IPFS_ID + ":" + INFURA_IPFS_SECRET),
        },
      }
    );

    if (response.ok) {
      const json = (await response.json()) as IPFSUploadResponse;

      return res.status(200).json({
        hash: json?.Hash ?? "",
      });
    } else {
      console.error(response);
    }
  } else {
    // Handle any other HTTP method
    return res
      .status(405)
      .json({ error: `Method '${req.method}' Not Allowed` });
  }

  return res.status(500).json({ error: `An error occurred.` });
};

export default requestHandler;
