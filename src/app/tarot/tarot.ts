import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-tarot',
  imports: [FormsModule],
  templateUrl: './tarot.html',
  styleUrls: ['./tarot.scss'],
  animations: [
    trigger('pageEnter', [
      transition(':enter', [
        style({ opacity: 0, filter: 'blur(15px)', transform: 'scale(0.98)' }),
        animate('1s 0.2s cubic-bezier(0, 0.8, 0.2, 1)', style({ opacity: 1, filter: 'blur(0)', transform: 'scale(1)' }))
      ])
    ]),
    trigger('headerPosition', [
      state('initial', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
      state('selected', style({ transform: 'translateY(-0.5rem) scale(0.97)', opacity: 1 })),
      transition('initial => selected', [
        animate('0.7s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('spreadPanelPosition', [
      state('initial', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
      state('selected', style({ transform: 'translateY(-0.5rem) scale(0.96)', opacity: 0.95 })),
      transition('initial => selected', [
        animate('0.7s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('cardsContainerPosition', [
      state('hidden', style({ transform: 'translateY(24px)', opacity: 0 })),
      state('visible', style({ transform: 'translateY(0)', opacity: 1 })),
      transition('hidden => visible', [
        animate('0.7s 0.2s cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('cardFlip', [
      state('hidden', style({ transform: 'rotateY(0deg)' })),
      state('revealed', style({ transform: 'rotateY(180deg)' })),
      transition('hidden => revealed', [
        animate('0.6s cubic-bezier(0.23, 1, 0.32, 1)')
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class TarotComponent {
  spreadSize: number = 0;
  isSpreadSelected: boolean = false;
  layoutState: 'initial' | 'selected' = 'initial';
  cardsState: 'hidden' | 'visible' = 'hidden';
  cards: any[] = [];
  pulledCards: string[] = [];
  question: string = '';
  reading: string = '';

  masterDeck = [
    { name: 'The Fool' }, { name: 'The Magician' }, { name: 'The High Priestess' },
    { name: 'The Empress' }, { name: 'The Emperor' }, { name: 'The Hierophant' },
    { name: 'The Lovers' }, { name: 'The Chariot' }, { name: 'Strength' }

  ];

  constructor(private http: HttpClient) {}

  onSpreadChange() {
    if (this.spreadSize > 0) {
      this.isSpreadSelected = true;
      this.layoutState = 'selected';
      this.cardsState = 'visible';

      this.reading = '';
      this.pulledCards = [];

      this.cards = this.masterDeck.slice(0, this.spreadSize).map((card, index) => ({
        id: index + 1,
        name: card.name,
        state: 'hidden'
      }));
    }
  }

  revealCard(card: any) {
    if (card.state === 'hidden' && this.pulledCards.length < this.spreadSize) {
      card.state = 'revealed';
      this.pulledCards.push(card.name);

      if (this.pulledCards.length === Number(this.spreadSize)) {
        debugger;
        this.getGeminiReading();
      }
    }
  }

  getGeminiReading() {
    const payload = {
      question: this.question,
      cards: this.pulledCards
    };

    this.http.post('/api/reading', payload).subscribe({
      next: (response: any) => {
        this.reading = response.reading;
      },
      error: (error) => {
        console.error('Error fetching reading:', error);
        this.reading = 'An error occurred while fetching the reading. Please try again.';
      }
    });
  }
}