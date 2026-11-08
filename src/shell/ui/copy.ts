/**
 * Every word the shell shows the player, in pt-BR (FR-014, FR-025, research
 * D12 of spec 003). Games bring their own copy (name, round-entry labels,
 * rejection messages); nothing here names a game.
 *
 * `Record` over the code unions makes a new error code or discard reason
 * without copy a compile error (SC-005).
 */
import type { DiscardReason } from '../match/persistence';
import type { MatchError } from '../match/types';

export const errorCopy: Record<MatchError['code'], string> = {
  game_not_found: 'Esse jogo não está disponível.',
  match_in_progress: 'Já existe uma partida em andamento. Termine ou abandone antes.',
  no_match: 'Não há partida. Escolha um jogo.',
  invalid_status: 'Essa ação não está disponível agora.',
  roster_full: 'A partida já tem o máximo de jogadores.',
  roster_too_small: 'Faltam jogadores para começar.',
  roster_too_large: 'Há mais jogadores do que o jogo permite.',
  blank_name: 'Digite um nome.',
  name_too_long: 'O nome pode ter no máximo 30 caracteres.',
  invalid_name: 'O nome tem caracteres inválidos.',
  duplicate_name: 'Já existe um jogador com esse nome.',
  player_not_found: 'Esse jogador não está mais na partida.',
  round_not_found: 'Essa rodada não existe mais.',
  invalid_draft: 'Não foi possível guardar a rodada. Tente de novo.',
  invalid_round: 'A rodada tem problemas.',
};

const notRecovered = 'Não foi possível recuperar a partida anterior';

export const discardCopy: Record<DiscardReason, string> = {
  unreadable: `${notRecovered}: os dados salvos estavam danificados.`,
  wrong_shape: `${notRecovered}: os dados salvos estavam danificados.`,
  unsupported_version: `${notRecovered}: ela foi salva por uma versão incompatível do app.`,
  unknown_game: `${notRecovered}: o jogo dela não está mais disponível.`,
  invalid_round: `${notRecovered}: uma das rodadas não é mais válida.`,
};

export function rosterLimitCopy(min: number, max: number): string {
  return min === max ? `Este jogo é para ${min} jogadores.` : `De ${min} a ${max} jogadores.`;
}

export function missingPlayersCopy(missing: number): string {
  return missing === 1
    ? 'Falta 1 jogador para começar.'
    : `Faltam ${missing} jogadores para começar.`;
}

export function roundCopy(round: number): string {
  return `Rodada ${round}`;
}

export function fixRoundCopy(round: number): string {
  return `Corrigir rodada ${round}`;
}

export function positionCopy(position: number): string {
  return `${position}º`;
}

/** Screen headings. The static-build guard checks none reaches the built HTML. */
export const headings = {
  gameList: 'Escolha o jogo',
  setup: 'Quem vai jogar?',
  winner: 'Fim de partida',
  finish: 'Finalizar a partida?',
  tie: 'Empate!',
  history: 'Histórico',
  removeLastRound: 'Remover a última rodada?',
  renamePlayer: 'Quem vai trocar de nome?',
  abandon: 'Abandonar a partida?',
} as const;

export const labels = {
  appTitle: 'Facillit Games',
  noGames: 'Nenhum jogo disponível ainda.',
  playerName: 'Nome do jogador',
  add: 'Adicionar',
  remove: 'Remover',
  rename: 'Renomear',
  ok: 'OK',
  start: 'Iniciar partida',
  confirmRound: 'Confirmar rodada',
  finish: 'Finalizar',
  keepPlaying: 'Continuar',
  standings: 'Classificação',
  total: 'Total',
  player: 'Jogador',
  winnerIs: 'Vitória de',
  sharedWin: 'Vitória dividida entre',
  rematch: 'Revanche',
  newMatch: 'Nova partida',
  roundProblems: 'Corrija antes de confirmar:',
  dismiss: 'Entendi',
  points: 'pts',
  greetingTitle: 'Bora jogar?',
  greetingText: 'Toque no jogo da mesa para começar.',
  openHistory: 'Ver histórico',
  moreActions: 'Mais opções',
  renamePlayer: 'Renomear jogador',
  removeLastRound: 'Remover última rodada',
  newName: 'Novo nome',
  save: 'Salvar',
  cancel: 'Cancelar',
  close: 'Fechar',
  abandon: 'Abandonar partida',
  abandonWarning: 'Os jogadores e as rodadas desta partida serão apagados.',
  abandonConfirm: 'Abandonar',
  theme: 'Tema',
  themeAuto: 'Automático',
  themeLight: 'Claro',
  themeDark: 'Escuro',
  notSaved:
    'Não foi possível salvar neste aparelho. Se o app for fechado, a partida pode se perder.',
} as const;
