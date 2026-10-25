import { ComponentType } from 'react';
import { Dota2Icon, BrawlIcon, Cs2Icon, DdnetIcon, MinecraftIcon } from './GameIcons';
export interface GameInfo { id: string; name: string; desc: string; icon: ComponentType<{ size?: number; className?: string }>; grad: string }
export const GAMES: GameInfo[] = [
  { id: 'DOTA2', name: 'Dota 2', desc: 'Пятёрка для рейтинга или весёлая обычка.', icon: Dota2Icon, grad: 'from-rose-500/30 to-violet-600/20' },
  { id: 'BRAWL_STARS', name: 'Brawl Stars', desc: 'Тройка для трофеев и событий.', icon: BrawlIcon, grad: 'from-amber-400/30 to-fuchsia-500/20' },
  { id: 'CS2', name: 'Counter-Strike 2', desc: 'Команда для матчмейкинга и фейсита.', icon: Cs2Icon, grad: 'from-sky-500/30 to-blue-700/20' },
  { id: 'DDNET', name: 'DDNet', desc: 'Напарники для кооперативных карт.', icon: DdnetIcon, grad: 'from-emerald-400/30 to-cyan-600/20' },
  { id: 'MINECRAFT', name: 'Minecraft', desc: 'Лобби для игры на популярных серверах.', icon: MinecraftIcon, grad: 'from-lime-500/30 to-emerald-700/20' },
];
export const SERVERS = ['FunTime', 'ReallyWorld', 'FunnyMC', 'Cristalix', 'MineLegacy', 'SpookyTime'];
export const DEFAULT_SIZE: Record<string, number> = { DOTA2: 5, BRAWL_STARS: 3, CS2: 5, DDNET: 2 };
export const MODES: Record<string, string[]> = {
  DOTA2: ['Керри', 'Мид', 'Оффлейн', 'Саппорт'],
  BRAWL_STARS: ['Гем-грэб', 'Награда', 'Броулбол'],
  CS2: ['Соревновательный', 'Премьер', 'Вингмен'],
  DDNET: ['Кооператив', 'Спидран'],
};
export const GOALS: Record<string, string> = { ranked: 'Рейтинговая игра', casual: 'Обычная игра', learning: 'Обучение', chat: 'Просто общение' };
