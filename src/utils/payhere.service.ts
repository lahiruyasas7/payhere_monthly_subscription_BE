import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PayHereService {
  constructor(private readonly configService: ConfigService) {}

  private readonly merchantId = this.configService.get(
    'app.payhere.merchantId',
  );
  private readonly chargeUrl = this.configService.get('app.payhere.chargeUrl');
  private readonly returnUrl = this.configService.get('app.payhere.returnUrl');
  private readonly cancelUrl = this.configService.get('app.payhere.cancelUrl');
  private readonly notifyUrl = this.configService.get('app.payhere.notifyUrl');
  private readonly merchantSecret = this.configService.get(
    'app.payhere.merchantSecret',
  );
  private readonly currency = this.configService.get('app.payhere.currency');
  private readonly country = this.configService.get('app.payhere.country');
  private readonly authorizationCode = this.configService.get(
    'app.payhere.authorizationCode',
  );
  private readonly auth_url = this.configService.get('app.payhere.authUrl');
  }