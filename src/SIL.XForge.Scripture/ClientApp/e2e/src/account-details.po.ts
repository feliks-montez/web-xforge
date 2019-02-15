import { browser, by, element, ExpectedConditions, ElementFinder } from 'protractor';

import { ParaTextPage } from './para-text.po';

const paraTextPage = new ParaTextPage();
const constants = require('../testConstants.json');

export class AccountDetailsPage {
  private static readonly baseUrl = 'http://localhost:5000';
  private readonly constants = require('../testConstants.json');

  accountDetailsHeader = element(by.css('h2'));

  userName = {
    userNameTextbox: element(by.css('input[placeholder="Name"]')),
    nameUpdateButton: element(by.id('name-update-button')),
    nameUpdateIcon: element(by.id('name-update-done'))
  };

  emailField = {
    emailIdTextbox: element(by.css('input[placeholder="Email"]')),
    emailUpdateButton: element(by.id('email-update-button')),
    emailUpdateIcon: element(by.id('email-update-done'))
  };

  phoneNumber = {
    phoneNumberTextbox: element(by.css('input[placeholder="Phone"]')),
    phoneUpdateButton: element(by.id('mobilePhone-update-button')),
    phoneUpdateIcon: element(by.id('mobilePhone-update-done'))
  };

  birthdayField = {
    birthdayTextbox: element(by.css('input[ng-reflect-name="birthday"]')),
    birthdayUpdateIcon: element(by.id('birthday-update-done')),
    datePicker: element(by.css('svg[class^="mat-datepicker"]')),
    selectRandomDate: element(by.css('td[tabindex="0"]+td'))
  };

  genderField = {
    genderDropdownIcon: element(by.className('mat-select-arrow')),
    selectGender: element(by.css('mat-option[value="male"]')),
    genderupdateIcon: element(by.id('gender-update-done'))
  };

  paraText = {
    connectParatextBtn: element(by.id('connect-paratext-button')),
    linkedParatextAcc: element.all(by.css('#paratext-link div')).first(),
    removeLinkBtn: element(by.id('unlink-paratext-button')),
    snackBar: element.all(by.css('div[class^="mdc-snackbar"]')).last()
  };

  deleteAccount = {
    deleteAccountButton: element(by.id('delete-account-button')),
    deletePane: element(by.className('cdk-overlay-pane')),
    getUsernameText: element.all(by.css('.mat-dialog-content p strong')).last(),
    enterYourname: element(by.css('input[placeholder="Enter your name"]')),
    confirmDeleteButton: element(by.id('confirm-delete-button'))
  };

  async get() {
    await browser.get(AccountDetailsPage.baseUrl + '/my-account');
    await browser.wait(ExpectedConditions.presenceOf(this.accountDetailsHeader), this.constants.conditionTimeout);
  }

  async verify_accountDetailsTextField(
    textboxField: ElementFinder,
    updateButton: ElementFinder,
    updateIcon: ElementFinder,
    testData: string
  ) {
    await textboxField.clear();
    await textboxField.sendKeys(testData);
    await updateButton.click();
    await browser.wait(ExpectedConditions.presenceOf(updateIcon), this.constants.conditionTimeout);
    await expect(updateIcon.isDisplayed()).toBe(true);
  }

  async verify_accountDetailsButtonField(
    clickElementToOpen: ElementFinder,
    selectElement: ElementFinder,
    elementIsPresent: ElementFinder
  ) {
    await clickElementToOpen.click();
    await selectElement.click();
    await browser.wait(ExpectedConditions.presenceOf(elementIsPresent), this.constants.conditionTimeout);
    await expect(elementIsPresent.isDisplayed()).toBe(true);
  }

  async paratextLogin(paratextEmail: string, paratextPassword: string) {
    browser.waitForAngularEnabled(false);
    await expect(browser.getCurrentUrl()).toContain('registry-dev.paratext.org');
    await browser.wait(ExpectedConditions.visibilityOf(paraTextPage.paratextEmailTextbox), constants.conditionTimeout);
    await paraTextPage.paratextEmailTextbox.sendKeys(paratextEmail);
    await paraTextPage.paratextSubmitButton.click();

    await browser.wait(
      ExpectedConditions.visibilityOf(paraTextPage.paratextPasswordTextbox),
      constants.conditionTimeout
    );
    await paraTextPage.paratextPasswordTextbox.sendKeys(paratextPassword);
    await paraTextPage.paratextSubmitButton.click();

    await browser.wait(ExpectedConditions.visibilityOf(paraTextPage.paratextAcceptButton), constants.conditionTimeout);
    await paraTextPage.paratextAcceptButton.click();

    // Applied wait here, due to the system is taking 5 seconds to get back to angular page
    await browser.sleep(5000);
    browser.waitForAngularEnabled(true);
  }
}
