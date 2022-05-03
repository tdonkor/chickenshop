import { Pipe, PipeTransform } from '@angular/core';
import { DotButton, DotCatalogLoader } from 'dotsdk';
import { TranslatePicturePipe } from './translate-picture.pipe';

@Pipe({
  name: 'catalogPicture'
})
export class CatalogPicturePipe implements PipeTransform {

  constructor(protected translatePicturePipe: TranslatePicturePipe) {
  }

  public transform(button: DotButton): string {
    const catalogButton = DotCatalogLoader.getInstance().loadedModel.Buttons.find(btn => btn.Link === button.Link);
    if (catalogButton) {
        return this.translatePicturePipe.transform(catalogButton);
    }
    return './assets/branding/logo.png';
  }
}
