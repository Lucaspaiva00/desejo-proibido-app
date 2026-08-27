import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";

export function getIceServers() {
  const servers: any[] = [
    { urls: process.env.EXPO_PUBLIC_STUN_URL || "stun:stun.l.google.com:19302" },
  ];

  const turnUrl = process.env.EXPO_PUBLIC_TURN_URL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: process.env.EXPO_PUBLIC_TURN_USER || "",
      credential: process.env.EXPO_PUBLIC_TURN_PASSWORD || "",
    });
  }

  return servers;
}

export function createPeer() {
  return new RTCPeerConnection({ iceServers: getIceServers() } as any);
}

export async function obterMidiaLocal(): Promise<MediaStream> {
  const stream = await mediaDevices.getUserMedia({
    audio: true,
    video: {
      facingMode: "user",
      frameRate: 24,
      width: 720,
      height: 1280,
    } as any,
  });
  return stream as MediaStream;
}

export function fecharStream(stream?: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function addStreamTracks(peer: RTCPeerConnection, stream: MediaStream) {
  stream.getTracks().forEach((track) => (peer as any).addTrack(track, stream));
}

export async function setRemoteSdp(peer: RTCPeerConnection, sdp: any) {
  await peer.setRemoteDescription(new RTCSessionDescription(sdp));
}

export async function addIce(peer: RTCPeerConnection, candidate: any) {
  if (!candidate) return;
  await peer.addIceCandidate(new RTCIceCandidate(candidate));
}
