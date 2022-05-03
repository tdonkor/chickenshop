import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotCatalogLoader } from 'dotsdk';
import { TranslationsService } from '../services/translations/translations.service';

@Pipe({
  name: 'translateCatalogTitle'
})
export class TranslateCatalogTitle implements PipeTransform {

  constructor(protected translationsService: TranslationsService) {
  }

  public transform(button: DotButton): string | null {
    const catalogButton = DotCatalogLoader.getInstance().loadedModel.Buttons.find(btn => btn.Link === button.Link);
    if (catalogButton) {
      return this.translationsService.getTranslatedButtonCaption(catalogButton);
    }

    return null;
  }
}
