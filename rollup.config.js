import { readFileSync } from "fs";
import { join } from "path";
import { cwd } from "process";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const OUTPUT_DIR = "dist-js";

/**
 * Create a base rollup config
 *
 * @param {object} [options] Configuration object
 * @param {string} [options.input] Input path
 * @param {import('rollup').ExternalOption} [options.external] External dependencies list
 * @param {import('rollup').RollupOptions | import('rollup').RollupOptions[]} [options.additionalConfigs] Additional rollup configurations
 *
 * @returns {import('rollup').RollupOptions}
 */
export function createConfig(options = {}) {
  const {
    input = "guest-js/index.ts",
    external = [/^@tauri-apps\/api/],
    additionalConfigs = [],
  } = options;

  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const pkg = JSON.parse(readFileSync(join(cwd(), "package.json"), "utf8"));

  const pluginJsName = pkg.name.replaceAll("-", (x) => "_");
  const iifeVarName = pkg.name.replaceAll("-", (x) => "_");

  // const pluginJsName = pkg.name
  //   .replace("@tauri-apps/plugin-", "")
  //   .replace(/-./g, (x) => x[1].toUpperCase());
  // const iifeVarName = `__TAURI_PLUGIN_${pkg.name
  //   .replace("@tauri-apps/plugin-", "")
  //   .replace("-", (x) => "_")
  //   .toUpperCase()}__`;

  const declarationDir = `./${pkg.exports.import.split("/")[0]}`;

  /** @type {import('rollup').RollupOptions} */
  const config = [
    {
      input,
      output: [
        {
          file: pkg.exports.import,
          format: "esm",
          // dir: OUTPUT_DIR
        },
        {
          file: pkg.exports.require,
          format: "cjs",
          // dir: OUTPUT_DIR
        },
      ],
      plugins: [
        typescript({
          declaration: true,
          emitDeclarationOnly: true,
          outDir: OUTPUT_DIR
        })
      ],
      external: [
        ...external,
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ],
      onwarn: (warning) => {
        throw Object.assign(new Error(), warning);
      },
    },

    {
      input,
      output: {
        format: "iife",
        name: iifeVarName,
        // IIFE is in the format `var ${iifeVarName} = (() => {})()`
        // we check if __TAURI__ exists and inject the API object
        banner: "if ('__TAURI__' in window) {",
        // the last `}` closes the if in the banner
        footer: `Object.defineProperty(window.__TAURI__, '${pluginJsName}', { value: ${iifeVarName} }) }`,
        file: "api-iife.js",
      },
      // and var is not guaranteed to assign to the global `window` object so we make sure to assign it
      plugins: [typescript(), terser(), nodeResolve()],
      onwarn: (warning) => {
        throw Object.assign(new Error(), warning);
      },
    },

    ...(Array.isArray(additionalConfigs)
      ? additionalConfigs
      : [additionalConfigs]),
  ];

  return config;
}

export default createConfig();