import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DotButton } from 'dotsdk';

@Component({
  selector: 'acr-allergen',
  templateUrl: './allergen.component.html',
  styleUrls: ['./allergen.component.scss']
})
export class AllergenComponent implements OnInit {


  public title = 'ALLERGEN INFO';
  public button: DotButton;

  constructor(protected router: Router) { }

  public ngOnInit(): void {
  }
  public gotoMenuPage() {
    this.router.navigate(['menu', this.button['JumpToPage']]);
  }

}
