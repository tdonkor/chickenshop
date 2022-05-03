import {
  AfterContentChecked,
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Type,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Animations } from '@dotxix/animation';
import { enabledTouchlessMode, isAdaEnabled, isAutoPopFeatVisible, log } from '@dotxix/helpers';
import { Suggestion } from '@dotxix/models';
import { DotCdkTitleTranslatePipe, TranslateCatalogModifierLabel } from '@dotxix/pipes';
import {
  AbstractDynamicComponent,
  ApplicationSettingsService,
  BasketService,
  DynamicContentParams,
  DynamicContentRef,
  DynamicContentService,
  SessionService,
} from '@dotxix/services';
import { DipService } from '@dotxix/services/dip.service';

import { DotButton, DotModifier, calculateButtonPrice, DotSuggestionSalesService, DotButtonType, generateUUID } from 'dotsdk';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { BasketComponent } from '../basket/basket.component';
import { ButtonDetailsService } from './add-to-basket.service';

@Component({
  selector: 'acr-add-to-basket',
  templateUrl: './add-to-basket.component.html',
  styleUrls: ['./add-to-basket.component.scss'],
  animations: [Animations.popupIn, Animations.popupOut],
})
export class AddToBasketComponent
  extends AbstractDynamicComponent
  implements OnInit, AfterViewInit, AfterContentChecked, AfterViewChecked
{
  public get unitPrice(): string {
    return this.dataParams.btn.Price;
  }

  public get buttonPrice(): number {
    return calculateButtonPrice(this.dataParams.btn, this.sessionService.serviceType);
  }

  public get selectedDips() {
    let selectedDips = this.freeDip.map((mod) => mod.Buttons.filter((btn) => btn.quantity > 0));
    selectedDips = [].concat.apply([], selectedDips);

    if (this.dataParams.btn['freedip'] !== undefined) {
      const joinedDips = [...selectedDips, ...this.dataParams.btn['freedip']];
      return joinedDips;
    }

    return selectedDips;
  }

  public get displayModifierButtons(): boolean {
    // if modifier group MinQty not reached and there is no AutoComplete on any modifier, force AutoPopFeat = 1 so the modifiers are visible and the appropriate quantities can be selected
    for (const modifier of this.modifiers) {
      const autoCompleteButton = modifier.Buttons.find((mod) => mod.AutoComplete === 1);
      const qtyButtons = modifier.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
      if (modifier.PageInfo.MinQuantity && modifier.PageInfo.MinQuantity > qtyButtons && !autoCompleteButton) {
        modifier.PageInfo.AutoPopFeat = '1';
      }
    }
    return this.modifiers.filter((modifier) => isAutoPopFeatVisible(modifier, !this.dataParams.btn.isChanged, true)).length > 0;
  }

  public get isButtonChanged() {
    return this.dataParams.btn.isChanged;
  }

  public get price(): number {
    return this.buttonPrice * this.dataParams.btn.quantity;
  }

  public get calories(): string {
    const calories = this.dataParams.btn?.AllergensAndNutritionalValues?.NutritionalValues?.find((val) => val.Name === 'CAL');
    return calories ? calories.Value : '';
  }

  public get getQuantityButtons() {
    let totalQty = 0;
    this.modifiers.some((y) =>
      y.Buttons.filter((btn) => btn.ButtonType === DotButtonType.ITEM_PACK_BUTTON).forEach((x) => {
        totalQty += x.Page.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0);
      })
    );
    this.modifiers.forEach(
      (x) => (totalQty += x.Buttons.reduce((totalQuantity: number, button: DotButton) => totalQuantity + button.quantity, 0))
    );
    return totalQty;
  }

  public get disableConfirmButton(): boolean {
    return this.modifiers.length === 0
      ? this.dataParams.btn.quantity < this.dataParams.btn.MinQuantity
      : this.modifiers
          .filter((modif) => isAutoPopFeatVisible(modif, !this.dataParams.btn.isChanged, true))
          .some((modifier) => {
            return (
              this.getQuantityButtons < modifier.PageInfo.MinQuantity &&
              !this.modifiers.some((x) => x.Buttons.find((y) => y.AutoComplete === 1))
            );
          });
  }

  public get scrollIncrement(): number {
    return this._scrollIncrement;
  }
  public modifiers: any;
  public singleDoubleSection: any;
  public freeDip: any;
  public singleDouble = [];
  public subscription: Subscription;
  public subscription2: Subscription;
  @ViewChild('scrollRef') public scrollRef: ElementRef;
  @ViewChild('modifierMessagesTpl') public modifierMessagesTpl: ElementRef;

  public enabledTouchlessMode = enabledTouchlessMode;
  public button: DotButton;
  public exitAnimation = false;
  public catalogModifierLabelText?: string;
  public isAdaEnabled = isAdaEnabled;
  private _scrollIncrement;

  // tslint:disable-next-line: member-ordering
  constructor(
    public dataParams: DynamicContentParams,
    protected router: Router,
    protected activatedRoute: ActivatedRoute,
    protected dynamicContentRef: DynamicContentRef,
    protected dynamicContentService: DynamicContentService,
    protected titleTranslatePipe: DotCdkTitleTranslatePipe,
    protected appSettings: ApplicationSettingsService,
    protected basketService: BasketService,
    protected sessionService: SessionService,
    private componentService: ButtonDetailsService,
    public dipService: DipService,
    private ref: ChangeDetectorRef,
    @Inject('SUGGESTION_COMPONENT') protected suggestionComponent: Type<AbstractDynamicComponent>,
    private translateCatalogModifierLabel: TranslateCatalogModifierLabel
  ) {
    super();
  }

  public selectSingleOrDouble(link): any {
    const mods = this.dataParams.btn.hasModifiers ? this.dataParams.btn.ModifiersPage.Modifiers : [];
    this.singleDoubleSection = mods.filter((mod) => mod.Buttons.some((btn) => btn.Link === '51931'));

    this.singleDoubleSection.map((mod) => {
      mod.Buttons.map((btn) => {
        btn.Selected = btn.Link === link ? true : false;
        btn.quantity = btn.Link === link ? 1 : 0;
      });
    });
  }

  public ngOnInit(): void {
    // this.dataParams.btn = _.cloneDeep(this.dataParams.btn);

    this.dataParams.btn.quantity = this.dataParams.btn.quantity ? this.dataParams.btn.quantity : 1;
    this.componentService.init(this.dataParams.btn);

    if (!this.dataParams.btn.uuid) {
      this.componentService.setModifiersIncludedQuantity();
    }

    this.catalogModifierLabelText = this.translateCatalogModifierLabel.transform(this.dataParams.btn);

    const mods = (this.dataParams.btn.hasModifiers ? this.dataParams.btn.ModifiersPage.Modifiers : []).map((mod) => {
      return {
        ...mod,
        Buttons: mod.Buttons.map((btn) => {
          btn['doubleDisabled'] = mod.PageInfo.ModifierID;
          return btn;
        }),
      };
    });

    const result = mods.filter((mod) => mod.Buttons.every((btn) => btn.Link !== '51931'));
    this.modifiers = result.filter((mod) => mod.Buttons.every((btn) => btn.Link !== '11901'));

    const filter = ['1'];
    this.modifiers.map((mods) => {
      mods.Buttons = mods.Buttons.filter((btn) => filter.includes(btn.ButtonStatus));
      return mods;
    });

    this.singleDoubleSection = mods.filter((mod) => mod.Buttons.some((btn) => btn.Link === '51931'));

    this.singleDoubleSection.map((mods) => {
      mods.Buttons.map((btn) => {
        btn.Selected = btn.Link === '51931' ? true : false;
      });
    });

    this.singleDouble = this.singleDoubleSection.length > 0 ? this.singleDoubleSection && this.singleDoubleSection[0].Buttons : [];

    this.freeDip = mods.filter((mod) => mod.PageInfo.ModifierID === 10003 || mod.PageInfo.ModifierID === 10005);

    if (this.dataParams.btn['isSecondSauce']) {
      this.freeDip = mods.filter((mod) => mod.PageInfo.ModifierID === 10009 || mod.PageInfo.ModifierID === 10017);
    }

    if (!this.dataParams.btn['isSecondSauce'] && this.freeDip.length < 1) {
      this.dataParams.btn['isSecondSauce'] = true;
      this.freeDip = mods.filter((mod) => mod.PageInfo.ModifierID === 10017);
    }
  }

  public ngAfterContentChecked() {
    this.ref.detectChanges();
  }

  public ngAfterViewChecked() {
    this.ref.detectChanges();
  }

  public ngAfterViewInit() {
    this.verticalScrollIncrement();
  }

  public onQuantityUpdate(count: 1 | -1): void {
    if (count > 0) {
      this.dataParams.btn.Selected = true;
      this.dataParams.btn.quantity++;
    } else {
      if (this.dataParams.btn.quantity > 1) {
        this.dataParams.btn.quantity--;
      }
    }
  }

  public quantity(): number {
    return (this.dataParams.btn.quantity = this.dataParams.btn.quantity === 0 ? 1 : this.dataParams.btn.quantity);
  }

  public confirmClick(): void {
    this.dataParams.btn['$$suggestionChanged'] = true;
    this.componentService.addAutoCompleteModifiers();
    if (this.dataParams.btn['JumpToPage']) {
      this.router.navigate(['menu', this.dataParams.btn['JumpToPage']]);
    }
    const suggestions = DotSuggestionSalesService.getInstance().getButtonSuggestionByLink(this.dataParams.btn.Link);

    if (suggestions && suggestions.length > 0 && !this.dataParams.fromSuggestions) {
      this.dataParams.btn['parentLinkUUID'] = this.dataParams.btn['parentLinkUUID'] || generateUUID();
      this.dynamicContentService.openContent(this.suggestionComponent, {
        suggestion: new Suggestion(suggestions, this.dataParams.btn['parentLinkUUID']),
      });
    }

    if (!this.dataParams.disableAddButtonToBasket) {
      this.basketService.addButtonToBasket(this.dataParams.btn);
    }
    this.exitAnimation = true;
    setTimeout(() => {
      this.dynamicContentRef.close(this.dataParams.btn);
      if (this.appSettings.viewBasketAfterProductSelection === true && !suggestions && !this.dataParams.fromSuggestions) {
        this.basketService.openBasket(BasketComponent);
      }
    }, 350);
  }

  public cancelClick(): void {
    this.dataParams.btn['$$suggestionChanged'] = false;
    this.exitAnimation = true;
    setTimeout(() => {
      this.dynamicContentRef.close(this.dataParams.btn);
      if (
        this.appSettings.viewBasketAfterProductSelection === true &&
        !this.dataParams.fromSuggestions &&
        this.basketService.buttons &&
        this.basketService.buttons.length > 0
      ) {
        this.basketService.openBasket(BasketComponent);
      }
    }, 350);
  }

  private openDynamicContentService(componentClass: Type<AbstractDynamicComponent>, button: DotButton) {
    const componentRef = this.dynamicContentService.openContent(componentClass, { btn: button });
    // this.subscriptions.push(componentRef.afterClosed.subscribe(() => (this.dropdownPage = { display: false })));
  }

  private verticalScrollIncrement() {
    this._scrollIncrement = this.scrollRef ? this.scrollRef?.nativeElement?.clientHeight / 1.2 : 0;
  }
}


