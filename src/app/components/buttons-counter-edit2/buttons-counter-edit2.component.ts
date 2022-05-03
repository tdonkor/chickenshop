import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { DotModifier } from 'dotsdk';
import { ModifiersService } from '@dotxix/services';

@Component({
  selector: 'acr-buttons-counter-edit2',
  templateUrl: './buttons-counter-edit2.component.html',
  styleUrls: ['./buttons-counter-edit2.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ButtonsCounterEdit2Component implements OnInit {
  public addedOn = false;
  public remove = false;
  public buttonText = '';
  public modifier: DotModifier;

  @Input() set doubleDisabled(modId: any) {
    if (modId === 10015 ) {
      this.remove = true;
    }
    if  (this.remove === true) {
      this.buttonText = 'REMOVE';
    } else  {
      this.buttonText = 'ADD';
    }
  }

  @Input() set quantity(val: any) {
    if (val > 0) {
      this.addedOn = true;
    }

  }


  @Input() public price: number;
  @Input() public minQuantity: number;
  @Input() public maxQuantity: number;
  @Input() public displayPrice = true;
  @Input() public hasPrefixes = false;
  @Input() public prefixQuantity = 0;
  @Input() public basketExceededMaxQty = false;
  @Input() public isUnavailableButton = false;
  @Input() public hasDefaultQuantity = false;
  // @Input() public doubleDisabled: any;

  @Output() public quantityUpdate: EventEmitter<number> = new EventEmitter();

  public get disabledIncrementBtn() {
    // if (this.quantity >= this.maxQuantity && !this.hasPrefixes && !this.basketExceededMaxQty) {
    //   return true;
    // } else if (this.hasPrefixes && this.prefixQuantity === 2) {
    //   return true;
    // } else if (this.isUnavailableButton) {
    //   return true;
    // } else if (this.basketExceededMaxQty && this.quantity > this.maxQuantity) {
    //   return false;
    // }
    return false;
  }

  public get isDoubleDisabled() {
    if (this.doubleDisabled === 10015) {
      return true;
    }
    return false;
  }



  // public get isButtonDisabled(): boolean {
  //   if (this.quantity <= this.minQuantity && !this.hasPrefixes) {
  //     return true;
  //   } else if (this.hasPrefixes && this.prefixQuantity === 0) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  constructor() {}

  public ngOnInit(): void {
  }

  public addOn(): void {

     this.addedOn = !this.addedOn;
     if ((this.addedOn && this.remove)  || (this.addedOn && !this.remove)) {
    this.quantityUpdate.emit(1);
    } else {
      this.quantityUpdate.emit(0);
    }

  }
}


