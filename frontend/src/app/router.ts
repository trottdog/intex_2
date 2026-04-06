export type RouteMatch = {
  params: Record<string, string>
  pattern: string
}

export function matchPath(pattern: string, pathname: string): RouteMatch | null {
  const patternSegments = trim(pattern).split('/')
  const pathSegments = trim(pathname).split('/')

  if (patternSegments.length !== pathSegments.length) {
    return null
  }

  const params: Record<string, string> = {}

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]
    const pathSegment = pathSegments[index]

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment)
      continue
    }

    if (patternSegment !== pathSegment) {
      return null
    }
  }

  return { params, pattern }
}

function trim(value: string) {
  return value.replace(/^\/+|\/+$/g, '')
}
