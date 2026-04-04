export function checkHeading(str) {
  return /^(\*)(\*)|(.*)\*$/.test(str);
}

export function replaceHeadingStart(str) {
  return str.replace(/^(\*)(\*)|(\*)$/g, "");
}
