import { useState } from "react";
import DeckCard from "../components/DeckCard.tsx";
import styles from "../App.module.scss";

export default function MyDecksPage() {
  // simulate decks stored in local memory for now
  const [decks, setDecks] = useState<string[]>([]);

  const addDeck = () => {
    const newDeckName = `Deck ${decks.length + 1}`;
    setDecks([...decks, newDeckName]);
  };

  // If no decks, show one “add” slot
  if (decks.length === 0) {
    return (
      <div className={styles.pageRoot}>
        <h1>My Decks</h1>
        <div className={styles.deckSlots}>
          <DeckCard isAddButton onClick={addDeck} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageRoot}>
      <h1>My Decks</h1>
      <div className={styles.deckSlots}>
        {decks.map((deck) => (
          <DeckCard key={deck} title={deck} />
        ))}
        <DeckCard isAddButton onClick={addDeck} />
      </div>
    </div>
  );
}
