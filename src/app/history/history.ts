import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  standalone: true,
  selector: 'app-history',
  imports: [CommonModule, RouterLink],
  templateUrl: './history.html',
  styleUrls: ['./history.scss'],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, filter: 'blur(15px)', transform: 'scale(0.98)' }),
        animate('0.9s 0.2s cubic-bezier(0, 0.8, 0.2, 1)', style({ opacity: 1, filter: 'blur(0)', transform: 'scale(1)' }))
      ])
    ]),
    trigger('cardSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('0.8s 0.3s cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('articlesFadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s 0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('buttonsReveal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(15px)' }),
        animate('0.5s 0.75s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class HistoryComponent {}
