import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotButtonType, DotCatalogLoader, DotCombosCatalogLoader, DotMeal } from 'dotsdk';
import { TranslatePicturePipe } from './translate-picture.pipe';

@Pipe({
  name: 'makeItAMealPicture'
})
export class MakeItAMealImagePipe implements PipeTransform {

  constructor(protected translatePicturePipe: TranslatePicturePipe) {
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
    if (button) {
      return this.translatePicturePipe.transform(button);
    }
    return './assets/branding/logo.png';
  }
}

