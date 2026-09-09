import { Component, OnInit, effect } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { ThemeService } from './core/services/theme';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { FooterComponent } from './components/footer/footer.component';
import { Loader } from "./components/loader/loader";
import { filter } from 'rxjs';
import { SHIKSHAGRAHA_LOGO_ALT, SHIKSHAGRAHA_WEBSITE_URL } from '../constants/appConstants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule, DashboardComponent, FooterComponent, Loader],
  template: `
    <app-loader></app-loader>
    <header class="app-header" *ngIf="showHeader">
      <nav class="container">
        <a [href]="shikshagrahaWebsiteUrl" class="logo"><img src="assets/icons/main_logo.png" [alt]="shikshagrahaLogoAlt" class="image-12"></a>

        <button
          class="menu-toggle"
          (click)="toggleMenu()"
          aria-label="Toggle menu"
          [attr.aria-expanded]="isMenuOpen"
          type="button"
        >
          <span *ngIf="!isMenuOpen"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#572e91" class="bi bi-list" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
        </svg></span>
          <span *ngIf="isMenuOpen"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#572e91" class="bi bi-x" viewBox="0 0 16 16">
        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
      </svg></span>
        </button>

        <div class="nav-links" [class.open]="isMenuOpen">
          <a routerLink="/" (click)="closeMenu()"  routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/dashboard" (click)="closeMenu()"  routerLinkActive="active-link">Dashboard</a>
          <a routerLink="/network-health" (click)="closeMenu()"  routerLinkActive="active-link">Network Health</a>
          <a routerLink="/voices-from-the-ground" (click)="closeMenu()"  routerLinkActive="active-link">Voices from the ground</a>
        </div>
      </nav>
    </header>
    <main class="app-content" [class.no-header]="!showHeader">
      <router-outlet></router-outlet>
    </main>
    <app-footer  *ngIf="showFooter"></app-footer>
  `,
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  isMenuOpen = false;
  showHeader = true;
  showFooter = true;
  readonly shikshagrahaWebsiteUrl = SHIKSHAGRAHA_WEBSITE_URL;
  readonly shikshagrahaLogoAlt = SHIKSHAGRAHA_LOGO_ALT;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    effect(() => {
      document.documentElement.className = `${this.themeService.getTheme()()}-theme`;
    });

    this.updateLayoutVisibility();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.updateLayoutVisibility());
  }

  ngOnInit(): void {}

  private updateLayoutVisibility() {
    let currentRoute = this.activatedRoute;

    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    const hideLayout = currentRoute.snapshot.data['hideLayout'] === true;
    this.showHeader = !hideLayout;
    this.showFooter = !hideLayout;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(){
    this.isMenuOpen =false
  }

  toggleTheme() {
    const currentTheme = this.themeService.getTheme()();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }
}
