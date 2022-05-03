import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DipService {
  private subject = new Subject<any>();
  private subject2 = new Subject<any>();

  submitDip() {
    this.subject.next();
  }

  addToBasket() {
    this.subject2.next();
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }

  getMessage2(): Observable<any> {
    return this.subject2.asObservable();
  }
}
