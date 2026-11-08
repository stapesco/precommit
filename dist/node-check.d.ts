/**
 * Runtime Node.js version check. Fails fast with a clear error rather than
 * letting some downstream feature explode with a confusing cryptic message.
 *
 * Engines declared >= 22.12.0 in package.json. The minor is part of the floor:
 * commander 15 requires Node 22.12.0 or newer, so a 22.0 runtime cannot run
 * this build even though its major version is recent enough.
 */
/**
 * Is this Node.js version at or above the supported floor?
 * Returns false for anything unparseable rather than assuming a safe version.
 */
export declare function isSupportedNodeVersion(version: string): boolean;
export declare function assertNodeVersion(): void;
