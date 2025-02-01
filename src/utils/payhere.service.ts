import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MD5 } from 'crypto-js';
import * as crypto from 'crypto';

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

  async generatePreApprovalUrl(order: {
    order_id: string;
    items: string;
    totalAmount: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      address: string;
      city: string;
    };
  }) {
    try {
      const payload = {
        merchant_id: this.merchantId,
        return_url: this.returnUrl,
        cancel_url: `${this.cancelUrl}?order_id=${order.order_id}`,
        notify_url: this.notifyUrl,
        first_name: order.user.firstName,
        last_name: order.user.lastName,
        email: order.user.email,
        phone: order.user.phoneNumber,
        address: order.user.address,
        city: order.user.city,
        country: this.country,
        order_id: order.order_id,
        items: order.items,
        currency: this.currency,
        amount: order.totalAmount,
        hash: this.generatePayHereHash(order.order_id, order.totalAmount),
      };

      return payload;
    } catch (error) {
      throw new Error(`Error redirecting to PayHere: ${error.message}`);
    }
  }

  generatePayHereHash = (orderId: string, amount: string) => {
    let hashedSecret = MD5(this.merchantSecret).toString().toUpperCase();
    let amountFormated = parseFloat(amount)
      .toLocaleString('en-us', { minimumFractionDigits: 2 })
      .replaceAll(',', '');
    let currency = this.currency;
    let hash = MD5(
      this.merchantId + orderId + amountFormated + currency + hashedSecret,
    )
      .toString()
      .toUpperCase();
    return hash;
  };

  generateMd5sig(
    merchant_id: string,
    order_id: string,
    payhere_amount: string,
    payhere_currency: string,
    status_code: string,
  ): string {
    const secretHash = crypto
      .createHash('md5')
      .update(this.merchantSecret)
      .digest('hex')
      .toUpperCase();

    // Concatenate values as per PayHere documentation
    const rawSignature = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`;

    // Return the final MD5 hash and convert it to uppercase
    return crypto
      .createHash('md5')
      .update(rawSignature)
      .digest('hex')
      .toUpperCase();
  }
}
