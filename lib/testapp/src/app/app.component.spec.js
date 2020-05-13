"use strict";
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
const core_1 = require("@angular/core");
const testing_1 = require("@angular/core/testing");
const angular_1 = require("@ionic/angular");
const ngx_1 = require("@ionic-native/splash-screen/ngx");
const ngx_2 = require("@ionic-native/status-bar/ngx");
const app_component_1 = require("./app.component");
describe('AppComponent', () => {
    let statusBarSpy, splashScreenSpy, platformReadySpy, platformSpy;
    beforeEach(testing_1.async(() => {
        statusBarSpy = jasmine.createSpyObj('StatusBar', ['styleDefault']);
        splashScreenSpy = jasmine.createSpyObj('SplashScreen', ['hide']);
        platformReadySpy = Promise.resolve();
        platformSpy = jasmine.createSpyObj('Platform', { ready: platformReadySpy });
        testing_1.TestBed.configureTestingModule({
            declarations: [app_component_1.AppComponent],
            schemas: [core_1.CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: ngx_2.StatusBar, useValue: statusBarSpy },
                { provide: ngx_1.SplashScreen, useValue: splashScreenSpy },
                { provide: angular_1.Platform, useValue: platformSpy },
            ],
        }).compileComponents();
    }));
    it('should create the app', () => {
        const fixture = testing_1.TestBed.createComponent(app_component_1.AppComponent);
        const app = fixture.debugElement.componentInstance;
        expect(app).toBeTruthy();
    });
    it('should initialize the app', () => __awaiter(void 0, void 0, void 0, function* () {
        testing_1.TestBed.createComponent(app_component_1.AppComponent);
        expect(platformSpy.ready).toHaveBeenCalled();
        yield platformReadySpy;
        expect(statusBarSpy.styleDefault).toHaveBeenCalled();
        expect(splashScreenSpy.hide).toHaveBeenCalled();
    }));
    // TODO: add more tests!
});
