"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const child = __importStar(require("child_process"));
const path = __importStar(require("path"));
const tc = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
/**
 * Install Cordova Cli
 *
 * https://www.npmjs.com/package/cordova
 *
 * @param version
 */
function installCordova(version) {
    return __awaiter(this, void 0, void 0, function* () {
        yield installNpmPkg('cordova', version);
        // install cordova-res 
        // https://github.com/ionic-team/cordova-res 
        // await installNpmPkg('cordova-res');
        // Fix access permissions
        yield exec2(`sudo chown -R $USER:$GROUP ~/.npm`);
        yield exec2(`sudo chown -R $USER:$GROUP ~/.config`);
    });
}
exports.installCordova = installCordova;
/**
 * Install Ionic Cli
 *
 * https://www.npmjs.com/package/ionic
 */
function installIonic(version) {
    return __awaiter(this, void 0, void 0, function* () {
        yield installNpmPkg('ionic', version);
    });
}
exports.installIonic = installIonic;
/**
 * Install Java
 *
 */
function installJava() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform === 'linux') {
            yield exec2(path.join(__dirname, 'install-openjdk-8'));
        }
    });
}
exports.installJava = installJava;
/**
 * Install CocoaPods
 *
 */
function installPods() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform === 'darwin') {
            yield exec2(`sudo gem install cocoapods`);
        }
    });
}
exports.installPods = installPods;
/**
 * Install NPM Package
 *
 * @param pkg     : name of package
 * @param version : version
 */
function installNpmPkg(pkg, version) {
    return __awaiter(this, void 0, void 0, function* () {
        // attach cached package
        if (version) {
            const packageDir = tc.find(pkg, version);
            if (packageDir) {
                core.addPath(packageDir);
                return;
            }
        }
        // install npm package
        yield exec2(`sudo npm install -g ${pkg}${version ? '@' + version : ''}`);
        let installedPath = yield exec2(`echo $(npm root -g)/${pkg}`);
        if (!installedPath) {
            return;
        }
        // remove linebreak in the command 
        installedPath = installedPath.replace(/(\r\n|\n|\r)/gm, "");
        if (!version) {
            // installed version
            version = (yield exec2(`node -p "require('${installedPath}/package.json').version"`));
            // cache installed package
            const cachedPath = yield tc.cacheDir(installedPath, pkg, version);
            core.addPath(cachedPath);
        }
    });
}
exports.installNpmPkg = installNpmPkg;
function exec2(command) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            child.exec(command, (err, stdout, stderr) => {
                if (stderr) {
                    resolve();
                }
                if (err) {
                    console.log(err);
                    reject(err);
                }
                resolve(stdout);
            });
        });
    });
}
