
import * as _ from 'lodash';

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DotSuggestionSalesService, PosServingLocation, SectionAvailability, cancelOrderEvent, getMainPage } from 'dotsdk';
import { Suggestion, TableServiceType } from '@dotxix/models';

import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PosElogHandler, DotCatalogLoader, DotButton } from 'dotsdk';
import {
  ApplicationSettingsService,
  BasketService,
  CheckoutService,
  ContentService,
  DynamicContentService,
  EndSceneRoutingService,
  SessionEndType,
  SessionService,
  StatusService,
  WorkingHoursService,
  PaymentModelService,
} from '@dotxix/services';
import { DotCdkTranslatePipe } from '@dotxix/pipes';
import { isAdaEnabled, log, routeToFirstPage, toggleAdaMode } from '@dotxix/helpers';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SuggestionSalesComponent } from '../suggestion-sales/suggestion-sales.component';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
import { DisabilityToggleService } from '@dotxix/services/disability-toggle.service';

@Component({
  selector: 'acr-footer-actions',
  templateUrl: './footer-actions.component.html',
  styleUrls: ['./footer-actions.component.scss'],
})
export class FooterActionsComponent implements OnInit, OnDestroy {
  @Input() public leftBtnMethod: string;
  @Input() public leftBtnAriaLabel: string;
  @Input() public leftBtnTranslate: string;
  @Input() public rightBtnMethod: string;
  @Input() public rightBtnAriaLabel: string;
  @Input() public rightBtnTranslate: string;
  @Input() public oneButton: boolean;
  @Input() public isCodView: boolean;

  public subscriptions: Subscription[] = [];
  public tableServiceNumber = '';

  public isAdaEnabled = isAdaEnabled;

  private get tableServiceItem(): DotButton | null {
    if (this.appSettingsService.tableServiceItem) {
      const catalogButton = DotCatalogLoader.getInstance().loadedModel.Buttons.find(
        (btn) => btn.Link === this.appSettingsService.tableServiceItem
      );
      return catalogButton || null;
    }
  }

  constructor(
    protected dynamicContentService: DynamicContentService,
    protected translatePipe: DotCdkTranslatePipe,
    protected sessionService: SessionService,
    protected basketService: BasketService,
    protected contentService: ContentService,
    protected disabilityToggleService: DisabilityToggleService,

    protected router: Router,
    protected checkoutService: CheckoutService,
    protected appSettingsService: ApplicationSettingsService,
    protected statusService: StatusService,
    protected endSceneRoutingService: EndSceneRoutingService,
    public workingHoursService: WorkingHoursService,
    protected paymentModelService: PaymentModelService,
    protected endSceneRouting: EndSceneRoutingService
  ) {}

  public ngOnInit(): void {}

