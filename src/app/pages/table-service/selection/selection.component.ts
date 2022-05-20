import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { isAdaEnabled } from '@dotxix/helpers';
import { ApplicationSettingsService, BasketService, EndSceneRoutingService, StatusService } from '@dotxix/services';
import { PosElogHandler, DotCatalogLoader, DotButton } from 'dotsdk';

@Component({
  selector: 'acr-table-service-selection',
  templateUrl: './selection.component.html',
  styleUrls: ['./selection.component.scss'],
})
export class TableServiceSelectionComponent {
  public isAdaEnabled = isAdaEnabled;
  public tableServiceNumber = '';
  public takeAway = true
  public eatIn = false
  public tableNumber = ''

  public get disableConfirmButton(): boolean {
    return this.tableServiceNumber.length !== 3;
  }

  public get tableServiceNumberPrefix(): string {
    return this.appSettingsService.tableServiceNumberPrefix
      ? `${this.appSettingsService.tableServiceNumberPrefix} ${this.tableServiceNumber}`
      : this.tableServiceNumber;
  }

  private get tableServiceItem(): DotButton | null {
    if (this.appSettingsService.tableServiceItem) {
      const catalogButton = DotCatalogLoader.getInstance().loadedModel.Buttons.find(
        (btn) => btn.Link === this.appSettingsService.tableServiceItem
      );
      return catalogButton || null;
    }
  }

  constructor(
    protected router: Router,
    protected statusService: StatusService,
    protected appSettingsService: ApplicationSettingsService,
    protected endSceneRouting: EndSceneRoutingService,
    protected basketService: BasketService
  ) { }

  public updateTableServiceNumber(inputValue: string) {
    this.tableServiceNumber = inputValue;
  }

  public confirmTableServiceNumber() {
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
  }

  public cancel() {
    this.endSceneRouting.goToEndScene();
  }

  public keyPress(key: any): void {
    switch (key.type) {
      case 'number':
      case 'text':
        if(this.tableServiceNumber.length < 3) {
          this.tableServiceNumber += key.value;
        }
        break;
      case 'backspace':
        if (this.tableServiceNumber.length > 0) {
          this.tableServiceNumber = this.tableServiceNumber.slice(0, -1);
        }
        break;
      case 'blank':
        this.tableServiceNumber += '_';
        break;
      case 'clear':
        this.tableServiceNumber = '';
        break;
    }
  }
}
