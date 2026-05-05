import { KJUR } from 'jsrsasign';

export const generateSignature = (meetingNumber: string, role: number) => {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2; // 2 hours

  const oHeader = { alg: 'HS256', typ: 'JWT' };

  const oPayload = {
    sdkKey: process.env.ZOOM_SDK_KEY || process.env.ZOOM_CLIENT_ID,
    mn: parseInt(meetingNumber),
    role: role,
    iat: iat,
    exp: exp,
    appKey: process.env.ZOOM_SDK_KEY || process.env.ZOOM_CLIENT_ID,
    tokenExp: exp
  };

  console.log("🔐 Signing Payload:", JSON.stringify(oPayload, null, 2));

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);
  
  const sdkSecret = process.env.ZOOM_SDK_SECRET || process.env.ZOOM_CLIENT_SECRET;
  
  if (sdkSecret) {
    console.log(`🔐 Using secret starting with: ${sdkSecret.substring(0, 3)}... and ending with ...${sdkSecret.substring(sdkSecret.length - 3)}`);
  } else {
    console.log("❌ NO SECRET FOUND!");
  }
  
  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret!);
  return signature;
};
