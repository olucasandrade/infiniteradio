import type { TrackSeed } from './tracks'

function t(
  title: string,
  artist: string,
  year: number,
  keyRootPc: number,
  scale: TrackSeed['scale'],
  energy: number,
  brightness: number,
  movement: number,
): TrackSeed {
  return {
    title,
    artist,
    year,
    keyRootPc,
    scale,
    energy,
    brightness,
    movement,
    texture: brightness,
    rhythmicDensity: movement * 0.75,
  }
}

export const INDIE_TRACKS: readonly TrackSeed[] = [
  t('Intro', 'The xx', 2009, 2, 'naturalMinor', 0.4, 0.4, 0.42),
  t('Crystalised', 'The xx', 2009, 7, 'naturalMinor', 0.5, 0.45, 0.52),
  t('VCR', 'The xx', 2009, 0, 'major', 0.42, 0.52, 0.45),
  t('Islands', 'The xx', 2009, 8, 'naturalMinor', 0.48, 0.42, 0.5),
  t('Space Song', 'Beach House', 2015, 3, 'major', 0.35, 0.55, 0.35),
  t('Levitation', 'Beach House', 2015, 9, 'naturalMinor', 0.38, 0.48, 0.4),
  t('Beyond Love', 'Beach House', 2015, 4, 'major', 0.36, 0.5, 0.38),
  t('Myth', 'Beach House', 2012, 1, 'major', 0.4, 0.58, 0.42),
  t('Holocene', 'Bon Iver', 2011, 0, 'major', 0.4, 0.62, 0.45),
  t('Perth', 'Bon Iver', 2011, 2, 'major', 0.52, 0.58, 0.58),
  t('Michicant', 'Bon Iver', 2011, 7, 'major', 0.35, 0.6, 0.38),
  t('29 #Strafford APTS', 'Bon Iver', 2016, 5, 'dorian', 0.44, 0.4, 0.48),
  t('Show Me How', 'Men I Trust', 2018, 9, 'major', 0.4, 0.55, 0.45),
  t('Tailwhip', 'Men I Trust', 2017, 11, 'major', 0.42, 0.52, 0.46),
  t('Numb', 'Men I Trust', 2019, 6, 'naturalMinor', 0.38, 0.42, 0.4),
  t('Seven', 'Men I Trust', 2018, 2, 'dorian', 0.44, 0.5, 0.48),
  t('Your Hand in Mine', 'Explosions in the Sky', 2003, 4, 'major', 0.48, 0.62, 0.6),
  t('First Breath After Coma', 'Explosions in the Sky', 2001, 7, 'major', 0.55, 0.58, 0.65),
  t(
    'The Birth and Death of the Day',
    'Explosions in the Sky',
    2007,
    0,
    'naturalMinor',
    0.6,
    0.5,
    0.7,
  ),
  t("Nothing's Gonna Hurt You Baby", 'Cigarettes After Sex', 2012, 1, 'major', 0.28, 0.42, 0.3),
  t('K.', 'Cigarettes After Sex', 2017, 8, 'major', 0.3, 0.45, 0.32),
]
