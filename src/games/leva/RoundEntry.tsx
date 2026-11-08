/**
 * LEVA round entry (spec 007 FR-014–FR-019, research D5–D7): the round's
 * cards, then per living player a guess (0…cards), then how many they took.
 * The draft is `{ cards, step, guesses, taken }`; the next round's cards and
 * players come from `rounds` (`nextRound`). A stored round (no `step`) is a
 * round being fixed: its own cards and players, opened on the results.
 * Anything unreadable renders as an empty round (spec 003 round-entry
 * contract). The shell's 3D buttons and tokens only.
 */
import { useEffect } from 'react';

import type { PlayerRef, RoundEntryProps } from '../../shell/game/contract';
import { cardsLabel, isRecord, nextRound, validateRound } from './rules';

type Step = 'guess' | 'taken';

interface Draft {
  readonly cards: number;
  readonly step: Step;
  readonly guesses: Record<string, number>;
  readonly taken: Record<string, number>;
  /** Set while fixing a stored round, which keeps its own cards and players. */
  readonly fixing?: readonly string[];
}

function values(raw: unknown, ids: readonly string[], cards: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (isRecord(raw)) {
    for (const id of ids) {
      const value = raw[id];
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= cards) {
        out[id] = value;
      }
    }
  }
  return out;
}

function livesLabel(lives: number): string {
  return lives === 1 ? '1 vida' : `${lives} vidas`;
}

/** Which round this is, and the draft as far as it can be read. */
function read(value: unknown, rounds: readonly unknown[], players: readonly PlayerRef[]) {
  const before = nextRound(rounds, players);
  const roster = (ids: readonly string[]) => players.filter((player) => ids.includes(player.id));

  let fixing: readonly string[] | undefined;
  let cards = before.cards;
  let step: Step = 'guess';
  if (isRecord(value)) {
    const stored = validateRound(value, players);
    const marked = value.fixing;
    if (Array.isArray(marked) && typeof value.cards === 'number') {
      fixing = marked.filter((id): id is string => typeof id === 'string');
      cards = value.cards;
    } else if (value.step === undefined && stored.ok) {
      fixing = Object.keys(stored.round.guesses);
      cards = stored.round.cards;
      step = 'taken';
    }
    if (value.step === 'taken') {
      step = 'taken';
    }
  }

  const playing = fixing === undefined ? before.alive : roster(fixing);
  const ids = playing.map((player) => player.id);
  const source = isRecord(value) ? value : {};
  const draft: Draft = {
    cards,
    step,
    guesses: values(source.guesses, ids, cards),
    taken: values(source.taken, ids, cards),
    ...(fixing === undefined ? {} : { fixing: ids }),
  };
  return { draft, playing, lives: before.lives, fixing: fixing !== undefined };
}

export default function RoundEntry({ players, value, rounds, onChange }: RoundEntryProps) {
  const { draft, playing, lives, fixing } = read(value, rounds, players);
  const over = !fixing && playing.length <= 1;

  // Keep the stored draft in step with the match (research D5, D7): a past
  // round fixed meanwhile can change the cards or who is still alive.
  const expected = over ? undefined : JSON.stringify(draft);
  const actual = value === undefined ? undefined : JSON.stringify(value);
  useEffect(() => {
    if (!fixing && actual !== undefined && actual !== expected) {
      onChange(expected === undefined ? undefined : (JSON.parse(expected) as unknown));
    }
  }, [fixing, actual, expected, onChange]);

  if (over) {
    const winner = playing[0];
    return (
      <div data-testid="leva-over" className="flex flex-col items-center gap-1 py-4 text-center">
        <p className="text-2xl font-extrabold">
          {winner === undefined ? 'Ninguém sobrou.' : `Vitória de ${winner.name}!`}
        </p>
        <p className="text-ink-muted">Toque em finalizar para ver o resultado.</p>
      </div>
    );
  }

  const { cards, step } = draft;
  const ids = playing.map((player) => player.id);
  const field = step === 'guess' ? 'guesses' : 'taken';
  const choices = Array.from({ length: cards + 1 }, (_, n) => n);
  const set = (id: string, n: number) => {
    const current = draft[field];
    const next = { ...current };
    if (current[id] === n) {
      delete next[id];
    } else {
      next[id] = n;
    }
    // Same key order as `read`, so the stored draft compares equal (D5).
    onChange({ ...draft, [field]: values(next, ids, cards) });
  };
  const guessLabel = (n: number) => (cards > 1 ? String(n) : n === 1 ? 'Leva' : 'Não leva');
  const choiceLabel = (n: number) =>
    step === 'guess' || cards > 1 ? guessLabel(n) : n === 1 ? 'Levou' : 'Não levou';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 px-1">
        <p data-testid="leva-cards" className="text-2xl font-extrabold">
          {cardsLabel(cards)}
        </p>
        <p className="font-bold text-ink-muted">
          {step === 'guess' ? 'Palpites' : 'Quantas levou'}
        </p>
      </div>
      {playing.map((player) => {
        const mine = draft[field][player.id];
        const guess = draft.guesses[player.id];
        return (
          <div
            key={player.id}
            data-testid="leva-player"
            className="flex flex-col gap-2 rounded-control bg-surface-sunken p-2"
          >
            <div className="flex items-baseline gap-2 pl-1">
              <span className="min-w-0 flex-1 truncate text-lg font-bold" title={player.name}>
                {player.name}
              </span>
              {step === 'taken' && (
                <span className="text-sm font-bold">
                  Palpite: {guess === undefined ? '—' : guessLabel(guess)}
                </span>
              )}
              <span className="text-sm text-ink-muted">{livesLabel(lives[player.id] ?? 0)}</span>
            </div>
            <div className={`grid gap-2 ${cards > 1 ? 'grid-cols-5' : 'grid-cols-2'}`}>
              {choices.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={mine === n}
                  aria-label={`${player.name}: ${step === 'guess' ? 'palpite' : 'levou'} ${choiceLabel(n)}`}
                  onClick={() => set(player.id, n)}
                  className={`btn-3d px-0 ${mine === n ? 'btn-blue' : 'btn-plain'}`}
                >
                  {choiceLabel(n)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        data-testid="leva-step"
        onClick={() => onChange({ ...draft, step: step === 'guess' ? 'taken' : 'guess' })}
        className={`btn-3d w-full ${step === 'guess' ? 'btn-green' : 'btn-plain'}`}
      >
        {step === 'guess' ? 'Jogar a rodada: marcar quem levou' : 'Voltar aos palpites'}
      </button>
    </div>
  );
}
