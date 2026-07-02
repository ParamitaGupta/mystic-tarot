import { Component, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type CardState = 'hidden' | 'revealed';

interface BackendTarotCard {
  name: string;
  type: string;
  icon: string;
  focus: string;
}

interface TarotCard extends BackendTarotCard {
  id: number;
  state: CardState;
}

interface ReadingResponse {
  reading: string;
}

interface DeckResponse {
  cards: BackendTarotCard[];
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
  isShuffling = signal(false);
  
  reading = signal('');
  displayedReading = signal('');
  isReadingLoading = signal(false);
  isReadingTyping = signal(false);

  // Computed state helper that validates if input text exists and all spread choices are flipped open
  canRequestReading = computed(() => {
    const hasQuestion = this.question().trim().length > 0;
    const allCardsRevealed = this.pulledCards().length === this.spreadSize() && this.spreadSize() > 0;
    return hasQuestion && allCardsRevealed && !this.isReadingLoading() && !this.isShuffling();
  });

  onSpreadChange(value: number) {
    const spreadSize = Number(value);
    
    // Explicitly validate configuration settings down to 1 or 3 choices
    if (spreadSize !== 1 && spreadSize !== 3) return;

    this.spreadSize.set(spreadSize);
    this.isSpreadSelected.set(true);
    this.resetReadingState();

    this.http.get<DeckResponse>(`/api/reading?count=${spreadSize}`).subscribe({
      next: (response) => {
        this.cards.set(response.cards.map((card, index) => ({
          id: index + 1,
          name: card.name,
          type: card.type,
          icon: card.icon,
          focus: card.focus,
          state: 'hidden'
        })));
      },
      error: (error) => {
        console.error('Failed to pull randomized backend deck:', error);
      }
    });
  }

  // Simulates a card mixing visual loop routine purely inside frontend state layer
  shuffleLocalDeck() {
    if (this.cards().length === 0 || this.isShuffling()) return;
    
    this.isShuffling.set(true);
    this.resetReadingState();
    
    let iterations = 0;
    const interval = setInterval(() => {
      this.cards.update(currentCards => {
        const shuffled = [...currentCards];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.map((c, idx) => ({ ...c, id: idx + 1, state: 'hidden' as CardState }));
      });

      iterations++;
      if (iterations >= 8) {
        clearInterval(interval);
        this.isShuffling.set(false);
      }
    }, 100);
  }

  revealCard(card: TarotCard) {
    if (this.isShuffling()) return;
    
    if (card.state === 'hidden' && this.pulledCards().length < this.spreadSize()) {
      this.cards.update(cards =>
        cards.map(currentCard =>
          currentCard.id === card.id ? { ...currentCard, state: 'revealed' } : currentCard
        )
      );
      this.pulledCards.update(pulls => [...pulls, card.name]);
    }
  }

  getGeminiReading() {
    if (!this.canRequestReading()) return;

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
        console.error('Error fetching reading execution:', error);
        const fallbackReading = 'An error occurred while compiling the psychological synthesis. Please try again.';
        this.reading.set(fallbackReading);
        this.isReadingLoading.set(false);
        this.startTyping(fallbackReading);
      }
    });
  }

  ngOnDestroy() {
    this.stopTyping();
  }

  private resetReadingState() {
    this.reading.set('');
    this.displayedReading.set('');
    this.isReadingLoading.set(false);
    this.isReadingTyping.set(false);
    this.pulledCards.set([]);
    this.stopTyping();
  }

  private startTyping(text: string) {
    let index = 0;
    const typingSpeedMs = 14;

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