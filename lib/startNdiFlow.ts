export async function startNdiFlow(redirectPath: string) {
  const authRes = await fetch("http://localhost:3001/api/ndi/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!authRes.ok) {
    throw new Error("NDI authentication failed");
  }

  const authResult = await authRes.json();
  const accessToken = authResult?.access_token;

  if (!accessToken) {
    throw new Error("Access token missing");
  }

  const proofRes = await fetch(
    "http://localhost:3001/api/ndi-verifier/proof-request",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const proofResult = await proofRes.json();

  if (!proofRes.ok) {
    throw new Error("Proof request failed");
  }

  sessionStorage.setItem(
    "ndiProof",
    JSON.stringify({
      proofRequestURL: proofResult.data.proofRequestURL,
      threadId: proofResult.data.threadId,
      deepLinkURL: proofResult.data.deepLinkURL,
    })
  );

  return `/qr-scan?redirect=${encodeURIComponent(redirectPath)}`;
}