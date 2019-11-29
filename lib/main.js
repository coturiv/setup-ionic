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
const core = __importStar(require("@actions/core"));
const semver = __importStar(require("semver"));
const installer_1 = require("./installer");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            checkPlatform();
            // install cordova-cli
            const cordovaVersion = core.getInput('cordova-version');
            if (checkVersion(cordovaVersion)) {
                yield installer_1.installCordova(cordovaVersion);
            }
            // install ionic-cli
            const ionicVersion = core.getInput('ionic-version');
            if (checkVersion(ionicVersion)) {
                yield installer_1.installIonic(ionicVersion);
            }
            // install specific version of java and gradle
            // await installJava();
            // install cocoapods
            yield installer_1.installPods();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function checkPlatform() {
    if (process.platform !== 'linux' && process.platform !== 'darwin') {
        throw new Error('@coturiv/setup-ionic only supports either Ubuntu Linux or MacOS at this time');
    }
}
function checkVersion(version) {
    if (!version || semver.valid(version) || semver.validRange(version)) {
        return true;
    }
    throw new Error(`Error, ${version} is not a valid format.`);
}
run();
