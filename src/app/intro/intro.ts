import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  standalone: true,
  selector: 'app-intro',
  templateUrl: './intro.html',
  styleUrls: ['./intro.scss'],
  imports: [CommonModule],
  animations: [
    trigger('fadeInTitle', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(-10px)', filter: 'blur(8px)' }),
        animate('1.4s 0.2s cubic-bezier(0.19, 1, 0.22, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)', filter: 'blur(0)' }))
      ])
    ]),
    trigger('fadeInSubtitle', [
      transition(':enter', [
        style({ opacity: 0, filter: 'blur(4px)' }),
        animate('1s 1s ease-out', style({ opacity: 1, filter: 'blur(0)' }))
      ])
    ]),
    trigger('screenExit', [
      transition(':leave', [
        animate('0.8s cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, filter: 'blur(15px)', transform: 'scale(0.98)' }))
      ])
    ])
  ]
})
export class IntroComponent implements OnInit {
  loadingCards: any[] = [];
  isExiting = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.generateLoadingCards();
    
    // Auto-navigate to tarot after loading shuffle sequence completes
    setTimeout(() => {
      this.isExiting = true;
      setTimeout(() => {
        this.router.navigate(['/tarot']);
      }, 600);
    }, 5000); // 5 seconds of immersive shuffling
  }

  generateLoadingCards() {
    // Generate 12 overlapping cards staggered uniformly across time
    for (let i = 0; i < 12; i++) {
      this.loadingCards.push({
        id: i,
        delay: i * 0.3, // Evenly spaced delay intervals for continuous stream
        rotation: (Math.random() - 0.5) * 35, // Balanced angular fan spread
        driftX: (Math.random() - 0.5) * 160   // Horizontal dispersion width
      });
    }
  }
}