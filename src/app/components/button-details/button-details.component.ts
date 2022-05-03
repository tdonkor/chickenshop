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
import { DisabilityToggleService } from '@dotxix/services/disability-toggle.service';

import { DotButton, DotModifier, calculateButtonPrice, DotSuggestionSalesService, DotButtonType, generateUUID } from 'dotsdk';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AddToBasketComponent } from '../add-to-basket/add-to-basket.component';
import { BasketComponent } from '../basket/basket.component';
import { ButtonDetailsService } from './button-details.service';

@Component({
  selector: 'acr-button-details',
  templateUrl: './button-details.component.html',
  styleUrls: ['./button-details.component.scss'],
  animations: [Animations.popupIn, Animations.popupOut],
})
export class ButtonDetailsComponent
  extends AbstractDynamicComponent
  implements OnInit, AfterViewInit, AfterContentChecked, AfterViewChecked
{
  public get unitPrice(): string {
    return this.button.Price;
  }

  public get buttonPrice(): number {
    return calculateButtonPrice(this.button, this.sessionService.serviceType);
  }

  public get selectedDips() {
    let selectedDips = this.freeDip.map((mod) => mod.Buttons.filter((btn) => btn.quantity > 0));
    selectedDips = [].concat.apply([], selectedDips);

    if (this.button['freedip'] !== undefined) {
      const joinedDips = [...selectedDips, ...this.button['freedip']];
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
    return this.modifiers.filter((modifier) => isAutoPopFeatVisible(modifier, !this.button.isChanged, true)).length > 0;
  }

  public get isButtonChanged() {
    return this.button.isChanged;
  }

  public get price(): number {
    return this.buttonPrice * this.button.quantity;
  }

  public get boxMealType(): any {
    return this.mealBox[0];
  }

  public get calories(): string {
    const calories = this.button?.AllergensAndNutritionalValues?.NutritionalValues?.find((val) => val.Name === 'CAL');
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
      ? this.button.quantity < this.button.MinQuantity
      : this.modifiers
          .filter((modif) => isAutoPopFeatVisible(modif, !this.button.isChanged, true))
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
  public mealBox = [];
  public isMealBox = false;
  public mealBoxDrinks = [];
  public forDrinks = [];
  public forFries = [];
  public noBoxMealPrice = 0;
  public isBoxMeal = true;
  public selectDrinksFries = false;
  // public canSelected = false;
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
  public disabilityToggleOpen = false;

  // tslint:disable-next-line: member-ordering
  constructor(
    protected dataParams: DynamicContentParams,
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
    public disabilityToggleService: DisabilityToggleService,
    private ref: ChangeDetectorRef,
    @Inject('SUGGESTION_COMPONENT') protected suggestionComponent: Type<AbstractDynamicComponent>,
    private translateCatalogModifierLabel: TranslateCatalogModifierLabel
  ) {
    super();
    this.subscription = this.dipService.getMessage().subscribe(() => {
      this.dynamicContentRef.close(this.button);
      if (this.freeDip.length > 0 && this.button['isSecondSauce'] !== true && !this.button['addToBasket']) {
        this.button['isSecondSauce'] = true;
        this.button['freedip'] = this.selectedDips;
        this.openDynamicContentService(ButtonDetailsComponent, this.button);
        return;
      }
    });

    this.subscription2 = this.dipService.getMessage2().subscribe(() => {
      this.dynamicContentRef.close(this.button);
      this.button['addToBasket'] = true;
      this.openDynamicContentService(ButtonDetailsComponent, this.button);
      return;
    });
  }

  public submitDip() {
    this.dynamicContentRef.close(this.button);
    if (this.freeDip.length > 0 && this.button['isSecondSauce'] !== true && !this.button['addToBasket']) {
      this.button['isSecondSauce'] = true;
      this.button['freedip'] = this.selectedDips;
      this.openDynamicContentService(ButtonDetailsComponent, this.button);
      return;
    }
  }

  public addToCart() {
    // this.dynamicContentRef.close(this.button);
    this.button['addToBasket'] = true;
    // this.openDynamicContentService(ButtonDetailsComponent, this.button);
    return;
  }

  public selectSingleOrDouble(link): any {
    const mods = this.button.hasModifiers ? this.button.ModifiersPage.Modifiers : [];
    this.singleDoubleSection = mods.filter((mod) => mod.Buttons.some((btn) => btn.Link === '51931'));

    this.singleDoubleSection.map((mod) => {
      mod.Buttons.map((btn) => {
        btn.Selected = btn.Link === link ? true : false;
        btn.quantity = btn.Link === link ? 1 : 0;
      });
    });
  }

  public ngOnInit(): void {
    this.disabilityToggleService.getDisabilityToggleState().subscribe((val) => {
      this.disabilityToggleOpen = val;
    });
    this.button = _.cloneDeep(this.dataParams.btn);
    this.button.quantity = this.button.quantity ? this.button.quantity : 1;
    this.componentService.init(this.button);
    if (!this.button.uuid) {
      this.componentService.setModifiersIncludedQuantity();
    }

    this.catalogModifierLabelText = this.translateCatalogModifierLabel.transform(this.button);

    const mods = (this.button.hasModifiers ? this.button.ModifiersPage.Modifiers : []).map((mod) => {
      return {
        ...mod,
        Buttons: mod.Buttons.map((btn) => {
          btn['doubleDisabled'] = mod.PageInfo.ModifierID;
          btn['modType'] = mod.PageInfo.Name;
          btn.HasPrefixes = false;
          return btn;
        }),
      };
    });

    const modsNoMeal = [];
    mods.map((mod) => {
      if (mod.PageInfo.ModifierID !== 10044) {
        return modsNoMeal.push(mod);
      } else {
        this.mealBox.push(mod);
        this.forFries = mod.Buttons.map((mod, i) => {
          if (i !== 0) {
            if (mod.Tags === 'Fries') {
              mod.Selected = mod.DefaultQuantity === 1 ? true : false;
              mod.quantity = mod.DefaultQuantity === 1 ? 1 : null;
              return mod;
            }
          }
        }).filter((item) => item !== undefined);

        this.forDrinks = mod.Buttons.map((mod, i) => {
          if (i !== 0) {
            if (mod.Tags === 'Drinks') {
              mod.Selected = mod.DefaultQuantity === 1 ? true : false;
              mod.quantity = mod.DefaultQuantity === 1 ? 1 : null;
              return mod;
            }
          }
        }).filter((item) => item !== undefined);

        this.mealBox = mod.Buttons.map((mod, i) => {
          if (i === 0) {
            return mod;
          }
        }).filter((item) => item !== undefined);

        this.isMealBox = true;
      }
    });

    const result = modsNoMeal.filter((mod) => mod.Buttons.every((btn) => btn.Link !== '51931'));
    this.modifiers = result.filter((mod) => mod.Buttons.every((btn) => btn.Link !== '11901'));

    const filter = ['1'];
    this.modifiers.map((mods) => {
      mods.Buttons = mods.Buttons.filter((btn) => filter.includes(btn.ButtonStatus));
      return mods;
    });

    this.singleDoubleSection = modsNoMeal.filter((mod) => mod.Buttons.some((btn) => btn.Link === '51931'));

    this.singleDoubleSection.map((mods) => {
      mods.Buttons.map((btn) => {
        btn.Selected = btn.Link === '51931' ? true : false;
      });
    });

    this.singleDouble = this.singleDoubleSection.length > 0 ? this.singleDoubleSection && this.singleDoubleSection[0].Buttons : [];

    this.freeDip = modsNoMeal.filter((mod) => mod.PageInfo.ModifierID === 10003 || mod.PageInfo.ModifierID === 10005);

    if (this.button['isSecondSauce']) {
      this.freeDip = modsNoMeal.filter((mod) => mod.PageInfo.ModifierID === 10009 || mod.PageInfo.ModifierID === 10017);
    }

    if (!this.button['isSecondSauce'] && this.freeDip.length < 1) {
      this.button['isSecondSauce'] = true;
      this.freeDip = modsNoMeal.filter((mod) => mod.PageInfo.ModifierID === 10017);
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
      this.button.Selected = true;
      this.button.quantity++;
    } else {
      if (this.button.quantity > 1) {
        this.button.quantity--;
      }
    }
  }

  public quantity(): number {
    return (this.button.quantity = this.button.quantity === 0 ? 1 : this.button.quantity);
  }

  public confirmClick(): void {
    this.button['addToBasket'] = false;
    this.button['$$suggestionChanged'] = true;
    this.componentService.addAutoCompleteModifiers();

    if (this.button['JumpToPage']) {
      this.router.navigate(['menu', this.button['JumpToPage']]);
    }

    const suggestions = DotSuggestionSalesService.getInstance().getButtonSuggestionByLink(this.button.Link);

    if (suggestions && suggestions.length > 0 && !this.dataParams.fromSuggestions) {
      this.button['parentLinkUUID'] = this.button['parentLinkUUID'] || generateUUID();
      this.dynamicContentService.openContent(this.suggestionComponent, {
        suggestion: new Suggestion(suggestions, this.button['parentLinkUUID']),
      });
    }

    if (!this.dataParams.disableAddButtonToBasket) {
      this.basketService.addButtonToBasket(this.button);
    }

    this.exitAnimation = true;
    this.dynamicContentRef.close(ButtonDetailsComponent);
    setTimeout(() => {
      this.dynamicContentRef.close(this.button);
      if (this.appSettings.viewBasketAfterProductSelection === true && !suggestions && !this.dataParams.fromSuggestions) {
        this.basketService.openBasket(BasketComponent);
      }
    }, 350);

    // if (this.button.Caption === 'FREESTYLE REFILL') {
    //   alert('has')
    //   this.button['freestyleDrink'] = true;
    // }

  }

  public addToBasket() {
    this.button['addToBasket'] = true;
  }

  public checkout() {
    if (this.isBoxMeal) {
      this.mealBox[0].Selected = true;
      this.mealBox[0].quantity = 1;
    }

    this.isMealBox = false;
    this.selectDrinksFries = false;
    // this.button['addToBasket'] = true;
  }

  public mealSelected() {
    this.isMealBox = false;
    if (!this.isBoxMeal) {
      this.button.ModifiersPage.Modifiers[0].Buttons.map((btn, index) => {
        if (index !== 0) {
          btn.Selected = this.isBoxMeal;
          btn.quantity = this.isBoxMeal ? 1 : null;
        }
      });
      this.selectDrinksFries = this.isBoxMeal;
      this.button['freestyleDrink'] = this.isBoxMeal;
    } else {
      this.selectDrinksFries = true;
      this.button['freestyleDrink'] = true;
    }
  }

  public makeMeal(isMeal) {
    if (isMeal) {
      this.mealBox[0].Selected = true;
      this.mealBox[0].quantity = 1;
      this.button['freestyleDrink'] = true;
      this.isBoxMeal = true;
    } else {
      this.mealBox[0].Selected = false;
      this.mealBox[0].quantity = 0;
      this.button['freestyleDrink'] = false;
      this.isBoxMeal = false;
    }
  }

  public selectedFries(index) {
    this.forFries.map((drinks, i) => {
      if (index === i) {
        drinks.Selected = true;
        drinks.quantity = 1;
      } else {
        drinks.Selected = false;
        drinks.quantity = null;
      }
    });
  }

  public selectedDrink(index) {
    this.forDrinks.map((drinks, i) => {
      if (index === 0) {
        if (drinks.Caption === 'FREESTYLE REFILL') {
          this.button['freestyleDrink'] = true;
        }
      } else {
        this.button['freestyleDrink'] = false;
      }

      if (index === i) {
        drinks.Selected = true;
        drinks.quantity = 1;
      } else {
        drinks.Selected = false;
        drinks.quantity = null;
      }
    });
  }

  public cancelClick(): void {
    this.button['$$suggestionChanged'] = false;
    this.exitAnimation = true;
    setTimeout(() => {
      this.dynamicContentRef.close(this.button);
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
