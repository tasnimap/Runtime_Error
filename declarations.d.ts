// lucide-react ships its own types in dist/lucide-react.d.ts
// This declaration ensures TypeScript can resolve it under 'bundler' moduleResolution
declare module 'lucide-react' {
  export * from 'lucide-react/dist/lucide-react';
}
