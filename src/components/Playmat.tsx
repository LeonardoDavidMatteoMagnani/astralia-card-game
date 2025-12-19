import { useEffect, useState } from "react";
import styles from "./Playmat.module.scss";
import CardDisplay from "./CardDisplay";
import DeckActionModal from "./DeckActionModal";
import MulliganModal from "./MulliganModal";
import PersonaSelectionModal from "./PersonaSelectionModal";
import { getCardFaces } from "../services/cardDataService";
import { gameConnection } from "../services/gameConnection";
import type { Card } from "../types/Card";
import type { LobbyPlayerState } from "../services/gameConnection";

const CARD_SIZE = 100;

interface PlaymatProps {
  playerName?: string | null;
  opponentName?: string | null;
  playerState?: LobbyPlayerState | null;
  opponentState?: LobbyPlayerState | null;
}

// Shuffle array utility
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Playmat({
  playerName,
  opponentName,
  playerState,
  opponentState,
}: PlaymatProps) {
  const [playerProtagonist, setPlayerProtagonist] = useState<Card | null>(null);
  const [opponentProtagonist, setOpponentProtagonist] = useState<Card | null>(
    null
  );
  const [playerPersonas, setPlayerPersonas] = useState<Card[]>([]);
  const [opponentPersonas, setOpponentPersonas] = useState<Card[]>([]);
  const [playerDeckCards, setPlayerDeckCards] = useState<string[]>([]);
  const [opponentDeckCards, setOpponentDeckCards] = useState<string[]>([]);
  const [playerLoadedDeck, setPlayerLoadedDeck] = useState<Card[]>([]);
  const [opponentLoadedDeck, setOpponentLoadedDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [opponentHand, setOpponentHand] = useState<Card[]>([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isOpponentPersonaModalOpen, setIsOpponentPersonaModalOpen] =
    useState(false);
  const [playerGraveyard, setPlayerGraveyard] = useState<Card[]>([]);
  const [isDeckLoaded, setIsDeckLoaded] = useState(false);
  const [isPersonasLoaded, setIsPersonasLoaded] = useState(false);
  const [isMulliganModalOpen, setIsMulliganModalOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [opponentShuffling, setOpponentShuffling] = useState(false);

  // Track window width for responsive hand layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for opponent shuffle events
  useEffect(() => {
    const socket = (gameConnection as any).socket;
    if (!socket) return;

    const handleOpponentShuffle = () => {
      setOpponentShuffling(true);
      setTimeout(() => setOpponentShuffling(false), 800);
    };

    socket.on("lobby:opponentShuffle", handleOpponentShuffle);
    return () => {
      socket.off("lobby:opponentShuffle", handleOpponentShuffle);
    };
  }, []);

  // Load player deck ONCE
  useEffect(() => {
    console.log("[Playmat] playerState:", playerState);

    if (playerState?.protagonistId) {
      getCardFaces(playerState.protagonistId).then((f) => {
        setPlayerProtagonist(f.front || f.back || null);
      });
    }

    if (
      playerState?.personaCards &&
      playerState.personaCards.length > 0 &&
      !isPersonasLoaded
    ) {
      console.log(
        "[Playmat] Loading player personas:",
        playerState.personaCards
      );
      Promise.all(
        playerState.personaCards.map((id) =>
          getCardFaces(id)
            .then((f) => f.front || f.back)
            .catch(() => null)
        )
      ).then((cards) => {
        const sortedCards = (cards.filter(Boolean) as Card[]).sort(
          (a, b) => parseInt(a.cost || "0") - parseInt(b.cost || "0")
        );
        setPlayerPersonas(sortedCards);
        setIsPersonasLoaded(true);
      });
    }

    // Only load deck once to prevent resetting during gameplay
    if (
      playerState?.mainDeckCards &&
      playerState.mainDeckCards.length > 0 &&
      !isDeckLoaded
    ) {
      console.log(
        "[Playmat] Loading player main deck:",
        playerState.mainDeckCards
      );
      const deckIds = playerState.mainDeckCards.flatMap((entry) =>
        Array(entry.qty).fill(entry.id)
      );
      console.log("[Playmat] Expanded deck IDs:", deckIds);
      const shuffledDeckIds = shuffleArray(deckIds);
      setPlayerDeckCards(shuffledDeckIds);

      // Load the actual card data for deck display
      Promise.all(
        shuffledDeckIds.map((id, index) =>
          getCardFaces(id)
            .then((f) => {
              const card = f.front || f.back;
              // Create a unique instance for each card to avoid duplicate selection issues
              return card ? { ...card, _instanceId: `${id}-${index}` } : null;
            })
            .catch(() => null)
        )
      ).then((cards) => {
        setPlayerLoadedDeck(cards.filter(Boolean) as Card[]);
        setIsDeckLoaded(true);
      });
    }
  }, [playerState, isDeckLoaded, isPersonasLoaded]);

  // Load opponent deck
  useEffect(() => {
    console.log("[Playmat] opponentState:", opponentState);

    if (opponentState?.protagonistId) {
      getCardFaces(opponentState.protagonistId).then((f) => {
        setOpponentProtagonist(f.front || f.back || null);
      });
    }

    // Opponent personas are handled by the dedicated sync effect below

    // Only load from mainDeckCards if deckCards sync isn't available yet
    if (
      opponentState?.mainDeckCards &&
      opponentState.mainDeckCards.length > 0 &&
      !opponentState?.deckCards
    ) {
      console.log(
        "[Playmat] Loading opponent main deck:",
        opponentState.mainDeckCards
      );
      const deckIds = opponentState.mainDeckCards.flatMap((entry) =>
        Array(entry.qty).fill(entry.id)
      );
      console.log("[Playmat] Expanded deck IDs:", deckIds);
      const shuffledDeckIds = shuffleArray(deckIds);
      setOpponentDeckCards(shuffledDeckIds);

      // Load the actual card data for deck display
      Promise.all(
        shuffledDeckIds.map((id) =>
          getCardFaces(id)
            .then((f) => f.front || f.back)
            .catch(() => null)
        )
      ).then((cards) => {
        setOpponentLoadedDeck(cards.filter(Boolean) as Card[]);
      });
    }
    // Load opponent hand
    if (opponentState?.handCards && opponentState.handCards.length > 0) {
      Promise.all(
        opponentState.handCards.map((id) =>
          getCardFaces(id)
            .then((f) => f.front || f.back)
            .catch(() => null)
        )
      ).then((cards) => {
        setOpponentHand(cards.filter(Boolean) as Card[]);
      });
    } else {
      setOpponentHand([]);
    }
  }, [opponentState]);

  // Sync player hand to server when it changes
  useEffect(() => {
    const handCardIds = playerHand.map((card) => card.id);
    gameConnection.setHand(handCardIds);
  }, [playerHand]);

  // Sync player deck to server when it changes
  useEffect(() => {
    if (isDeckLoaded) {
      const deckCardIds = playerLoadedDeck.map((card) => card.id);
      gameConnection.setDeckCards(deckCardIds);
    }
  }, [playerLoadedDeck, isDeckLoaded]);

  // Sync player personas to server when it changes
  useEffect(() => {
    const personaCardIds = playerPersonas.map((card) => card.id);
    console.log("[Playmat] Syncing player personas to server:", personaCardIds);
    gameConnection.setPersonaCards(personaCardIds);
  }, [playerPersonas]);

  // Update opponent's visual deck when their deckCards sync arrives
  useEffect(() => {
    if (opponentState?.deckCards) {
      // Only update if we have deck cards synced from opponent
      Promise.all(
        opponentState.deckCards.map((id, index) =>
          getCardFaces(id)
            .then((f) => {
              const card = f.front || f.back;
              return card
                ? { ...card, _instanceId: `opp-${id}-${index}` }
                : null;
            })
            .catch(() => null)
        )
      ).then((cards) => {
        setOpponentLoadedDeck(cards.filter(Boolean) as Card[]);
      });
    }
  }, [opponentState?.deckCards]);

  // Update opponent's visual personas when their personaCards sync arrives
  useEffect(() => {
    console.log(
      "[Playmat] Opponent personaCards changed:",
      opponentState?.personaCards
    );
    if (
      opponentState?.personaCards !== undefined &&
      opponentState?.personaCards !== null
    ) {
      if (opponentState.personaCards.length === 0) {
        console.log("[Playmat] Setting opponent personas to empty");
        setOpponentPersonas([]);
      } else {
        console.log(
          "[Playmat] Loading opponent persona cards:",
          opponentState.personaCards
        );
        Promise.all(
          opponentState.personaCards.map((id) =>
            getCardFaces(id)
              .then((f) => f.front || f.back)
              .catch(() => null)
          )
        ).then((cards) => {
          console.log("[Playmat] Opponent personas loaded:", cards.length);
          const sortedCards = (cards.filter(Boolean) as Card[]).sort(
            (a, b) => parseInt(a.cost || "0") - parseInt(b.cost || "0")
          );
          setOpponentPersonas(sortedCards);
        });
      }
    }
  }, [opponentState?.personaCards]);

  const handleDrawCards = (count: number) => {
    const drawn = playerLoadedDeck.slice(0, count);
    const remaining = playerLoadedDeck.slice(count);

    console.log(
      "[Draw] Before:",
      playerLoadedDeck.length,
      "Drawing:",
      count,
      "After:",
      remaining.length
    );

    setPlayerHand((prev) => [...prev, ...drawn]);
    setPlayerLoadedDeck(remaining);
  };

  const handlePeepCards = (
    cards: Card[],
    decisions: Map<Card, "draw" | "discard" | "top" | "bottom">
  ) => {
    const toDraw: Card[] = [];
    const toDiscard: Card[] = [];
    const toTop: Card[] = [];
    const toBottom: Card[] = [];

    cards.forEach((card) => {
      const decision = decisions.get(card) || "top";
      if (decision === "draw") toDraw.push(card);
      else if (decision === "discard") toDiscard.push(card);
      else if (decision === "top") toTop.push(card);
      else if (decision === "bottom") toBottom.push(card);
    });

    // Remove peeked cards from deck by reference
    const newDeck = playerLoadedDeck.filter((c) => !cards.includes(c));
    // Add cards back in specified order
    const finalDeck = [...toTop, ...newDeck, ...toBottom];

    console.log(
      "[Peep] Before:",
      playerLoadedDeck.length,
      "After:",
      finalDeck.length
    );

    setPlayerHand((prev) => [...prev, ...toDraw]);
    setPlayerGraveyard((prev) => [...prev, ...toDiscard]);
    setPlayerLoadedDeck(finalDeck);
  };

  const handleFindCard = (card: Card) => {
    // Find by index since card objects in playerLoadedDeck are the actual instances
    const cardIndex = playerLoadedDeck.indexOf(card);

    console.log(
      "[Find] Card found at index:",
      cardIndex,
      "Current deck size:",
      playerLoadedDeck.length
    );

    if (cardIndex !== -1) {
      const newDeck = [...playerLoadedDeck];
      newDeck.splice(cardIndex, 1);

      console.log("[Find] New deck size:", newDeck.length);

      setPlayerHand((prev) => [...prev, card]);
      setPlayerLoadedDeck(newDeck);

      // Shuffle deck after finding a card
      shuffleDeck(newDeck);
    }
  };

  // Generic helper to draw a card from any deck to hand
  const drawCardToHand = (
    card: Card,
    sourceDeck: Card[],
    setSourceDeck: (cards: Card[]) => void
  ) => {
    const cardIndex = sourceDeck.indexOf(card);

    if (cardIndex !== -1) {
      const newDeck = [...sourceDeck];
      newDeck.splice(cardIndex, 1);

      setPlayerHand((prev) => [...prev, card]);
      setSourceDeck(newDeck);
    }
  };

  const shuffleDeck = (deckToShuffle?: Card[]) => {
    const currentDeck = deckToShuffle || playerLoadedDeck;
    const shuffled = shuffleArray(currentDeck);

    // Trigger shuffle animation locally and notify opponent
    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 800);
    gameConnection.triggerShuffle();

    setPlayerLoadedDeck(shuffled);
  };

  const handleMulliganConfirm = (cardsToMulligan: Card[]) => {
    // Remove mulligan cards from hand
    const newHand = playerHand.filter((c) => !cardsToMulligan.includes(c));

    // Put mulligan cards on bottom of deck
    const newDeck = [...playerLoadedDeck, ...cardsToMulligan];

    // Draw same number from top
    const drawn = newDeck.slice(0, cardsToMulligan.length);
    const remaining = newDeck.slice(cardsToMulligan.length);

    setPlayerHand([...newHand, ...drawn]);
    setPlayerLoadedDeck(remaining);
    setIsMulliganModalOpen(false);

    // Shuffle deck after mulligan
    setTimeout(() => shuffleDeck(remaining), 100);
  };

  const handleDrawPersona = (card: Card) => {
    drawCardToHand(card, playerPersonas, setPlayerPersonas);
    setIsPersonaModalOpen(false);
  };

  // Game start: draw 5 cards and open mulligan
  useEffect(() => {
    if (isDeckLoaded && !gameStarted && playerLoadedDeck.length === 45) {
      // Draw 5 cards
      const drawn = playerLoadedDeck.slice(0, 5);
      const remaining = playerLoadedDeck.slice(5);

      setPlayerHand(drawn);
      setPlayerLoadedDeck(remaining);
      setIsMulliganModalOpen(true);
      setGameStarted(true);
    }
  }, [isDeckLoaded, gameStarted, playerLoadedDeck.length]);

  return (
    <div className={styles.playmatRoot}>
      {/* Opponent Side (Top Half) */}
      <div className={styles.opponentSide}>
        {/* Opponent Left Zones */}
        <div className={styles.leftZones}>
          {/* Persona Deck (top) - mirrored */}
          <div
            className={styles.personaDeckZone}
            onClick={() =>
              opponentPersonas.length > 0 && setIsOpponentPersonaModalOpen(true)
            }
            style={{
              cursor: opponentPersonas.length > 0 ? "pointer" : "default",
            }}
          >
            <div className={styles.zoneLabel}>
              Persona ({opponentPersonas.length})
            </div>
            <div className={styles.cardStack}>
              {opponentPersonas.map((card, i) => (
                <div
                  key={i}
                  className={styles.stackedCard}
                  style={{ transform: `translateY(${i * 3}px)` }}
                >
                  <CardDisplay card={card} size={100} enableFlip={false} />
                </div>
              ))}
            </div>
          </div>

          {/* Oblivion Zone (bottom) - mirrored */}
          <div className={styles.oblivionZone}>
            <div className={styles.zoneLabel}>Oblivion</div>
          </div>
        </div>

        {/* Opponent Center Battle Grid */}
        <div className={styles.battleGrid}>
          {/* Top row - slot, protagonist, slot - mirrored */}
          <div className={styles.battleSlot}></div>
          <div className={styles.protagonistSlot}>
            {opponentProtagonist && (
              <CardDisplay card={opponentProtagonist} size={120} />
            )}
          </div>
          <div className={styles.battleSlot}></div>

          {/* Bottom row - 3 battle slots - mirrored */}
          <div className={styles.battleSlot}></div>
          <div className={styles.battleSlot}></div>
          <div className={styles.battleSlot}></div>
        </div>

        {/* Opponent Right Zones */}
        <div className={styles.rightZones}>
          {/* Graveyard (top) - mirrored */}
          <div className={styles.graveyardZone}>
            <div className={styles.zoneLabel}>Graveyard</div>
          </div>

          {/* Main Deck (bottom) - mirrored */}
          <div className={styles.mainDeckZone}>
            <div className={styles.zoneLabel}>
              Deck (
              {opponentState?.deckCards?.length || opponentLoadedDeck.length})
            </div>
            <div
              className={`${styles.cardStack} ${
                opponentShuffling ? styles.shuffling : ""
              }`}
            >
              {opponentLoadedDeck.length > 0 && (
                <div
                  className={styles.stackedCard}
                  style={{ transform: `translateY(0)` }}
                >
                  <CardDisplay
                    card={opponentLoadedDeck[0]}
                    size={100}
                    enableFlip={false}
                    startFlipped={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Separator */}
      <div className={styles.centerSeparator}></div>

      {/* Player Side (Bottom Half) */}
      <div className={styles.playerSide}>
        {/* Player Left Zones */}
        <div className={styles.leftZones}>
          {/* Oblivion Zone (top) */}
          <div className={styles.oblivionZone}>
            <div className={styles.zoneLabel}>Oblivion</div>
          </div>

          {/* Persona Deck (bottom) */}
          <div
            className={styles.personaDeckZone}
            onClick={() =>
              playerPersonas.length > 0 && setIsPersonaModalOpen(true)
            }
            style={{
              cursor: playerPersonas.length > 0 ? "pointer" : "default",
            }}
          >
            <div className={styles.zoneLabel}>
              Persona ({playerPersonas.length})
            </div>
            <div className={styles.cardStack}>
              {playerPersonas.map((card, i) => (
                <div
                  key={i}
                  className={styles.stackedCard}
                  style={{ transform: `translateY(${i * 3}px)` }}
                >
                  <CardDisplay card={card} size={100} enableFlip={false} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Player Center Battle Grid */}
        <div className={styles.battleGrid}>
          {/* Top row - 3 battle slots */}
          <div className={styles.battleSlot}></div>
          <div className={styles.battleSlot}></div>
          <div className={styles.battleSlot}></div>

          {/* Bottom row - slot, protagonist, slot */}
          <div className={styles.battleSlot}></div>
          <div className={styles.protagonistSlot}>
            {playerProtagonist && (
              <CardDisplay card={playerProtagonist} size={120} />
            )}
          </div>
          <div className={styles.battleSlot}></div>
        </div>

        {/* Player Right Zones */}
        <div className={styles.rightZones}>
          {/* Main Deck (top) */}
          <div
            className={styles.mainDeckZone}
            onClick={() =>
              playerLoadedDeck.length > 0 && setIsDeckModalOpen(true)
            }
            style={{
              cursor: playerLoadedDeck.length > 0 ? "pointer" : "default",
            }}
          >
            <div className={styles.zoneLabel}>
              Deck ({playerLoadedDeck.length})
            </div>
            <div
              className={`${styles.cardStack} ${
                isShuffling ? styles.shuffling : ""
              }`}
            >
              {playerLoadedDeck.length > 0 && (
                <div
                  className={styles.stackedCard}
                  style={{ transform: `translateY(0)` }}
                >
                  <CardDisplay
                    card={playerLoadedDeck[0]}
                    size={100}
                    enableFlip={false}
                    startFlipped={true}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Graveyard (bottom) */}
          <div className={styles.graveyardZone}>
            <div className={styles.zoneLabel}>Graveyard</div>
          </div>
        </div>
      </div>

      {/* Player Names */}
      <div className={styles.playerInfo}>
        <div className={styles.opponentName}>{opponentName || "Opponent"}</div>
        <div className={styles.playerName}>{playerName || "You"}</div>
      </div>

      {/* Opponent Hand */}
      <div className={styles.opponentHandZone}>
        <div className={styles.handCards}>
          {opponentHand.map((card, i) => {
            const cardWidth = CARD_SIZE;
            const maxWidth = windowWidth * 0.95;
            const totalWidthNeeded = opponentHand.length * cardWidth;
            const needsOverlap = totalWidthNeeded > maxWidth;
            const marginLeft =
              i === 0
                ? 0
                : needsOverlap
                ? -((totalWidthNeeded - maxWidth) / (opponentHand.length - 1))
                : 0;

            return (
              <div
                key={i}
                className={styles.handCard}
                style={{
                  zIndex: opponentHand.length - i,
                  marginLeft: `${marginLeft}px`,
                }}
              >
                <CardDisplay
                  card={card}
                  size={CARD_SIZE}
                  enableFlip={false}
                  startFlipped={true}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Player Hand */}
      <div className={styles.playerHandZone}>
        <div className={styles.handCards}>
          {playerHand.map((card, i) => {
            const cardWidth = CARD_SIZE;
            const maxWidth = windowWidth * 0.95;
            const totalWidthNeeded = playerHand.length * cardWidth;
            const needsOverlap = totalWidthNeeded > maxWidth;
            const marginLeft =
              i === 0
                ? 0
                : needsOverlap
                ? -((totalWidthNeeded - maxWidth) / (playerHand.length - 1))
                : 0;

            return (
              <div
                key={i}
                className={styles.handCard}
                style={{
                  zIndex: i,
                  marginLeft: `${marginLeft}px`,
                }}
              >
                <CardDisplay card={card} size={CARD_SIZE} enableFlip={false} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Deck Action Modal */}
      <DeckActionModal
        isOpen={isDeckModalOpen}
        onClose={() => setIsDeckModalOpen(false)}
        deckCards={playerLoadedDeck}
        onDraw={handleDrawCards}
        onPeep={handlePeepCards}
        onFind={handleFindCard}
      />

      {/* Mulligan Modal */}
      {isMulliganModalOpen && (
        <MulliganModal hand={playerHand} onConfirm={handleMulliganConfirm} />
      )}

      {/* Persona Selection Modal */}
      <PersonaSelectionModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        personaCards={playerPersonas}
        onSelectPersona={handleDrawPersona}
      />

      {/* Opponent Persona View Modal */}
      <PersonaSelectionModal
        isOpen={isOpponentPersonaModalOpen}
        onClose={() => setIsOpponentPersonaModalOpen(false)}
        personaCards={opponentPersonas}
        viewOnly={true}
      />
    </div>
  );
}
