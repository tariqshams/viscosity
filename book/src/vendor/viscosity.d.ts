declare module '*/vendor/viscosity.js' {
  export function viscosity(source: string, opts?: Record<string, unknown>): { code: string; explain: string; collections: { name: string; layout: string; fields: string[]; numericFields: string[]; reasons: string[] }[] };
}
