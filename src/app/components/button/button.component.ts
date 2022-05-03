import { Component, EventEmitter, Input, Output } from '@angular/core';

import { DotButton, DotPageType } from 'dotsdk';
import { ProductStatus } from '@dotxix/models';
import { SessionService } from '@dotxix/services';
import { price } from '@dotxix/helpers';

@Component({
  selector: 'acr-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() public button: DotButton;
  @Input() public extraClasses = '';
  @Input() public displayBackground = false;
  @Input() public unavailableButton = false;
  @Input() public homePageMenu: boolean;
  @Output() public isMenu: EventEmitter<any> = new EventEmitter();

  public get price(): number {
    this.isMenu.emit(this.button?.Page?.PageType);

    const thePrice = price(this.button, this.sessionService.serviceType);

    if (thePrice === 0) {
      if (this.button.MinPrice === undefined) {
        var smallest = [];
        this.button?.Page?.Buttons.map((btn) => {
          if (btn.MinPrice !== undefined) {
            smallest.push(btn.MinPrice);
          }
        });
        const min = Number(Math.min(...smallest));
        return min;
      }
    }

    return thePrice;
  }

  public get getGroupPrice(): number {

    if (this.button.MinPrice === undefined) {
      var smallest = [];
      this.button?.Page?.Buttons.map(btn => {
        smallest.push(btn.MinPrice);
      })
      return Math.min(...smallest);
    }


  }

  public get description(): string {
    return this.button.Description;
  }

  public get isButtonStatusUnavailable() {
    return Number(this.button.ButtonStatus) === ProductStatus.UNAVAILABLE || this.unavailableButton;
  }

  public get calories(): string {
    if (this.button.Page) {
      const firstSimpleButton = this.button.Page.Buttons.find((btn) => !btn.Page && !btn.hasCombos);
      const cal = firstSimpleButton?.AllergensAndNutritionalValues?.NutritionalValues?.find((n) => n.Name === 'CAL');
      return cal ? cal.Value : '';
    }
    if (this.button.hasCombos) {
      return '';
    }
    const calories = this.button?.AllergensAndNutritionalValues?.NutritionalValues?.find((n) => n.Name === 'CAL');
    return calories ? calories.Value : '';
  }

  constructor(protected sessionService: SessionService) {}
}
