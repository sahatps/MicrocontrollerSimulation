const stripLeadingSlashes = (value) => String(value || '').replace(/^\/+/, '')

export const publicAssetUrl = (path) =>
  `${import.meta.env.BASE_URL}${stripLeadingSlashes(path)}`

export const appUrl = (path) => {
  const blocksBaseUrl = new URL(import.meta.env.BASE_URL, window.location.origin)
  return new URL(`../${stripLeadingSlashes(path)}`, blocksBaseUrl).toString()
}
