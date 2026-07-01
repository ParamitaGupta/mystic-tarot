import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-intro',
  templateUrl: './intro.html',
  styleUrls: ['./intro.scss'],
  imports: []
})
export class IntroComponent implements OnInit {
  private readonly router = inject(Router);

  loadingCards: any[] = [];
  isExiting = false;

  ngOnInit() {
    this.generateLoadingCards();
    
    // Auto-navigate to tarot after loading shuffle sequence completes
    setTimeout(() => {
      this.isExiting = true;
      setTimeout(() => {
        this.router.navigate(['/tarot']);
      }, 800);
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
