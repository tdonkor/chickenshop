import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DoCheck,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { createFakeButton, enabledTouchlessMode, isAdaEnabled } from '@dotxix/helpers';
import { ApplicationSettingsService, BasketService, CheckoutService, PaymentModelService } from '@dotxix/services';
import { DotButton, DotButtonType } from 'dotsdk';
import { Subscription } from 'rxjs';
@Component({
  selector: 'acr-buzzer',
  templateUrl: './buzzer.component.html',
  styleUrls: ['./buzzer.component.scss']
})
export class BuzzerComponent implements OnInit {


  constructor() { }

  public ngOnInit(): void { }

}
