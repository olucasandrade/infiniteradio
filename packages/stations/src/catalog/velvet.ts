import type { TrackSeed } from './tracks'

function t(title: string, artist: string, year: number, keyRootPc: number, scale: TrackSeed['scale'], energy: number, brightness: number, movement: number): TrackSeed {
  return { title, artist, year, keyRootPc, scale, energy, brightness, movement, rhythmicDensity: movement * 0.8, texture: brightness }
}

export const VELVET_TRACKS: readonly TrackSeed[] = [
  t('Really Love', "D'Angelo", 2014, 2, 'naturalMinor', 0.4, 0.4, 0.45),
  t('Untitled (How Does It Feel)', "D'Angelo", 2000, 1, 'naturalMinor', 0.48, 0.35, 0.5),
  t('Send It On', "D'Angelo", 2000, 3, 'dorian', 0.38, 0.42, 0.44),
  t('Africa', "D'Angelo", 2000, 6, 'dorian', 0.35, 0.4, 0.4),
  t('On & On', 'Erykah Badu', 1997, 4, 'dorian', 0.5, 0.45, 0.55),
  t("Didn't Cha Know", 'Erykah Badu', 2000, 8, 'naturalMinor', 0.42, 0.38, 0.48),
  t('Cleva', 'Erykah Badu', 2000, 10, 'dorian', 0.34, 0.42, 0.4),
  t('Kiss of Life', 'Sade', 1992, 9, 'major', 0.5, 0.52, 0.5),
  t('Love Is Stronger Than Pride', 'Sade', 1988, 2, 'naturalMinor', 0.4, 0.4, 0.44),
  t('No Ordinary Love', 'Sade', 1992, 0, 'naturalMinor', 0.44, 0.35, 0.42),
  t('So Beautiful', 'Robert Glasper Experiment', 2012, 8, 'major', 0.3, 0.45, 0.3),
  t('Calls', 'Robert Glasper Experiment', 2013, 5, 'major', 0.44, 0.5, 0.48),
  t('Move Love', 'Robert Glasper Experiment', 2011, 3, 'dorian', 0.42, 0.45, 0.5),
  t('Butterfly', 'Robert Glasper', 2016, 7, 'major', 0.36, 0.52, 0.4),
  t('He Loves Me (Lyzel in E Flat)', 'Jill Scott', 2000, 3, 'major', 0.38, 0.48, 0.42),
  t('A Long Walk', 'Jill Scott', 2000, 5, 'dorian', 0.5, 0.5, 0.55),
  t('Just Friends (Sunny)', 'Musiq Soulchild', 2000, 9, 'major', 0.52, 0.56, 0.56),
  t('Video', 'India.Arie', 2001, 0, 'major', 0.46, 0.54, 0.48),
  t('Green & Gold', 'Lianne La Havas', 2015, 2, 'major', 0.5, 0.58, 0.52),
  t('Nakamarra', 'Hiatus Kaiyote', 2012, 6, 'dorian', 0.44, 0.52, 0.5),
  t('The Seed (2.0)', 'The Roots', 2002, 4, 'naturalMinor', 0.62, 0.45, 0.65),
]
