/**
 * Runtime Node.js version check. Fails fast with a clear error rather than
 * letting some downstream feature explode with a confusing cryptic message.
 *
 * Engines declared >= 18.0.0 in package.json. We accept >=18 but warn about
 * non-LTS versions below 20 (some downstream features rely on stable APIs).
 */
export declare function assertNodeVersion(): void;
