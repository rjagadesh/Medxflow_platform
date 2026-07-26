// Helper to decode mu-law
export function decodeMulaw(pcm) {
  pcm = ~pcm;
  let sign = pcm & 0x80;
  let exponent = (pcm & 0x70) >> 4;
  let mantissa = pcm & 0x0f;
  let sample = (mantissa << 3) + 132;
  sample <<= exponent;
  sample -= 132;
  return sign ? -sample : sample;
}

// Helper to encode Mu-law
export function encodeMulaw(sample) {
  const BIAS = 0x84;
  const CLIP = 32635;
  let sign = sample < 0 ? 0x80 : 0;
  if (sign) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += BIAS;
  let exponent = 7;
  for (let i = 0x4000; (sample & i) === 0 && exponent > 0; i >>= 1) exponent--;
  let mantissa = (sample >> (exponent + 3)) & 0x0f;
  return ~(sign | (exponent << 4) | mantissa);
}
