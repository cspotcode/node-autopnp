import { Project, Configuration, Cache, LightReport, StreamReport, ThrowReport } from '@yarnpkg/core';
import { npath } from '@yarnpkg/fslib';
import * as Path from 'path';
import * as fs from 'fs';
import { getPluginConfiguration } from '@yarnpkg/cli';

const __rootdir = Path.resolve(__dirname, '..');
const autopnpDir = Path.resolve(__rootdir, '.autopnp');
const cacheRootDir = Path.join(autopnpDir, 'cache');
const yarnCacheDir = Path.join(autopnpDir, 'yarn-cache');
const yarnCacheDirPortable = npath.toPortablePath(yarnCacheDir);

function ensureCacheExists() {
    fs.mkdirSync(cacheRootDir, { recursive: true });
    fs.mkdirSync(yarnCacheDir, { recursive: true });
}

export async function installIntoCacheIfNeeded(moduleName: string, version: string) {
    ensureCacheExists();

    const cacheEntryName = `${moduleName}@${version}`;
    const cacheEntryDir = Path.resolve(cacheRootDir, cacheEntryName);
    const cacheEntryDirPortable = npath.toPortablePath(cacheEntryDir);
    const cacheEntryInstallMarkerPath = Path.resolve(cacheEntryDir, 'autopnp-installed');

    if (!fs.existsSync(cacheEntryInstallMarkerPath)) {

        fs.mkdirSync(cacheEntryDir, { recursive: true });

        const { modules, plugins } = getPluginConfiguration();
        const configuration = Configuration.create(cacheEntryDirPortable, modules);
        configuration.projectCwd = cacheEntryDirPortable;

        configuration.values.set(`cacheFolder`, yarnCacheDirPortable);
        configuration.sources.set(`cacheFolder`, `<internal>`);
        configuration.values.set(`installStatePath`, Path.resolve(cacheEntryDir, './.yarn/install-state.gz'));
        configuration.sources.set(`installStatePath`, `<internal>`);
        configuration.values.set(`bstatePath`, Path.resolve(cacheEntryDir, './.yarn/bstate'));
        configuration.sources.set(`bstatePath`, `<internal>`);

        configuration.values.set(`pnpDataPath`, Path.resolve(cacheEntryDir, 'pnpData'));
        configuration.values.set(`pnpUnpluggedFolder`, Path.resolve(cacheEntryDir, 'pnpUnplugged'));
        // configuration.values.set(`pnpMode`, TODO);

        fs.writeFileSync(Path.resolve(cacheEntryDir, 'yarn.lock'), '');
        fs.writeFileSync(
            Path.resolve(cacheEntryDir, 'package.json'),
            JSON.stringify({
                name: '__node_autopnp_cache_workspace__',
                dependencies: {
                    [moduleName]: version
                }
            }));

        const { project } = await Project.find(configuration, cacheEntryDirPortable);

        const cache = new Cache(yarnCacheDirPortable, {
            configuration
        });

        // await project.restoreInstallState();

        // TODO switch to ThrowReport
        const report = await StreamReport.start({
            configuration,
            stdout: process.stdout
        }, async (report: StreamReport) => {
            await project.install({ cache, report });
        });

        if (report.exitCode()) throw new Error(`install failed: ${report.exitCode()}`);
        fs.writeFileSync(cacheEntryInstallMarkerPath, '');
    }

    return cacheEntryDir;
}
