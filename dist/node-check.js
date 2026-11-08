/**
 * Runtime Node.js version check. Fails fast with a clear error rather than
 * letting some downstream feature explode with a confusing cryptic message.
 *
 * Engines declared >= 22.12.0 in package.json. The minor is part of the floor:
 * commander 15 requires Node 22.12.0 or newer, so a 22.0 runtime cannot run
 * this build even though its major version is recent enough.
 */
const MIN_NODE_MAJOR = 22;
const MIN_NODE_MINOR = 12;
/**
 * Is this Node.js version at or above the supported floor?
 * Returns false for anything unparseable rather than assuming a safe version.
 */
export function isSupportedNodeVersion(version) {
    // split() always yields strings, so a missing segment is "" and parseInt
    // returns NaN. No default is needed: NaN is the unparseable case.
    const [majorRaw = "", minorRaw = ""] = version.split(".");
    const major = Number.parseInt(majorRaw, 10);
    const minor = Number.parseInt(minorRaw, 10);
    if (!Number.isFinite(major))
        return false;
    if (major > MIN_NODE_MAJOR)
        return true;
    if (major < MIN_NODE_MAJOR)
        return false;
    // Same major: the minor decides.
    return Number.isFinite(minor) && minor >= MIN_NODE_MINOR;
}
export function assertNodeVersion() {
    const v = process.versions.node;
    if (!isSupportedNodeVersion(v)) {
        process.stderr.write(`error: stapes-precommit requires Node.js >= ${MIN_NODE_MAJOR}.${MIN_NODE_MINOR}.0; you are running ${v}.\n` +
            `Upgrade Node and retry: https://nodejs.org/en/download\n`);
        process.exit(2);
    }
}
//# sourceMappingURL=node-check.js.map