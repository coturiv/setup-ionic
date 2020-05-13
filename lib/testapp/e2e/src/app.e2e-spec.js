"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_po_1 = require("./app.po");
describe('new App', () => {
    let page;
    beforeEach(() => {
        page = new app_po_1.AppPage();
    });
    it('should be blank', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toContain('Start with Ionic UI Components');
    });
});
