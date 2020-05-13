"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPage = void 0;
const protractor_1 = require("protractor");
class AppPage {
    navigateTo() {
        return protractor_1.browser.get('/');
    }
    getParagraphText() {
        return protractor_1.element(protractor_1.by.deepCss('app-root ion-content')).getText();
    }
}
exports.AppPage = AppPage;
