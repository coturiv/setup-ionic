"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
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
