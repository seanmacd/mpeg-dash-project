export const formatBitrate = (bps: number): string => {
  if (bps >= 1_000_000) {
    const mbps = bps / 1_000_000
    return `${mbps % 1 === 0 ? mbps : mbps.toFixed(1)}Mbps`
  }

  if (bps >= 1_000) {
    const kbps = bps / 1_000
    return `${kbps % 1 === 0 ? kbps : kbps.toFixed(1)}kbps`
  }

  return `${bps}bps`
}
