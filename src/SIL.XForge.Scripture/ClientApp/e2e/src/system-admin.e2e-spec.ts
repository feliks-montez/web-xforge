import { browser, ExpectedConditions } from 'protractor';
import { AppPage } from './app.po';
import { LoginPage } from './login.po';
import { SystemAdminPage } from './system-admin.po';

describe('E2E System Administration app', () => {
  const constants = require('../testConstants.json');
  const loginPage = new LoginPage();
  const systemAdminPage = new SystemAdminPage();

  it('setup: login as Admin, go to the system administration page', async () => {
    await LoginPage.logout();
    await loginPage.loginAsAdmin();
    await systemAdminPage.get();
  });

  it('Verify added a new user with the role of admin ', async () => {
    await systemAdminPage.users.addUserButton.click();
    await systemAdminPage.newAccountDetails.fullName.sendKeys(systemAdminPage.newTestUser.newName);
    await systemAdminPage.newAccountDetails.userName.sendKeys(systemAdminPage.newTestUser.newUserName);
    await systemAdminPage.newAccountDetails.emailAddress.sendKeys(systemAdminPage.newTestUser.newEmail);
    await systemAdminPage.newAccountDetails.systemRole.click();
    await systemAdminPage.newAccountDetails.selectSystemAdmin.click();
    await systemAdminPage.newAccountDetails.accountPassword.sendKeys(systemAdminPage.newTestUser.newPassword);
    await systemAdminPage.newAccountDetails.addButton.click();
    await expect(systemAdminPage.users.newlyAddedUser.getText()).toContain(systemAdminPage.newTestUser.newName);
    // written snack bar verification is not working after MDC web design.
    /* await browser.wait(ExpectedConditions.visibilityOf(systemAdminPage.users.userSnackbar),
    constants.conditionTimeout);
    await expect(systemAdminPage.users.userSnackbar.isPresent()).toBeTruthy();
    await expect(systemAdminPage.users.userSnackbar.getText()).toContain('User account created successfully.'); */
    await LoginPage.logout();
  });

  it('Verify the pagination for system administration and then check the filtered user.', async () => {
    await loginPage.login(systemAdminPage.newTestUser.newEmail, systemAdminPage.newTestUser.newPassword, true);
    await expect(AppPage.getMainHeading()).toContain(systemAdminPage.newTestUser.newName);
    await systemAdminPage.get();
    await systemAdminPage.pagination.listBox.click();
    await systemAdminPage.pagination.selectFive.click();
    await systemAdminPage.pagination.nextPage.click();
    await expect(systemAdminPage.pagination.rangeLabel.getText()).toContain('6 - 8 of 8');
    await systemAdminPage.users.filterUsers.sendKeys(systemAdminPage.newTestUser.newName);
    // Below check needs to uncomment after SF-124 issue fix.
    // await expect(systemAdminPage.newlyAddedUser.getText()).toContain(systemAdminPage.newTestUser.newName);
    await systemAdminPage.pagination.previousPage.click();
    await expect(systemAdminPage.pagination.rangeLabel.getText()).toContain('1 - 1 of 1');
    await systemAdminPage.users.filterUsers.click();
    await systemAdminPage.users.filterUsers.clear();
  });

  it('Verify the filter if appear by searching name and email id', async () => {
    await browser.navigate().refresh();
    await systemAdminPage.users.filterUsers.sendKeys(systemAdminPage.newTestUser.newName);
    await systemAdminPage.findNewUser(systemAdminPage.users.addedUserNameList, systemAdminPage.newTestUser.newName);
    await browser.wait(
      ExpectedConditions.visibilityOf(systemAdminPage.users.accountDetailsHeader),
      constants.conditionTimeout
    );
    await expect(systemAdminPage.users.accountDetailsHeader.getText()).toContain('Account details');
    await expect(systemAdminPage.newAccountDetails.fullName.getAttribute('value')).toContain(
      systemAdminPage.newTestUser.newName
    );
    await systemAdminPage.findNewUser(systemAdminPage.users.addedUserNameList, systemAdminPage.newTestUser.newName);
    await systemAdminPage.users.filterUsers.clear();
    await systemAdminPage.users.filterUsers.sendKeys(systemAdminPage.newTestUser.newEmail);
    await systemAdminPage.findNewUser(systemAdminPage.users.addedUserNameList, systemAdminPage.newTestUser.newName);
    await browser.wait(
      ExpectedConditions.visibilityOf(systemAdminPage.users.accountDetailsHeader),
      constants.conditionTimeout
    );
    await expect(systemAdminPage.users.accountDetailsHeader.getText()).toContain('Account details');
    await expect(systemAdminPage.newAccountDetails.fullName.getAttribute('value')).toContain(
      systemAdminPage.newTestUser.newName
    );
  });

  it('Verify change password functionality by update button for newly added user.', async () => {
    await systemAdminPage.accountDetails.accountChangePassword.click();
    await systemAdminPage.newAccountDetails.accountPassword.sendKeys(systemAdminPage.newTestUser.modifiedPassword);
    await systemAdminPage.accountDetails.accountUpdateButton.click();
    /* // written snack bar verification is not working after MDC web design.
    await expect(systemAdminPage.users.userSnackbar.getText()).toContain('User account updated.');
    await browser.wait(
      ExpectedConditions.invisibilityOf(systemAdminPage.users.userSnackbar),
      constants.conditionTimeout
    ); */
    await LoginPage.logout();
    await loginPage.login(systemAdminPage.newTestUser.newEmail, systemAdminPage.newTestUser.modifiedPassword, true);

    await expect(AppPage.getMainHeading()).toContain(systemAdminPage.newTestUser.newName);
  });

  it('Verify the "Cancel invite" button on the system administration.', async () => {
    await systemAdminPage.appBarTitle.click();
    await browser.wait(
      ExpectedConditions.visibilityOf(systemAdminPage.inviteFriend.inviteButton),
      constants.conditionTimeout
    );
    await systemAdminPage.inviteFriend.inviteButton.click();
    await browser.wait(
      ExpectedConditions.visibilityOf(systemAdminPage.inviteFriend.dailog),
      constants.conditionTimeout
    );
    await systemAdminPage.inviteFriend.inputEmail.sendKeys(systemAdminPage.newTestUser.inviteUser);
    await systemAdminPage.inviteFriend.sendButton.click();
    // written snack bar verification is not working after MDC web design.
    // await expect(systemAdminPage.users.userSnackbar.isPresent()).toBeTruthy();
    /* await expect(systemAdminPage.users.userSnackbar.getText()).toContain(
      'An invitation email has been sent to inviteuser@example.com.'
    ); */
    await systemAdminPage.inviteFriend.closeButton.click();

    await systemAdminPage.get();
    await browser.wait(
      ExpectedConditions.visibilityOf(systemAdminPage.inviteFriend.inviteCancelButton.first()),
      constants.conditionTimeout
    );
    await systemAdminPage.inviteFriend.inviteCancelButton.first().click();
    await expect(systemAdminPage.deleteConfirmDialog.deleteDialog).toBeTruthy();
    await systemAdminPage.deleteConfirmDialog.deleteDialogYes.click();
    await browser.wait(
      ExpectedConditions.invisibilityOf(systemAdminPage.inviteFriend.inviteCancelButton.first()),
      constants.conditionTimeout
    );
    await expect(systemAdminPage.inviteFriend.inviteCancelButton.first().isPresent()).toBeFalsy();
    await LoginPage.logout();
  });

  it('Verify the user deactivate and activate features.', async () => {
    await loginPage.loginAsAdmin();
    await systemAdminPage.get();
    await systemAdminPage.findNewUser(systemAdminPage.users.addedUserNameList, systemAdminPage.newTestUser.newName);
    await systemAdminPage.accountDetails.accountActivateBtn.click();
    await expect(systemAdminPage.accountDetails.accountActivateMsg.getText()).toContain('Deactive/Invited');
    await systemAdminPage.accountDetails.accountUpdateButton.click();
    await browser.navigate().refresh();
    await systemAdminPage.users.inviteUser.click();
    await systemAdminPage.accountDetails.accountActivateBtn.click();
    await expect(systemAdminPage.accountDetails.accountActivateMsg.getText()).toContain('Activated');
    await systemAdminPage.accountDetails.accountUpdateButton.click();
    await LoginPage.logout();
  });

  it('Delete a user and then verify the user unavailable.', async () => {
    await loginPage.loginAsAdmin();
    await systemAdminPage.get();
    await browser.sleep(500); // sleep needs because the user list are getting delay to appear.
    await systemAdminPage.deleteNewUser(systemAdminPage.users.addedUserNameList, systemAdminPage.newTestUser.newName);
    await expect(systemAdminPage.deleteConfirmDialog.deleteDialog).toBeTruthy();
    await systemAdminPage.deleteConfirmDialog.deleteDialogYes.click();
    await browser.wait(
      ExpectedConditions.invisibilityOf(systemAdminPage.users.newlyAddedUser),
      constants.conditionTimeout
    );
    await expect(systemAdminPage.users.newlyAddedUser.isPresent()).toBeFalsy();
  });
});
