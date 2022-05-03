import { Component, OnInit } from '@angular/core';
import { BasketComponent } from '../basket.component';
import { DotCdkTranslatePipe } from '../../../pipes/dot-translate.pipe';
import { BasketService } from '../../../services/basket.service';
import { DynamicContentService } from '../../../services/dynamic-content/dynamic-content.service';
import { DotButton, PosServingLocation } from 'dotsdk';
import { PaymentModelService, CheckoutService, ApplicationSettingsService, SessionService } from '@dotxix/services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'acr-order-button',
  templateUrl: './order-button.component.html',
  styleUrls: ['./order-button.component.scss'],
})
export class OrderButtonComponent implements OnInit {
  public subscriptions: Subscription[] = [];
  constructor(
    private basketService: BasketService,
    protected translatePipe: DotCdkTranslatePipe,
    protected dynamicContentService: DynamicContentService,
    protected paymentModelService: PaymentModelService,
    protected checkoutService: CheckoutService,
    protected appSettingsService: ApplicationSettingsService,
    protected sessionService: SessionService
  ) { }

  public ngOnInit(): void {
    this.subscriptions.push(
      this.basketService.basketButtonsUpdate.subscribe((x) => {
        const basketTotalCents = this.basketService.calculateTotalPrice(this.basketService.buttons);
        if (this.appSettingsService.skipPrecalculate) {
          this.checkoutService.subtotalCents =
            this.hasOrderDiscount && this.orderDiscount <= basketTotalCents ? basketTotalCents - this.orderDiscount : basketTotalCents;
        }
        this.paymentModelService.getAmountOwed();
        // this.formattedButtons = this.getFormattedButtons();
      })
    );
  }

  public get basketButtons(): DotButton[] {
    return this.basketService.buttons;
  }

  public get basketTitle(): string {
    if (this.basketButtonLength === 0) {
      return this.translatePipe.transform('6');
    }

    if (this.basketButtonLength === 1) {
      return this.translatePipe.transform('19');
    }

    return this.translatePipe.transform('92');
  }

  public get basketButtonLength(): number {
    return this.basketService.getQuantityButtons();
  }

  public basketToggle(): void {
    this.basketService.basketToggle(BasketComponent);
  }

  public get totalPrice(): number {
    const basketTotalCents = this.basketService.calculateTotalPrice(this.basketService.buttons);
    return this.hasOrderDiscount && this.orderDiscount <= basketTotalCents ? basketTotalCents - this.orderDiscount : basketTotalCents;
  }

  public get orderDiscount(): number {
    return this.basketService.buttons.some((button) => button['$$OrderDiscount'] >= 0) ? 1 : 0;
  }

  public get orderType(): string {
    return (this.sessionService.serviceType === PosServingLocation.IN) ? 'EAT IN' : 'TAKE AWAY';
  }

  public get hasOrderDiscount(): boolean {
    return this.basketService.buttons.some((button) => button['$$OrderDiscount']);
  }
}
