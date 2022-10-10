export function indent (str: string, linePrefix: string): string {
  return str.replaceAll(/(\n|\r|\r\n)/g, '$&' + linePrefix)
}
