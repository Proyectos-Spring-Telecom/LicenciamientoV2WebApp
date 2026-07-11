import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthTransitionService } from './services/auth-transition.service';
import { AuthenticationService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(
    readonly authTransition: AuthTransitionService,
    private readonly router: Router,
    private readonly auth: AuthenticationService,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = e.urlAfterRedirects || e.url;
        if (path.startsWith('/login')) {
          this.auth.logoutOnLoginScreen();
        }
      });
  }
}
