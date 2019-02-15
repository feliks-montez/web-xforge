import { browser, by, element, ElementArrayFinder, ExpectedConditions } from 'protractor';

export class SystemAdminPage {
  private static readonly baseUrl = 'http://localhost:5000';
  private readonly constants = require('../testConstants.json');

  newTestUser = {
    newName: 'testsysadmin',
    newUserName: 'testsysadmin',
    newEmail: 'testsysadmin@example.com',
    newPassword: '12345678',
    modifiedPassword: 'test123',
    inviteUser: 'inviteuser@example.com'
  };

  appBarTitle = element(by.css('mdc-top-app-bar-title'));
  inviteFriend = {
    inviteButton: element(by.css('button[id="invite-btn"]')),
    dailog: element(by.css('mdc-dialog-container')),
    inputEmail: element(by.css('input[id="email"]')),
    sendButton: element(by.css('button[id="invitation-send-btn"]')),
    closeButton: element(by.css('button[id="invitation-close-btn"]')),
    inviteCancelButton: element.all(by.css('button[class~="cancel-invite"]'))
  };

  pagination = {
    listBox: element(by.css('div[class="mat-select-arrow"]')),
    selectFive: element(by.css('mat-option[ng-reflect-value="5"]')),
    nextPage: element(by.css('button[aria-label="Next page"]')),
    previousPage: element(by.css('button[aria-label="Previous page"]')),
    rangeLabel: element(by.css('div[class="mat-paginator-range-label"]'))
  };

  newAccountDetails = {
    fullName: element(by.id('full-name')),
    userName: element(by.id('username')),
    emailAddress: element(by.id('email')),
    systemRole: element(by.id('user-role')),
    selectSystemAdmin: element(by.css('mat-option[ng-reflect-value="system_admin"]')),
    selectUser: element(by.css('mat-option[ng-reflect-value="user"]')),
    accountPassword: element(by.id('password')),
    addButton: element(by.id('add-button'))
  };

  users = {
    addUserButton: element(by.id('add-user-btn')),
    userSnackbar: element(by.css('mdc-snackbar div[role="status"]')),
    addedUserNameList: element.all(by.css('tr[class~="mat-row"] strong')),
    newlyAddedUser: element(by.cssContainingText('tr[class~="mat-row"] strong', this.newTestUser.newName)),
    accountDetailsHeader: element(by.css('mat-card-title[class~="account-title"]')),
    filterUsers: element(by.css('input[placeholder~="Filter"]'))
  };

  accountDetails = {
    accountChangePassword: element(by.css('button[id="changepassword-button"]')),
    accountUpdateButton: element(by.css('button[class~="update-button"]'))
  };

  deleteConfirmDialog = {
    deleteDialog: element(by.css('mat-dialog-container')),
    deleteDialogYes: element(by.css('mat-dialog-container button[id="confirm-button-yes"]'))
  };

  async get() {
    await browser.get(SystemAdminPage.baseUrl + '/system-administration');
    await browser.wait(ExpectedConditions.visibilityOf(this.users.addUserButton), this.constants.conditionTimeout);
  }

  async findNewUser(addedUserList: ElementArrayFinder, newName: string) {
    await addedUserList.map(async function(getList) {
      if ((await getList.getText()) === newName) {
        await getList.click();
        return true;
      }
    });
  }

  async deleteNewUser(addedUserList: ElementArrayFinder, newName: string) {
    let getIndex = 0;
    await addedUserList.map(async function(getList) {
      if ((await getList.getText()) === newName) {
        const increaseGetIndex = getIndex + 1;
        await element(by.css('tr:nth-child(' + increaseGetIndex + ')>td button')).click();
        return true;
      } else {
        getIndex = getIndex + 1;
      }
    });
  }

  async addNewUser(newName: string, newUserName: string, newEmail: string, newPassword: string) {
    await this.users.addUserButton.click();
    await this.newAccountDetails.fullName.sendKeys(newName);
    await this.newAccountDetails.userName.sendKeys(newUserName);
    await this.newAccountDetails.emailAddress.sendKeys(newEmail);
    await this.newAccountDetails.systemRole.click();
    await this.newAccountDetails.selectSystemAdmin.click();
    await this.newAccountDetails.accountPassword.sendKeys(newPassword);
    await this.newAccountDetails.addButton.click();
    await expect(this.users.newlyAddedUser.getText()).toContain(newName);
  }
}