  public ngOnDestroy() {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  public async leftButton(event: MouseEvent) {
    if (this.leftBtnMethod === 'startOver') {
      this.startOver(event);
    } else {
      await this.goBack();
    }
  }

  public rightButton(ev: MouseEvent): void {
    if (this.rightBtnMethod === 'goToCheckout') {
      this.goToCheckout();
    } else {
      this.payOrder(ev);
    }
  }

  public disabilityToggle() {
    // this.disabilityToggleService.subject
    // this.disabilityToggleService.getDisabilityToggleState().subscribe(val => {
      this.disabilityToggleService.setDisabilityToggleState();
    // })
  }

  public get basketButtonLength(): number {
    return this.basketService.getQuantityButtons();
  }

  public get basketButtonsLength(): number {
    return this.basketService.getQuantityButtons();
  }
  public get orderDiscount(): number {
    return this.basketService.buttons.some((button) => button['$$OrderDiscount'] >= 0) ? 1 : 0;
  }

  // public get totalPrice(): number {

  //   const basketTotalCents = this.basketService.calculateTotalPrice(this.basketService.buttons);
  //   return this.hasOrderDiscount && this.orderDiscount <= basketTotalCents ? basketTotalCents - this.orderDiscount : basketTotalCents;
  // }

  public get leftButtonIcon(): string {
    if (this.leftBtnAriaLabel === 'Cancel Order Button') {
      return '#lib-icon--cross';
    }
    return '#lib-icon--chevron-left';
  }

  public get tableServiceNumberPrefix(): string {
    return this.appSettingsService.tableServiceNumberPrefix
      ? `${this.appSettingsService.tableServiceNumberPrefix} ${this.tableServiceNumber}`
      : this.tableServiceNumber;
  }

  public async switchAdaMode() {
    await toggleAdaMode();
  }

  private startOver(event: MouseEvent): void {
    const contentRef = this.dynamicContentService.openContent(ConfirmDialogComponent, {
      title: this.translatePipe.transform('38'),
      leftButtonText: this.translatePipe.transform('32'),
      rightButtonText: this.translatePipe.transform('33'),
    });

    this.subscriptions.push(
      contentRef.afterClosed.subscribe(async (response) => {
        if (response === 'Yes') {
          await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
          cancelOrderEvent.emit(event);
          this.dynamicContentService.closeAllDialogs();
          this.router.navigate([routeToFirstPage()]);
          return;
        }
      })
    );
  }

  private async goBack() {
    this.checkoutService.basketButtons = _.cloneDeep(this.basketService.buttons);
    this.checkoutService.resetOrderTotal();
    this.router.navigate(['menu', getMainPage()?.ID]);
  }

  public get totalPrice(): number {
    const basketTotalCents = this.basketService.calculateTotalPrice(this.basketService.buttons);
    if (this.appSettingsService.skipPrecalculate) {
      this.checkoutService.subtotalCents =
        this.hasOrderDiscount && this.orderDiscount <= basketTotalCents ? basketTotalCents - this.orderDiscount : basketTotalCents;
    }
    return this.paymentModelService.getAmountOwed();
  }

  public get hasOrderDiscount(): boolean {
    return this.basketService.buttons.some((button) => button['$$OrderDiscount']);
  }

  public get orderType(): string {
    return this.sessionService.serviceType === PosServingLocation.IN ? 'EAT IN' : 'TAKE AWAY';
  }

  public get isQuickViewOpen(): boolean {
    return this.basketService.isOpen;
  }

  private async goToCheckout() {
    this.dynamicContentService.closeAllDialogs();
    const suggestions = DotSuggestionSalesService.getInstance().getOrderSuggestions();
    if (suggestions && suggestions.length > 0) {
      const contentRef = this.dynamicContentService.openContent(SuggestionSalesComponent, { suggestion: new Suggestion(suggestions) });
      const contentRefSubscription = contentRef.afterClosed.subscribe(async () => {
        await this.checkoutService.startCheckoutTunnel();
        contentRefSubscription.unsubscribe();
      });
    } else {
      await this.checkoutService.startCheckoutTunnel();
    }
  }

  private async payOrder(ev: MouseEvent) {
    this.checkoutService.reCalc();
    let whTSSEnabled = true;
    const response = this.workingHoursService.getSectionResponse(SectionAvailability.TABLE_SERVICE);

    if (response && 'TSSEnabled' in response && response.TSSEnabled !== undefined) {
      whTSSEnabled = response.TSSEnabled;
    }
    if (this.statusService.paymentsAvailableForApp.length < 1) {
      log('no payment method found, go to ', routeToFirstPage());
      await this.sessionService.restartSession(SessionEndType.CANCEL_ORDER);
      cancelOrderEvent.emit(ev);
      this.router.navigate([routeToFirstPage()]);
      return;
    }
    if (
      this.appSettingsService.tableServiceMode === TableServiceType.BOTH ||
      (this.appSettingsService.tableServiceMode === TableServiceType.EAT_IN && this.sessionService.serviceType === PosServingLocation.IN) ||
      (this.appSettingsService.tableServiceMode === TableServiceType.TAKE_OUT && this.sessionService.serviceType === PosServingLocation.OUT)
    ) {
      if (whTSSEnabled && this.sessionService.serviceType === PosServingLocation.IN) {
        if (typeof PosElogHandler.getInstance().posConfig.posHeader.cvars === 'object') {
          PosElogHandler.getInstance().posConfig.posHeader.cvars.TS_No = this.tableServiceNumberPrefix;
          PosElogHandler.getInstance().posConfig.posHeader.cvars.TableService = 4;
        } else {
          PosElogHandler.getInstance().posConfig.posHeader.cvars = {
            TS_No: this.tableServiceNumberPrefix,
            TableService: 4,
          };
        }

        if (this.tableServiceItem) {
          this.basketService.addButtonToBasket(this.tableServiceItem);
          PosElogHandler.getInstance().posConfig.posHeader.cvars.TS_Element = this.tableServiceItem.Link;
        }

        this.endSceneRouting.goToEndScene();

        // this.router.navigate(['ts-selection']);
        return;
      }

      // this.router.navigate(['ts-selection']);
      // return;
    }
    this.endSceneRoutingService.goToEndScene();
  }
}
