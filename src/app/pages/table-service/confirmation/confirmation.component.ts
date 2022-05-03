import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { isAdaEnabled, log, routeToFirstPage } from '@dotxix/helpers';
import { SessionEndType, SessionService, WindowReloadService } from '@dotxix/services';

@Component({
  selector: 'acr-table-service-confirmation',
  templateUrl: './confirmation.component.html',
})
export class TableServiceConfirmationComponent implements OnInit {
  public isAdaEnabled = isAdaEnabled;

  constructor(protected router: Router,
              protected sessionService: SessionService,
              private windowReload: WindowReloadService) {}

  // public ngAfterViewInit(): void {
  //   setTimeout(() => {
  //     this.router.navigate(['order-number']);
  //   }, 4000);
  // }

  public async ngOnInit() {
    new Promise<void>((resolve) => {
      setTimeout(async () => {
        log('End Checkout, go to ', routeToFirstPage());
        await this.sessionService.restartSession(SessionEndType.ORDER_SUCCESS);
        resolve();
      }, 5000);
    }).then(() => {
      const isReloading = this.windowReload.isReloading();
      if (!isReloading) {
        this.router.navigate([routeToFirstPage()]);
      }
    });
  }
}
