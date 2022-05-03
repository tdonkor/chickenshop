import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotButtonType, DotCatalogLoader, DotCombosCatalogLoader, DotMeal } from 'dotsdk';
import { CurrencyPipe } from './currency.pipe';

@Pipe({
  name: 'makeItAMealPrice'
})
export class MakeItAMealPricePipe implements PipeTransform {

  constructor(protected dotCurrencyPipe: CurrencyPipe) {
  }

  public transform(mealButton: DotMeal): string {
    let button: DotButton;
    switch (mealButton.ButtonType) {
      case DotButtonType.MENU_BUTTON:
        const comboCatalog = DotCombosCatalogLoader.getInstance().loadedModel;
        button = comboCatalog.Buttons.find(b => b.Link === mealButton.Id);
        break;
      case DotButtonType.ITEM_BUTTON:
        const catalog = DotCatalogLoader.getInstance().loadedModel;
        button = catalog.Buttons.find(b => b.Link === mealButton.Id);
    }
    return button && button['MinPrice'] ? this.dotCurrencyPipe.transform(button['MinPrice']) : null;
  }
}

