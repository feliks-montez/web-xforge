import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { UICommonModule } from '@xforge-common/ui-common.module';
import { XForgeCommonModule } from '@xforge-common/xforge-common.module';
import { ExternalSignUpComponent } from './external-sign-up/external-sign-up.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { IdentityRoutingModule } from './identity-routing.module';
import { IdentityService } from './identity.service';
import { LogInComponent } from './log-in/log-in.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';

@NgModule({
  declarations: [
    LogInComponent,
    ForgotPasswordComponent,
    SignUpComponent,
    ResetPasswordComponent,
    VerifyEmailComponent,
    ExternalSignUpComponent
  ],
  imports: [CommonModule, IdentityRoutingModule, UICommonModule, XForgeCommonModule],
  providers: [IdentityService]
})
export class IdentityModule {}
