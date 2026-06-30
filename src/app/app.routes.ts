import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'intro' },
  {
    path: 'intro',
    loadComponent: () => import('./intro/intro').then(m => m.IntroComponent)
  },
  {
    path: 'tarot',
    loadComponent: () => import('./tarot/tarot').then(m => m.TarotComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history').then(m => m.HistoryComponent)
  }
];
