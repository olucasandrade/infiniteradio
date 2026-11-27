import type { TrackSeed } from './tracks'

function t(title: string, artist: string, year: number, keyRootPc: number, scale: TrackSeed['scale'], energy: number, brightness: number, movement: number, texture: number): TrackSeed {
  return { title, artist, year, keyRootPc, scale, energy, brightness, movement, texture, rhythmicDensity: movement * 0.55 }
}

export const VAPORWAVE_TRACKS: readonly TrackSeed[] = [
  t('リサフランク420 / 現代のコンピュー', 'Macintosh Plus', 2011, 6, 'major', 0.34, 0.58, 0.3, 0.82),
  t('恢复', '2814', 2015, 2, 'naturalMinor', 0.2, 0.38, 0.18, 0.7),
  t('遠くの愛好家', '2814', 2015, 9, 'naturalMinor', 0.22, 0.34, 0.2, 0.72),
  t('新宿ゴールデン街', '2814', 2015, 5, 'dorian', 0.24, 0.32, 0.22, 0.68),
  t('ふわっと', '2814', 2015, 0, 'major', 0.2, 0.5, 0.18, 0.66),
  t('悲哀', '2814', 2015, 3, 'naturalMinor', 0.18, 0.25, 0.15, 0.8),
  t('真実の恋', '2814', 2015, 7, 'major', 0.24, 0.5, 0.22, 0.65),
  t('テレパシー', '2814', 2015, 1, 'dorian', 0.22, 0.4, 0.2, 0.7),
  t('新しい日の誕生', '2814', 2015, 4, 'major', 0.25, 0.52, 0.25, 0.62),
  t('Resonance', 'HOME', 2014, 9, 'naturalMinor', 0.5, 0.6, 0.5, 0.35),
  t('Native', 'HOME', 2014, 2, 'major', 0.42, 0.62, 0.42, 0.32),
  t('Decay', 'HOME', 2014, 5, 'naturalMinor', 0.38, 0.42, 0.4, 0.5),
  t('Oort Cloud', 'HOME', 2014, 7, 'dorian', 0.36, 0.48, 0.35, 0.45),
  t('Tides', 'HOME', 2014, 10, 'major', 0.44, 0.55, 0.46, 0.38),
  t('Odyssey', 'HOME', 2014, 0, 'major', 0.48, 0.64, 0.48, 0.3),
  t('B:/ Start Up', 'Blank Banshee', 2012, 6, 'major', 0.42, 0.62, 0.45, 0.48),
  t('Dreamcast', 'Blank Banshee', 2012, 1, 'major', 0.5, 0.65, 0.52, 0.42),
  t('Teen Pregnancy', 'Blank Banshee', 2012, 8, 'naturalMinor', 0.54, 0.55, 0.58, 0.55),
  t('Ammonia Clouds', 'Blank Banshee', 2012, 3, 'dorian', 0.4, 0.5, 0.44, 0.5),
  t('S.W.A.K.', 'Luxury Elite', 2015, 5, 'major', 0.38, 0.58, 0.36, 0.62),
  t('Upscale', 'Luxury Elite', 2015, 10, 'major', 0.4, 0.6, 0.4, 0.58),
]
