import {Project, Configuration, Cache, Report, LightReport, StreamReport} from '@yarnpkg/core';
import {npath} from '@yarnpkg/fslib';
import * as Path from 'path';
import * as fs from 'fs';
import { SimpleSettingsDefinition } from '@yarnpkg/core/lib/Configuration';

const __rootdir = Path.resolve(__dirname, '..');
const autopnpDir = Path.resolve(__rootdir, '.autopnp');
const cacheRootDir = Path.join(autopnpDir, 'cache');
const yarnCacheDir = Path.join(autopnpDir, 'yarn-cache');
const yarnCacheDirPortable = npath.toPortablePath(yarnCacheDir);

fs.mkdirSync(cacheRootDir, {recursive: true});
fs.mkdirSync(yarnCacheDir, {recursive: true});

async function installIntoCache(moduleName: string, version: string) {
    const cacheEntryName = `${ moduleName }@${ version }`;
    const cacheEntryDir = Path.join(cacheRootDir, cacheEntryName);
    fs.mkdirSync(cacheEntryDir, {recursive: true});

    const cacheEntryDirPortable = npath.toPortablePath(cacheEntryDir);
    const configuration = Configuration.create(cacheEntryDirPortable);
    (configuration.settings.get('cacheFolder') as SimpleSettingsDefinition).values = [yarnCacheDir];
    const project = new Project(cacheEntryDirPortable, {configuration});
    Project.find
    const cache = new Cache(yarnCacheDirPortable, {
        configuration
    });

    await project.restoreInstallState();
  
    // TODO switch to ThrowReport
    const report = await StreamReport.start({
        configuration,
        stdout: process.stdout
    }, async (report: StreamReport) => {
        await project.install({cache, report});
    });

    return report.exitCode();
}

installIntoCache('', '');