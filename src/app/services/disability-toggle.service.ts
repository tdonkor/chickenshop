import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DisabilityToggleService {
  public subject = new BehaviorSubject<boolean>(false);
  public setBol = false

  setDisabilityToggleState() {
    this.setBol = !this.setBol
    this.subject.next(this.setBol);
  }

  getDisabilityToggleState(): Observable<any> {
    return this.subject.asObservable();
  }
}
