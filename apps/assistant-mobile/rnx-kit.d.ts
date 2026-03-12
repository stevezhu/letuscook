declare module '@rnx-kit/metro-config' {
  type MetroConfig = import('@react-native/metro-config').MetroConfig;
  type InputConfig = MetroConfig & {
    platform?: string;
    unstable_allowAssetsOutsideProjectRoot?: boolean;
  };
  export function makeMetroConfig(config: InputConfig): MetroConfig;
}
