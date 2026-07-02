import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

type CardState = 'hidden' | 'revealed';

// Updated to map matching properties from your API structure
interface BackendTarotCard {
  name: string;
  type: string;
  icon: string;
  focus: string;
}

// Extends the backend shape with the frontend tracking variables
interface TarotCard extends BackendTarotCard {
  id: number;
  state: CardState;
}

interface ReadingResponse {
  reading: string;
}

// Updated interface to hold the array of structured card objects
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
  reading = signal('');
  displayedReading = signal('');
  isReadingLoading = signal(false);
  isReadingTyping = signal(false);

  onSpreadChange(value: number) {
    const spreadSize = Number(value);
    
    // Explicitly validate configuration settings for 3 or 9 cards
    if (spreadSize !== 3 && spreadSize !== 9) return;

    this.spreadSize.set(spreadSize);
    this.isSpreadSelected.set(true);

    // Reset layout elements
    this.reading.set('');
    this.displayedReading.set('');
    this.isReadingLoading.set(false);
    this.isReadingTyping.set(false);
    this.stopTyping();
    this.pulledCards.set([]);

    // Fetch the full meta objects from your updated serverless endpoint
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

  revealCard(card: TarotCard) {
    // Only process if the card is hidden and we haven't hit the spread limit
    if (card.state === 'hidden' && this.pulledCards().length < this.spreadSize()) {
      this.cards.update(cards =>
        cards.map(currentCard =>
          currentCard.id === card.id ? { ...currentCard, state: 'revealed' } : currentCard
        )
      );

      const updatedPulls = [...this.pulledCards(), card.name];
      this.pulledCards.set(updatedPulls);

      // Trigger the Gemini structural analysis ONLY when the full layout size is flipped
      if (updatedPulls.length === this.spreadSize()) {
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