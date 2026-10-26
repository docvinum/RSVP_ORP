import type { Routes } from '@angular/router';
import { AboutPageComponent } from './about-page.component';
import { ArticlesPageComponent } from './articles-page.component';

export const routes: Routes = [
  { path: 'articles', component: ArticlesPageComponent },
  { path: 'a-propos', component: AboutPageComponent },
  { path: '**', redirectTo: 'articles' },
];
