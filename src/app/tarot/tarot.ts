import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type CardState = 'hidden' | 'revealed';

interface TarotCard {
  id: number;
  name: string;
  state: CardState;
}

interface ReadingResponse {
  reading: string;
}

@Component({
  standalone: true,
  selector: 'app-tarot',
  imports: [FormsModule],
  templateUrl: './tarot.html',
  styleUrls: ['./tarot.scss']
})
export class TarotComponent implements OnDestroy {
  private readonly http = inject(HttpClient);
  private typingTimer: ReturnType<typeof setInterval> | null = null;

  spreadSize = signal(0);
  isSpreadSelected = signal(false);
  cards = signal<TarotCard[]>([]);
  pulledCards = signal<string[]>([]);
  question = signal('');
  reading = signal('');
  displayedReading = signal('');
  isReadingLoading = signal(false);
  isReadingTyping = signal(false);

  masterDeck = [
    { name: 'The Fool' }, { name: 'The Magician' }, { name: 'The High Priestess' },
    { name: 'The Empress' }, { name: 'The Emperor' }, { name: 'The Hierophant' },
    { name: 'The Lovers' }, { name: 'The Chariot' }, { name: 'Strength' }

  ];

  onSpreadChange(value: number) {
    const spreadSize = Number(value);
    this.spreadSize.set(spreadSize);

    if (spreadSize > 0) {
      this.isSpreadSelected.set(true);

      this.reading.set('');
      this.displayedReading.set('');
      this.isReadingLoading.set(false);
      this.isReadingTyping.set(false);
      this.stopTyping();
      this.pulledCards.set([]);

      this.cards.set(this.masterDeck.slice(0, spreadSize).map((card, index) => ({
        id: index + 1,
        name: card.name,
        state: 'hidden'
      })));
    }
  }

  revealCard(card: TarotCard) {
    if (card.state === 'hidden' && this.pulledCards().length < this.spreadSize()) {
      this.cards.update(cards =>
        cards.map(currentCard =>
          currentCard.id === card.id ? { ...currentCard, state: 'revealed' } : currentCard
        )
      );

      const pulledCards = [...this.pulledCards(), card.name];
      this.pulledCards.set(pulledCards);

      if (pulledCards.length === 1) {
        this.getGeminiReading();
      }
    }
  }

  getGeminiReading() {
    const payload = {
      question: this.question(),
      cards: this.pulledCards()
    };

    this.isReadingLoading.set(true);
    this.isReadingTyping.set(false);
    this.reading.set('');
    this.displayedReading.set('');
    this.stopTyping();

    this.http.post<ReadingResponse>('/api/reading', payload).subscribe({
      next: (response) => {
        this.reading.set(response.reading);
        this.isReadingLoading.set(false);
        this.startTyping(response.reading);
      },
      error: (error) => {
        console.error('Error fetching reading:', error);
        const fallbackReading = 'An error occurred while fetching the reading. Please try again.';
        this.reading.set(fallbackReading);
        this.isReadingLoading.set(false);
        this.startTyping(fallbackReading);
      }
    });
  }

  ngOnDestroy() {
    this.stopTyping();
  }

  private startTyping(text: string) {
    let index = 0;
    const typingSpeedMs = 18;

    this.displayedReading.set('');
    this.isReadingTyping.set(true);

    this.typingTimer = setInterval(() => {
      index += 1;
      this.displayedReading.set(text.slice(0, index));

      if (index >= text.length) {
        this.isReadingTyping.set(false);
        this.stopTyping();
      }
    }, typingSpeedMs);
  }

  private stopTyping() {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }
}
