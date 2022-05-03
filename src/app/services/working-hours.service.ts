import { Injectable } from '@angular/core';

import {
  DotWorkingHoursLoader,
  SectionResponse,
  WorkingHourHelpers,
  SectionAvailability,
} from 'dotsdk';

@Injectable({
  providedIn: 'root'
})
export class WorkingHoursService {

  public whHelper: WorkingHourHelpers;

  constructor() {
    const list = DotWorkingHoursLoader.getInstance().loadedModel;
    const { WorkingHourList } = list || {};
    if (WorkingHourList) {
      this.whHelper = new WorkingHourHelpers(list);
    }
  }

  public getSectionResponse(sectionAvailability: SectionAvailability): SectionResponse {
    if (this.whHelper) {
      return this.whHelper.isSectionWithinWorkingHours(
        sectionAvailability
      );
    }
    return;

  }
}
