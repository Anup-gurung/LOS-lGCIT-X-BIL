import { resetNDIScanCount } from "./indexDB";

export async function startNdiFlow(
  redirectPath?: string,
  role: "applicant" | "co-applicant" | "guarantor" = "applicant",
  emailId?: string,
  // refId?: string,
  mode: "redirect" | "inline" = "redirect"
): Promise<
  | string
  | {
      proofRequestURL: string;
      qrCodeImage: string;
      threadId: string;
      deepLinkURL: string;
    }
> {
  console.log("Starting NDI flow with:", {
    redirectPath,
    role,
    emailId,
    // refId,
    mode,
  });

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const finalRedirect =
    currentPath === "/login"
      ? "/loan-application?step=1"
      : redirectPath || currentPath;

  // 1️⃣ AUTH
  const authRes = await fetch(`${BACKEND}/api/ndi/auth`, {
    method: "POST",
  });

  if (!authRes.ok) {
    throw new Error("NDI authentication failed");
  }

  const authData = await authRes.json();

  // 2️⃣ PROOF REQUEST (IMPORTANT)
  const proofRes = await fetch(`${BACKEND}/api/ndi-verifier/proof-request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      // refId,       
      email: emailId, // ✅ email for co-borrower
    }),
  });

  if (!proofRes.ok) {
    throw new Error("Proof request failed");
  }

  const proofData = await proofRes.json();
  console.log("NDI Proof Request Response:", proofData);

  const { proofRequestURL, threadId, deepLinkURL, qrCodeImage } =
    proofData.data;

    console.log("threadId received:", threadId);

    // ALWAYS return consistent structure
    const normalized = {
      threadId,
      proofRequestURL,
      qrCodeImage,
      deepLinkURL,
      emailId,
    };
  // 3️⃣ STORE SESSION
  sessionStorage.setItem(
    "ndiProof",
    JSON.stringify({
      proofRequestURL,
      qrCodeImage,
      threadId,
      deepLinkURL,
      redirect: finalRedirect,
      role,
      // refId,
      emailId,
    })
  );

  // 4️⃣ MODE CONTROL
  if (mode === "inline") {
    return normalized;
  }

  return `/qr-scan?redirect=${encodeURIComponent(finalRedirect)}`;
}