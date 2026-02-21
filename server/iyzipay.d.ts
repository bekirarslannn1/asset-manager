declare module "iyzipay" {
  interface IyzipayConfig {
    apiKey: string;
    secretKey: string;
    uri: string;
  }

  class Iyzipay {
    constructor(config: IyzipayConfig);
    payment: {
      create(request: any, callback: (err: any, result: any) => void): void;
      retrieve(request: any, callback: (err: any, result: any) => void): void;
    };
    threedsInitialize: {
      create(request: any, callback: (err: any, result: any) => void): void;
    };
    threedsPayment: {
      create(request: any, callback: (err: any, result: any) => void): void;
    };
    installmentInfo: {
      retrieve(request: any, callback: (err: any, result: any) => void): void;
    };
    checkoutFormInitialize: {
      create(request: any, callback: (err: any, result: any) => void): void;
    };
    checkoutForm: {
      retrieve(request: any, callback: (err: any, result: any) => void): void;
    };
    refund: {
      create(request: any, callback: (err: any, result: any) => void): void;
    };
    cancel: {
      create(request: any, callback: (err: any, result: any) => void): void;
    };

    static LOCALE: { TR: string; EN: string };
    static CURRENCY: { TRY: string; EUR: string; USD: string; GBP: string };
    static PAYMENT_GROUP: { PRODUCT: string; LISTING: string; SUBSCRIPTION: string };
    static BASKET_ITEM_TYPE: { PHYSICAL: string; VIRTUAL: string };
    static PAYMENT_CHANNEL: { MOBILE: string; WEB: string; MOBILE_WEB: string; MOBILE_IOS: string; MOBILE_ANDROID: string; MOBILE_WINDOWS: string; MOBILE_TABLET: string; MOBILE_PHONE: string };
  }

  export = Iyzipay;
}
