export async function startNdiFlow(redirectPath?: string) {

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL

  // Detect current page
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/"

  // If called from login → force redirect to loan application
  const finalRedirect =
    currentPath === "/login"
      ? "/loan-application?step=1"
      : redirectPath || currentPath

  // 1 Authenticate
  const authRes = await fetch(`${BACKEND}/api/ndi/auth`, {
    method: "POST",
  })

  if (!authRes.ok) {
    throw new Error("NDI authentication failed")
  }

  const authData = await authRes.json()

  // 2 Request proof
  const proofRes = await fetch(`${BACKEND}/api/ndi-verifier/proof-request`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authData.access_token}`,
    },
  })

  if (!proofRes.ok) {
    throw new Error("Proof request failed")
  }



  const proofData = await proofRes.json()
  // const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const { proofRequestURL, threadId, deepLinkURL, qrCodeImage } = proofData.data

  const isMobile = 
    typeof window !== "undefined" &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  // 3 Store session
  sessionStorage.setItem(
    "ndiProof",
    JSON.stringify({
      proofRequestURL,
      qrCodeImage,
      threadId,
      deepLinkURL,
      redirect: finalRedirect,
    })
  )


  // 4 Redirect to QR page
  console.log("Redirecting to QR scan with:", {
    proofRequestURL,
    threadId,
    deepLinkURL,
    finalRedirect,
  })
    if (isMobile) {
    console.log("Mobile detected, redirecting to deep link:", deepLinkURL)
    return deepLinkURL
  }
  
  return `/qr-scan?redirect=${encodeURIComponent(finalRedirect)}`
}