import { browser, ExpectedConditions } from 'protractor';

import { AccountDetailsPage } from './account-details.po';
import { LoginPage } from './login.po';
import { SystemAdminPage } from './system-admin.po';
import { AppPage } from './app.po';

describe('E2E Account Details app', () => {
  const constants = require('../testConstants.json');
  const loginPage = new LoginPage();
  const accountDetailsPage = new AccountDetailsPage();
  const systemAdminPage = new SystemAdminPage();

  const testUsername = 'testUser';
  const emailId = 'testUser@test.com';
  const phoneNumber = '1234567890';
  const paratextEmail = 'dinakaran@ecgroup-intl.com';
  const paratextPassword = 'dinakaran83';

  it('setup: login as admin, go to system admin and create new admin user account', async () => {
    await loginPage.loginAsAdmin();
    await systemAdminPage.get();
    await systemAdminPage.addNewUser(
      systemAdminPage.newTestUser.newName,
      systemAdminPage.newTestUser.newUserName,
      systemAdminPage.newTestUser.newEmail,
      systemAdminPage.newTestUser.newPassword
    );
    await LoginPage.logout();
  });

  it('setup: login as new admin user account, navigate to account details page', async () => {
    await loginPage.login(systemAdminPage.newTestUser.newUserName, systemAdminPage.newTestUser.newPassword, true);
    await expect(AppPage.getMainHeading()).toContain(systemAdminPage.newTestUser.newName);
    await accountDetailsPage.get();
  });

  it('verify the update functionality for username text field', async () => {
    await accountDetailsPage.verify_accountDetailsTextField(
      accountDetailsPage.userName.userNameTextbox,
      accountDetailsPage.userName.nameUpdateButton,
      accountDetailsPage.userName.nameUpdateIcon,
      testUsername
    );
  });

  it('verify the update functionality for email text field', async () => {
    await accountDetailsPage.verify_accountDetailsTextField(
      accountDetailsPage.emailField.emailIdTextbox,
      accountDetailsPage.emailField.emailUpdateButton,
      accountDetailsPage.emailField.emailUpdateIcon,
      emailId
    );
  });

  it('verify the update functionality for phone number text field', async () => {
    await accountDetailsPage.verify_accountDetailsTextField(
      accountDetailsPage.phoneNumber.phoneNumberTextbox,
      accountDetailsPage.phoneNumber.phoneUpdateButton,
      accountDetailsPage.phoneNumber.phoneUpdateIcon,
      phoneNumber
    );
  });

  // Commented this test due to Issue with the selecting birthday calander
  /* it('verify the update functionality for birthday', async () => {
    await accountDetailsPage.verify_accountDetailsButtonField(
      accountDetailsPage.birthdayField.datePicker,
      accountDetailsPage.birthdayField.selectRandomDate,
      accountDetailsPage.birthdayField.birthdayUpdateIcon
    );
  }); */

  it('verify the update functionality for gender dropdown field', async () => {
    await accountDetailsPage.verify_accountDetailsButtonField(
      accountDetailsPage.genderField.genderDropdownIcon,
      accountDetailsPage.genderField.selectGender,
      accountDetailsPage.genderField.genderupdateIcon
    );
  });

  it('connect to paratext and link with paratext account on account details page and verify the link is displayed', async () => {
    if (accountDetailsPage.paraText.connectParatextBtn.isDisplayed()) {
      await accountDetailsPage.paraText.connectParatextBtn.click();
      await accountDetailsPage.paratextLogin(paratextEmail, paratextPassword);
      await browser.wait(ExpectedConditions.presenceOf(accountDetailsPage.paraText.linkedParatextAcc), 5000);
      await expect(accountDetailsPage.paraText.linkedParatextAcc.getText()).toContain('Linked to Paratext account');
    }
  });

  it('Remove the paratext account and verify the link is removed', async () => {
    await accountDetailsPage.paraText.removeLinkBtn.click();
    await browser.wait(
      ExpectedConditions.visibilityOf(accountDetailsPage.paraText.connectParatextBtn),
      constants.conditionTimeout
    );
    await expect(accountDetailsPage.paraText.connectParatextBtn.isDisplayed()).toBeTruthy();
  });

  it('delete the SF user account and verify page is navigating to landing page or not', async () => {
    await accountDetailsPage.deleteAccount.deleteAccountButton.click();
    await expect(accountDetailsPage.deleteAccount.deletePane.isPresent()).toBeTruthy();
    await accountDetailsPage.deleteAccount.enterYourname.sendKeys('testdata');
    await expect(accountDetailsPage.deleteAccount.confirmDeleteButton.getAttribute('ng-reflect-disabled')).toBe('true');
    await accountDetailsPage.deleteAccount.enterYourname.clear();
    await accountDetailsPage.deleteAccount.enterYourname.sendKeys(
      accountDetailsPage.deleteAccount.getUsernameText.getText()
    );
    await expect(accountDetailsPage.deleteAccount.confirmDeleteButton.getAttribute('ng-reflect-disabled')).toBe(
      'false'
    );

    await accountDetailsPage.deleteAccount.confirmDeleteButton.click();
    await browser.sleep(500);
    browser.waitForAngularEnabled(false);
    await expect(browser.getCurrentUrl()).toContain('localhost:5000');
    browser.waitForAngularEnabled(true);
  });
});
