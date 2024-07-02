import { TransformOptions } from '@babel/core';

const config: TransformOptions = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current', // Or specify your target environment
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Add any Babel plugins you might need here
  ],
};

export default config;